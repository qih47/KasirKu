"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateItemCommission } from "@/modules/commission/commission-engine";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "CARD";

async function requireCashierOrOwner() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko/kasir.");
  }
  return session.user as any;
}

export interface CartItemInput {
  productId: string;
  qty: number;
  price: number;
  name: string;
  staffId?: string;
  bookingId?: string;
  notes?: string;
}


export async function createTransactionAction(data: {
  shiftId: string;
  outletId: string;
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
}) {
  const user = await requireCashierOrOwner();
  const { shiftId, outletId, items, paymentMethod, amountPaid } = data;

  if (!items || items.length === 0) {
    throw new Error("Keranjang belanja kosong.");
  }

  // Hitung total tagihan
  const totalAmount = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  if (amountPaid < totalAmount) {
    throw new Error(
      `Uang yang dibayarkan (Rp ${amountPaid.toLocaleString(
        "id-ID"
      )}) kurang dari total tagihan (Rp ${totalAmount.toLocaleString("id-ID")}).`
    );
  }

  // Generate nomor transaksi unik TRX-YYYYMMDD-XXXX
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `TRX-${todayStr}-${randomSuffix}`;

  // Eksekusi atomic transaction
  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Buat Header Transaksi shift masih aktif
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift || shift.closedAt !== null) {
      throw new Error("Shift kasir sudah ditutup. Tidak dapat memproses transaksi.");
    }

    // 2. Buat record Transaksi utama
    const newTransaction = await tx.transaction.create({
      data: {
        outletId,
        shiftId,
        transactionNumber,
        totalAmount,
        status: "PAID",
      },
    });

    // 3. Simpan item-item transaksi & update stok barang
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Produk "${item.name}" tidak ditemukan.`);
      }

      // Kurangi stok di OutletStock & catat pergerakan StockMovement jika bertipe BARANG
      let targetOutletStock = null;
      if (product.type === "BARANG") {
        targetOutletStock = await tx.outletStock.findUnique({
          where: {
            outletId_productId: {
              outletId,
              productId: item.productId,
            },
          },
        });

        const currentStock = targetOutletStock
          ? targetOutletStock.stockQty
          : (product.stockQty ?? 0);

        if (currentStock < item.qty) {
          throw new Error(
            `Stok untuk "${product.name}" di cabang ini tidak mencukupi (Tersisa ${currentStock}, diminta ${item.qty}).`
          );
        }

        if (targetOutletStock) {
          await tx.outletStock.update({
            where: { id: targetOutletStock.id },
            data: { stockQty: currentStock - item.qty },
          });
        } else {
          targetOutletStock = await tx.outletStock.create({
            data: {
              outletId,
              productId: item.productId,
              stockQty: Math.max(0, currentStock - item.qty),
              isAvailable: true,
            },
          });
        }

        // Update legacy product stockQty juga untuk sinkronisasi
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: Math.max(0, (product.stockQty ?? 0) - item.qty) },
        });
      }

      // Buat detail item transaksi
      const trxItem = await tx.transactionItem.create({
        data: {
          transactionId: newTransaction.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          subtotal: item.qty * item.price,
        },
      });

      // Catat baris ledger StockMovement (type: OUT)
      if (product.type === "BARANG" && targetOutletStock) {
        await tx.stockMovement.create({
          data: {
            outletStockId: targetOutletStock.id,
            type: "OUT",
            qty: item.qty,
            referenceId: trxItem.id,
            performedById: user.id || null,
            note: `Penjualan Kasir POS #${transactionNumber}`,
            status: "CONFIRMED",
          },
        });
      }

      // Hitung komisi jika item memiliki penugasan staff / kapster / terapis
      if (item.staffId) {
        const staffUser = await tx.user.findUnique({ where: { id: item.staffId } });
        const calcResult = calculateItemCommission({
          item: {
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            staffId: item.staffId,
          },
          product: {
            type: product.type as any,
            price: Number(product.price),
            attributes: (product.attributes as any) || {},
          },
          staffUser: staffUser
            ? { id: staffUser.id, name: staffUser.name, attributes: (staffUser.attributes as any) || {} }
            : null,
        });

        if (calcResult && calcResult.amount > 0) {
          await tx.staffCommission.create({
            data: {
              tenantId: user.tenantId,
              outletId,
              staffId: item.staffId,
              transactionItemId: trxItem.id,
              commissionType: calcResult.commissionType,
              rate: calcResult.rate,
              amount: calcResult.amount,
            },
          });
        }
      }

      // Jika transaksi ini berasal dari antrian booking, ubah status antrian menjadi COMPLETED
      if (item.bookingId) {
        await tx.booking.update({
          where: { id: item.bookingId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }
    }

    // 4. Catat record Pembayaran
    const payment = await tx.payment.create({
      data: {
        transactionId: newTransaction.id,
        method: paymentMethod,
        amount: totalAmount,
        status: "SUCCESS",
      },
    });

    // Ambil data transaksi lengkap untuk dicetak struk
    const fullTransaction = await tx.transaction.findUnique({
      where: { id: newTransaction.id },
      include: {
        outlet: {
          include: { tenant: true },
        },
        shift: {
          include: { kasir: true },
        },
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    return {
      transaction: fullTransaction,
      change: amountPaid - totalAmount,
      amountPaid,
    };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");

  return { success: true, ...result };
}

export async function getTransactionHistoryAction(params: {
  outletId?: string;
  shiftId?: string;
  limit?: number;
}) {
  const user = await requireCashierOrOwner();
  const targetOutletId = params.outletId || user.outletId;

  const whereClause: any = {};

  if (targetOutletId) {
    whereClause.outletId = targetOutletId;
  } else {
    whereClause.outlet = { tenantId: user.tenantId };
  }

  if (params.shiftId) {
    whereClause.shiftId = params.shiftId;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: params.limit || 50,
    include: {
      outlet: { include: { tenant: true } },
      shift: { include: { kasir: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });

  return transactions;
}
