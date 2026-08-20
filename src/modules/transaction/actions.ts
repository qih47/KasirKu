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
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis/kasir.");
  }
  return session.user as any;
}

export interface CartItemInput {
  productId: string;
  qty: number;
  price: number;
  name: string;
  imageUrl?: string | null;
  staffId?: string;
  bookingId?: string;
  notes?: string;
}

export type DiscountType = "PERCENT" | "FIXED" | "VOUCHER";

export interface VoucherValidationResult {
  valid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  description: string;
  minOrder?: number;
}

export async function verifyVoucherAction(code: string, subtotal: number): Promise<VoucherValidationResult> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const now = new Date();

  if (!tenantId) {
    throw new Error("Sesi tidak valid atau tenant tidak ditemukan.");
  }

  // Cek di Database Voucher milik Tenant Owner
  const dbVoucher = await prisma.voucher.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: normalized,
      },
    },
  });

  if (!dbVoucher) {
    throw new Error(`Kode voucher "${normalized}" tidak terdaftar di sistem bisnis Anda.`);
  }

  if (!dbVoucher.isActive) {
    throw new Error(`Voucher "${normalized}" sedang dinonaktifkan oleh Owner.`);
  }
  if (dbVoucher.startDate && new Date(dbVoucher.startDate) > now) {
    throw new Error(
      `Voucher "${normalized}" baru dapat digunakan mulai tanggal ${new Date(dbVoucher.startDate).toLocaleDateString("id-ID")}.`
    );
  }
  if (dbVoucher.endDate && new Date(dbVoucher.endDate) < now) {
    throw new Error(`Voucher "${normalized}" sudah kedaluwarsa pada tanggal ${new Date(dbVoucher.endDate).toLocaleDateString("id-ID")}.`);
  }
  if (dbVoucher.usageLimit !== null && dbVoucher.usedCount >= dbVoucher.usageLimit) {
    throw new Error(`Kuota voucher "${normalized}" telah habis (${dbVoucher.usedCount}/${dbVoucher.usageLimit} digunakan).`);
  }

  const minOrderNum = Number(dbVoucher.minOrder || 0);
  if (subtotal < minOrderNum) {
    throw new Error(
      `Voucher "${normalized}" membutuhkan minimum belanja Rp ${minOrderNum.toLocaleString("id-ID")}. (Subtotal saat ini: Rp ${subtotal.toLocaleString("id-ID")})`
    );
  }

  const discountValNum = Number(dbVoucher.discountValue);
  const maxDiscountNum = dbVoucher.maxDiscount ? Number(dbVoucher.maxDiscount) : undefined;
  let discountAmount = 0;

  if (dbVoucher.discountType === "PERCENT") {
    discountAmount = Math.round((subtotal * discountValNum) / 100);
    if (maxDiscountNum && discountAmount > maxDiscountNum) {
      discountAmount = maxDiscountNum;
    }
  } else {
    discountAmount = discountValNum;
  }

  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  return {
    valid: true,
    code: normalized,
    discountType: dbVoucher.discountType as DiscountType,
    discountValue: discountValNum,
    discountAmount,
    description: dbVoucher.description || `Voucher ${normalized}`,
    minOrder: minOrderNum,
  };
}

