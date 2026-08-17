"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

      // Kurangi stok jika produk bertipe BARANG
      if (product.type === "BARANG") {
        const currentStock = product.stockQty ?? 0;
        if (currentStock < item.qty) {
          throw new Error(
            `Stok untuk "${product.name}" tidak mencukupi (Tersisa ${currentStock}, diminta ${item.qty}).`
          );
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: currentStock - item.qty },
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

      // Hitung komisi jika item memiliki penugasan staff / kapster (Barbershop)
      if (item.staffId) {
        const productAttrs: any = product.attributes || {};
        const commissionType = productAttrs.commissionType || "PERCENTAGE";
        const commissionRate = productAttrs.commissionValue || 30; // default 30% bagi hasil
        const itemSubtotal = item.qty * item.price;
        const commissionAmount =
          commissionType === "PERCENTAGE"
            ? (itemSubtotal * commissionRate) / 100
            : commissionRate * item.qty;

        await tx.staffCommission.create({
          data: {
            tenantId: user.tenantId,
            outletId,
            staffId: item.staffId,
            transactionItemId: trxItem.id,
            commissionType,
            rate: commissionRate,
            amount: commissionAmount,
          },
        });
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