export async function createTransactionAction(data: {
  shiftId: string;
  outletId: string;
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  discountType?: DiscountType | null;
  discountValue?: number;
  discountAmount?: number;
  voucherCode?: string | null;
  taxAmount?: number;
  serviceCharge?: number;
  customerId?: string | null;
  tableId?: string | null;
  orderType?: "DINE_IN" | "TAKEAWAY" | "STANDARD";
  splitPayments?: { method: PaymentMethod; amount: number }[];
  laundryDetails?: {
    customerName?: string;
    customerPhone?: string;
    weightKg?: number;
    unitQty?: number;
    fragrance?: string;
    rackNumber?: string;
  } | null;
}) {
  const user = await requireCashierOrOwner();
  const {
    shiftId,
    outletId,
    items,
    paymentMethod,
    amountPaid,
    discountType,
    discountValue,
    discountAmount,
    voucherCode,
    taxAmount = 0,
    serviceCharge = 0,
    customerId,
    tableId,
    orderType,
    splitPayments,
    laundryDetails,
  } = data;

  if (!items || items.length === 0) {
    throw new Error("Keranjang belanja kosong.");
  }

  // Hitung subtotal produk
  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  // Hitung diskon yang valid
  let finalDiscountAmount = 0;
  if (discountType === "PERCENT" && discountValue) {
    finalDiscountAmount = Math.round((subtotalAmount * discountValue) / 100);
  } else if (discountType === "FIXED" && discountValue) {
    finalDiscountAmount = discountValue;
  } else if (discountType === "VOUCHER" && discountAmount) {
    finalDiscountAmount = discountAmount;
  } else if (discountAmount) {
    finalDiscountAmount = discountAmount;
  }

  finalDiscountAmount = Math.min(subtotalAmount, Math.max(0, finalDiscountAmount));

  // Hitung grand total akhir
  const totalAmount = Math.max(
    0,
    subtotalAmount - finalDiscountAmount + Number(taxAmount || 0) + Number(serviceCharge || 0)
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

    // 2. Buat record Transaksi utama dengan detail diskon & pajak
    const newTransaction = await tx.transaction.create({
      data: {
        outletId,
        shiftId,
        customerId: customerId || null,
        transactionNumber,
        subtotalAmount,
        discountAmount: finalDiscountAmount,
        discountType: discountType || null,
        discountValue: discountValue || 0,
        voucherCode: voucherCode || null,
        taxAmount: Number(taxAmount || 0),
        serviceCharge: Number(serviceCharge || 0),
        totalAmount,
        status: "PAID",
      },
    });

    // 2b. Jika ada customerId, akumulasikan statistik pelanggan (visits & totalSpent)
    if (customerId) {
      await (tx as any).customer.update({
        where: { id: customerId },
        data: {
          visits: { increment: 1 },
          totalSpent: { increment: totalAmount },
          lastVisitAt: new Date(),
        },
      });
    }

    // 2c. Jika menggunakan voucherCode, increment usedCount pada voucher
    if (voucherCode) {
      const outletData = await tx.outlet.findUnique({
        where: { id: outletId },
        select: { tenantId: true },
      });
      if (outletData?.tenantId) {
        await (tx as any).voucher.updateMany({
          where: {
            tenantId: outletData.tenantId,
            code: voucherCode.trim().toUpperCase().replace(/\s+/g, ""),
          },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }
    }

    // 3. Batch Pre-fetch produk, outlet stock, dan staf penanggung jawab
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const staffIds = Array.from(new Set(items.map((i) => i.staffId).filter(Boolean))) as string[];

    const [productsBatch, outletStocksBatch, staffUsersBatch] = await Promise.all([
      tx.product.findMany({ where: { id: { in: productIds } } }),
      tx.outletStock.findMany({ where: { outletId, productId: { in: productIds } } }),
      staffIds.length > 0
        ? tx.user.findMany({ where: { id: { in: staffIds } } })
        : Promise.resolve([]),
    ]);

    const productMap = new Map<string, any>(productsBatch.map((p: any) => [p.id, p]));
    const outletStockMap = new Map<string, any>(outletStocksBatch.map((os: any) => [os.productId, os]));
    const staffMap = new Map<string, any>(staffUsersBatch.map((s: any) => [s.id, s]));

    // 4. Simpan item-item transaksi & update stok barang
    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Produk "${item.name}" tidak ditemukan.`);
      }

      // Kurangi stok di OutletStock & catat pergerakan StockMovement jika bertipe BARANG
      let targetOutletStock = outletStockMap.get(item.productId) || null;
      if (product.type === "BARANG") {
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
          targetOutletStock.stockQty = currentStock - item.qty;
        } else {
          targetOutletStock = await tx.outletStock.create({
            data: {
              outletId,
              productId: item.productId,
              stockQty: Math.max(0, currentStock - item.qty),
              isAvailable: true,
            },
          });
          outletStockMap.set(item.productId, targetOutletStock);
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
        const staffUser = staffMap.get(item.staffId);
        const isEligible =
          staffUser &&
          staffUser.tenantId === user.tenantId &&
          staffUser.isActive &&
          (staffUser as any).isCommissionActive === true &&
          (!staffUser.outletId || staffUser.outletId === outletId);

        if (isEligible) {
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
            staffUser: {
              id: staffUser.id,
              name: staffUser.name,
              commissionPercent: staffUser.commissionPercent,
              commissionFlat: staffUser.commissionFlat,
              attributes: (staffUser.attributes as any) || {},
            },
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

    // 4. Update status Meja Cafe jika Dine-In (setelah transaksi lunas, meja kembali AVAILABLE)
    if (tableId) {
      await tx.cafeTable.update({
        where: { id: tableId },
        data: {
          status: "AVAILABLE",
          currentGuestName: null,
          currentOrderNotes: null,
        },
      });
    }

    // 5. Buat Laundry Order jika ada metadata laundry
    if (laundryDetails && (laundryDetails.weightKg || laundryDetails.unitQty)) {
      const orderNumber = `LND-${todayStr}-${randomSuffix}`;
      await tx.laundryOrder.create({
        data: {
          tenantId: user.tenantId,
          outletId,
          orderNumber,
          customerName: laundryDetails.customerName || "Pelanggan POS",
          customerPhone: laundryDetails.customerPhone || null,
          packageType: laundryDetails.weightKg ? "KILOAN" : "SATUAN",
          weightKg: laundryDetails.weightKg || null,
          unitQty: laundryDetails.unitQty || null,
          fragrance: laundryDetails.fragrance || "Standard",
          status: "RECEIVED",
          totalPrice: totalAmount,
          paidStatus: "PAID",
          rackNumber: laundryDetails.rackNumber || null,
        },
      });
    }

    // 6. Catat record Pembayaran (Mendukung Split Payment / Multi-Method)
    if (splitPayments && splitPayments.length > 0) {
      for (const sp of splitPayments) {
        if (Number(sp.amount) > 0) {
          await tx.payment.create({
            data: {
              transactionId: newTransaction.id,
              method: sp.method,
              amount: Number(sp.amount),
              status: "SUCCESS",
            },
          });
        }
      }
    } else {
      await tx.payment.create({
        data: {
          transactionId: newTransaction.id,
          method: paymentMethod,
          amount: totalAmount,
          status: "SUCCESS",
        },
      });
    }

    // 7. Hitung nomor antrean harian berurutan (Sequential Daily Queue)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dailyCount = await tx.transaction.count({
      where: { outletId, createdAt: { gte: todayStart } },
    });
    const seq = dailyCount; // newTransaction sudah tercatat sebelum query count ini
    let prefix = "A";
    if (orderType === "TAKEAWAY") prefix = "B";
    else if ((orderType as string) === "DELIVERY") prefix = "C";
    const queueNumber = `${prefix}-${String(seq).padStart(2, "0")}`;

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
        customer: true,
        payments: true,
      },
    });

    return {
      transaction: {
        ...(fullTransaction as any),
        receiptNumber: fullTransaction?.transactionNumber,
        queueNumber,
        orderType: orderType === "TAKEAWAY" ? "Take Away" : (orderType as string) === "DELIVERY" ? "Delivery" : "Dine In",
      },
      queueNumber,
      change: amountPaid - totalAmount,
      amountPaid,
    };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/dashboard/reports");

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
      customer: true,
    },
  });

  return transactions;
}

export async function voidTransactionAction(data: {
  transactionId: string;
  reason: string;
}) {
  const user = await requireCashierOrOwner();
  const { transactionId, reason } = data;

  if (!reason || !reason.trim()) {
    throw new Error("Alasan void / refund transaksi wajib diisi.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const trx = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: {
        outlet: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!trx || trx.outlet.tenantId !== user.tenantId) {
      throw new Error("Transaksi tidak ditemukan.");
    }

    if (trx.status === "CANCELLED") {
      throw new Error("Transaksi ini sudah berstatus CANCELLED / Dibatalkan.");
    }

    // 1. Ubah status transaksi menjadi CANCELLED
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "CANCELLED",
      },
    });

    // 2. Kembalikan stok untuk setiap produk BARANG & catat StockMovement (IN)
    for (const item of trx.items) {
      if (item.product && item.product.type === "BARANG") {
        // Increment legacy stockQty jika ada
        if (item.product.stockQty !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: { increment: item.qty },
            },
          });
        }

        // Increment OutletStock cabang
        const outletStock = await tx.outletStock.findUnique({
          where: {
            outletId_productId: {
              outletId: trx.outletId,
              productId: item.productId,
            },
          },
        });

        if (outletStock) {
          await tx.outletStock.update({
            where: {
              outletId_productId: {
                outletId: trx.outletId,
                productId: item.productId,
              },
            },
            data: {
              stockQty: { increment: item.qty },
            },
          });

          await tx.stockMovement.create({
            data: {
              outletStockId: outletStock.id,
              type: "IN",
              qty: item.qty,
              note: `Void Transaksi (${trx.transactionNumber}): ${reason.trim()}`,
            },
          });
        }
      }

      // 3. Batalkan komisi staf terkait jika ada
      await tx.staffCommission.deleteMany({
        where: { transactionItemId: item.id },
      });
    }

    // 4. Catat pengeluaran kas refund pada shift aktif jika transaksi dibayar secara CASH
    const cashPaid = trx.payments
      .filter((p) => p.method === "CASH" && p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (cashPaid > 0) {
      const activeShift = await tx.shift.findFirst({
        where: {
          outletId: trx.outletId,
          closedAt: null,
        },
      });

      if (activeShift) {
        await tx.cashMovement.create({
          data: {
            shiftId: activeShift.id,
            type: "OUT",
            amount: cashPaid,
            note: `Refund Void Transaksi ${trx.transactionNumber}: ${reason.trim()}`,
          },
        });
      }
    }

    // 5. Update LTV Customer jika ada
    if (trx.customerId) {
      await tx.customer.update({
        where: { id: trx.customerId },
        data: {
          visits: { decrement: 1 },
          totalSpent: { decrement: Number(trx.totalAmount) },
        },
      });
    }

    return { transactionNumber: trx.transactionNumber };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/reports");

  return { success: true, message: `Transaksi ${result.transactionNumber} berhasil di-void.` };
}
