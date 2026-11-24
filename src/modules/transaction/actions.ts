"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { calculateItemCommission } from "@/modules/commission/commission-engine";
import { deductRecipeIngredients, restoreRecipeIngredients } from "@/modules/product/recipe-actions";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "CARD";

type TransactionWhereInput = Record<string, any>;

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  outletId?: string | null;
}

async function requireCashierOrOwner(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as AuthenticatedUser | undefined;
  if (!session || !user?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis/kasir.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { status: true },
  });

  if (!tenant) {
    throw new Error("Akun Bisnis tidak ditemukan.");
  }

  if (tenant.status === "LOCKED" || tenant.status === "FROZEN") {
    throw new Error("Akun Bisnis sedang dikunci atau dibekukan. Silakan perbarui paket langganan Anda.");
  }

  return user;
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
  conversionFactor?: number;
  uomUnit?: string;
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
  const user = await requireCashierOrOwner();
  const tenantId = user.tenantId;
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
  barberTip?: number;
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
    barberTip = 0,
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

  const tipAmount = Math.max(0, Number(barberTip || 0));

  // Hitung grand total akhir (Termasuk Diskon, Pajak, Service Charge, dan Tip Barber)
  const totalAmount = Math.max(
    0,
    subtotalAmount - finalDiscountAmount + Number(taxAmount || 0) + Number(serviceCharge || 0) + tipAmount
  );

  if (splitPayments && splitPayments.length > 0) {
    const splitSum = (splitPayments as any[]).reduce((sum: number, sp: any) => sum + Number(sp.amount || 0), 0);
    if (splitSum < totalAmount) {
      throw new Error(
        `Total pembayaran multi-metode (Rp ${splitSum.toLocaleString(
          "id-ID"
        )}) kurang dari total tagihan (Rp ${totalAmount.toLocaleString("id-ID")}).`
      );
    }
  } else if (amountPaid < totalAmount) {
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
    // 1. Ambil atau pastikan shift kasir aktif
    let activeShiftId = shiftId;
    let shift = shiftId ? await tx.shift.findUnique({ where: { id: shiftId } }) : null;

    if (!shift || shift.closedAt !== null) {
      // Cari shift yang masih terbuka untuk outlet dan user kasir ini
      const openShift = await tx.shift.findFirst({
        where: { outletId, kasirId: user.id, closedAt: null },
        orderBy: { openedAt: "desc" },
      });

      if (openShift) {
        shift = openShift;
        activeShiftId = openShift.id;
      } else {
        // Otomatis buka sesi shift cepat baru
        const newShift = await tx.shift.create({
          data: {
            outletId,
            kasirId: user.id,
            openingCash: 0,
          },
        });
        shift = newShift;
        activeShiftId = newShift.id;
      }
    }

    // 2. Buat record Transaksi utama dengan detail diskon & pajak
    const newTransaction = await tx.transaction.create({
      data: {
        outletId,
        shiftId: activeShiftId,
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

    // 2b. Jika ada customerId, akumulasikan statistik pelanggan (visits, totalSpent & loyalty points: 1 poin per Rp 10.000)
    if (customerId) {
      const pointsEarned = Math.floor(totalAmount / 10000);
      await tx.customer.update({
        where: { id: customerId },
        data: {
          visits: { increment: 1 },
          totalSpent: { increment: totalAmount },
          points: { increment: pointsEarned },
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
        await tx.voucher.updateMany({
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
    let unassignedTip = tipAmount;
    for (const item of items) {
      const product: any = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Produk "${item.name}" tidak ditemukan.`);
      }

      // Kalkulasi faktor konversi Multi-UOM (misal: 1 DUS = 24 PCS)
      const uomFactor = Number(item.conversionFactor && item.conversionFactor > 0 ? item.conversionFactor : 1);
      const stockDeductionQty = item.qty * uomFactor;

      // Kurangi stok di OutletStock & catat pergerakan StockMovement jika bertipe BARANG & stok dilacak
      let targetOutletStock: any = outletStockMap.get(item.productId) || null;
      if (product.type === "BARANG") {
        const hasTrackedStock = targetOutletStock !== null || product.stockQty !== null;
        if (hasTrackedStock) {
          const currentStock = targetOutletStock
            ? targetOutletStock.stockQty
            : (product.stockQty ?? 0);

          if (currentStock < stockDeductionQty) {
            throw new Error(
              `Stok untuk "${product.name}" di cabang ini tidak mencukupi (Tersisa ${currentStock}, diminta ${stockDeductionQty}${uomFactor > 1 ? ` [${item.qty} ${item.uomUnit || 'Unit'} x ${uomFactor}]` : ''}).`
            );
          }

          if (targetOutletStock) {
            await tx.outletStock.update({
              where: { id: targetOutletStock.id },
              data: { stockQty: currentStock - stockDeductionQty },
            });
            targetOutletStock.stockQty = currentStock - stockDeductionQty;
          } else {
            targetOutletStock = await tx.outletStock.create({
              data: {
                outletId,
                productId: item.productId,
                stockQty: Math.max(0, currentStock - stockDeductionQty),
                isAvailable: true,
              },
            });
            outletStockMap.set(item.productId, targetOutletStock);
          }

          // Update legacy product stockQty juga untuk sinkronisasi
          if (product.stockQty !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: Math.max(0, product.stockQty - stockDeductionQty) },
            });
          }
        }
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

      // Catat baris ledger StockMovement (type: OUT) dengan jumlah unit riil terkonversi
      if (product.type === "BARANG" && targetOutletStock) {
        await tx.stockMovement.create({
          data: {
            outletStockId: targetOutletStock.id,
            type: "OUT",
            qty: stockDeductionQty,
            referenceId: trxItem.id,
            performedById: user.id || null,
            note: `Penjualan Kasir POS #${transactionNumber}${uomFactor > 1 ? ` (${item.name} x${item.qty} = ${stockDeductionQty} Pcs)` : ''}`,
            status: "CONFIRMED",
          },
        });
      }

      // Hitung komisi jika item memiliki penugasan staff / kapster / terapis
      if (item.staffId) {
        const staffUser: any = staffMap.get(item.staffId);
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
              weightKg: laundryDetails?.weightKg ? Number(laundryDetails.weightKg) : undefined,
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

          const itemTip = unassignedTip > 0 ? unassignedTip : 0;
          unassignedTip = 0; // Berikan tip ke staf layanan pertama

          const baseCommissionAmount = calcResult ? calcResult.amount : 0;
          const finalCommissionAmount = baseCommissionAmount + itemTip;

          if (finalCommissionAmount > 0) {
            await tx.staffCommission.create({
              data: {
                tenantId: user.tenantId,
                outletId,
                staffId: item.staffId,
                transactionItemId: trxItem.id,
                commissionType: calcResult?.commissionType || "FLAT",
                rate: calcResult?.rate || itemTip,
                amount: finalCommissionAmount,
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

    // 4b. Pengurangan Bahan Baku Otomatis (Bill of Materials / BOM Cafe)
    await deductRecipeIngredients(tx, items, outletId, newTransaction.id);

    // 5. Buat Laundry Order jika ada metadata laundry
    if (laundryDetails && (laundryDetails.weightKg || laundryDetails.unitQty)) {
      const orderNumber = `LND-${todayStr}-${randomSuffix}`;
      const serviceType = laundryDetails.weightKg ? "KILOAN" : "SATUAN";
      const pricePerUnit = items[0]?.price ? Number(items[0].price) : totalAmount;
      await tx.laundryOrder.create({
        data: {
          tenantId: user.tenantId,
          outletId,
          customerId: customerId || null,
          orderNumber,
          customerName: laundryDetails.customerName || "Pelanggan POS",
          customerPhone: laundryDetails.customerPhone || null,
          serviceType,
          weightKg: laundryDetails.weightKg ? Number(laundryDetails.weightKg) : null,
          unitQty: laundryDetails.unitQty ? Number(laundryDetails.unitQty) : null,
          pricePerUnit,
          totalAmount,
          fragrance: laundryDetails.fragrance || "Standard Fresh",
          status: "RECEIVED",
          notes: `Pembayaran Kasir POS #${transactionNumber}${laundryDetails.rackNumber ? ` | ${laundryDetails.rackNumber}` : ""} — ${items.map((i) => `${i.name} (x${i.qty})`).join(", ")}`,
        },
      });
    }

    // 6. Catat record Pembayaran (Mendukung Split Payment / Multi-Method)
    // Normalisasi uang kembalian agar nominal Payment yang tercatat adalah penerimaan bersih (sesuai totalAmount)
    if (splitPayments && splitPayments.length > 0) {
      const positiveSplits = splitPayments
        .map((sp) => ({
          method: sp.method,
          amount: Math.max(0, Number(sp.amount || 0)),
        }))
        .filter((sp) => sp.amount > 0);
      const rawSplitSum = positiveSplits.reduce((sum, sp) => sum + sp.amount, 0);
      let remainingExcess = Math.max(0, rawSplitSum - totalAmount);

      const normalizedSplits = positiveSplits.map((sp) => ({ ...sp }));
      for (const sp of normalizedSplits) {
        if (remainingExcess <= 0) break;
        if (sp.method === "CASH") {
          const deduction = Math.min(sp.amount, remainingExcess);
          sp.amount = Math.round((sp.amount - deduction) * 100) / 100;
          remainingExcess = Math.round((remainingExcess - deduction) * 100) / 100;
        }
      }
      for (const sp of normalizedSplits) {
        if (remainingExcess <= 0) break;
        const deduction = Math.min(sp.amount, remainingExcess);
        sp.amount = Math.round((sp.amount - deduction) * 100) / 100;
        remainingExcess = Math.round((remainingExcess - deduction) * 100) / 100;
      }

      for (const sp of normalizedSplits) {
        if (sp.amount > 0) {
          await tx.payment.create({
            data: {
              transactionId: newTransaction.id,
              method: sp.method,
              amount: sp.amount,
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

    const pointsEarned = customerId ? Math.floor(totalAmount / 10000) : 0;
    const customerPointsTotal = fullTransaction?.customer?.points ?? 0;

    return {
      transaction: {
        ...(fullTransaction as any),
        receiptNumber: fullTransaction?.transactionNumber,
        queueNumber,
        orderType: orderType === "TAKEAWAY" ? "Take Away" : (orderType as string) === "DELIVERY" ? "Delivery" : "Dine In",
        barberTip: tipAmount,
      },
      queueNumber,
      change: amountPaid - totalAmount,
      amountPaid,
      pointsEarned,
      customerPointsTotal,
    };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/dashboard/laundry/orders");
  revalidatePath("/dashboard/barbershop/bookings");
  revalidatePath("/dashboard/barbershop/queue");
  revalidatePath("/dashboard/barbershop/commissions");
  revalidatePath("/dashboard/reports");

  return JSON.parse(JSON.stringify({ success: true, ...result }));
}

export async function getTransactionHistoryAction(params: {
  outletId?: string;
  shiftId?: string;
  limit?: number;
}) {
  const user = await requireCashierOrOwner();
  const targetOutletId = params.outletId || user.outletId;

  const whereClause: TransactionWhereInput = {};

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
  supervisorPin?: string;
}) {
  const user = await requireCashierOrOwner();
  const { transactionId, reason, supervisorPin } = data;

  if (!reason || !reason.trim()) {
    throw new Error("Alasan void / refund transaksi wajib diisi.");
  }

  // Verifikasi PIN Supervisor jika pembatalan dilakukan oleh akun KASIR
  if (user.role === "KASIR") {
    if (!supervisorPin || !supervisorPin.trim()) {
      throw new Error("Akses ditolak: Pembatalan (Void) transaksi oleh kasir memerlukan otorisasi PIN Supervisor.");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { attributes: true },
    });

    const tenantAttrs = (tenant?.attributes as any) || {};
    const storedHash = tenantAttrs.supervisorPinHash;

    if (!storedHash) {
      // Default sandbox PIN fallback (123456 / 888888)
      const cleanPin = supervisorPin.trim();
      const isDefaultValid = cleanPin === "123456" || cleanPin === "888888";
      if (!isDefaultValid) {
        throw new Error("PIN Supervisor salah. Silakan minta otorisasi Owner atau Supervisor Anda.");
      }
    } else {
      const isMatch = await bcrypt.compare(supervisorPin.trim(), storedHash);
      if (!isMatch) {
        throw new Error("PIN Supervisor salah. Otorisasi pembatalan (Void) transaksi ditolak.");
      }
    }
  }

  const result = await prisma.$transaction(async (tx: any) => {
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

    // 2b. Kembalikan stok bahan baku resep (BOM Cafe/Resto)
    await restoreRecipeIngredients(tx, trx.items, trx.outletId, trx.id, reason.trim());

    // 4. Penanganan Kas Laci Saat Void Transaksi Cash
    const cashPaid = (trx.payments || [])
      .filter((p: any) => p.method === "CASH" && (p.status === "SUCCESS" || p.status === "PAID"))
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    if (cashPaid > 0) {
      const activeShift = await tx.shift.findFirst({
        where: {
          outletId: trx.outletId,
          closedAt: null,
        },
      });

      if (activeShift) {
        // KOREKSI DOUBLE-DEDUCTION:
        // Jika transaksi di-void pada shift yang sama (intra-shift):
        // Status "CANCELLED" sudah otomatis MENGELUARKAN transaksi dari `cashSalesTotal` shift ini.
        // JANGAN membuat `CashMovement OUT` karena akan memotong kas laci 2x lipat.
        // Mutasi OUT HANYA dibuat jika transaksi yang di-void berasal dari shift lampau / shift berbeda (cross-shift):
        if (trx.shiftId !== activeShift.id) {
          await tx.cashMovement.create({
            data: {
              shiftId: activeShift.id,
              type: "OUT",
              amount: cashPaid,
              note: `Refund Void Transaksi Masa Lalu ${trx.transactionNumber}: ${reason.trim()}`,
            },
          });
        }
      }
    }

    // 5. Update status pembayaran menjadi CANCELLED
    await tx.payment.updateMany({
      where: { transactionId: trx.id },
      data: { status: "CANCELLED" },
    });

    // 6. Update LTV Customer & Loyalty Points jika ada (Pencegahan Eksploitasi Poin)
    if (trx.customerId) {
      const cust = await tx.customer.findUnique({
        where: { id: trx.customerId },
        select: { visits: true, totalSpent: true, points: true },
      });
      if (cust) {
        const newVisits = Math.max(0, (cust.visits || 0) - 1);
        const newSpent = Math.max(0, Number(cust.totalSpent || 0) - Number(trx.totalAmount || 0));
        const pointsEarned = Math.floor(Number(trx.totalAmount || 0) / 10000);
        const newPoints = Math.max(0, (cust.points || 0) - pointsEarned);

        await tx.customer.update({
          where: { id: trx.customerId },
          data: {
            visits: newVisits,
            totalSpent: newSpent,
            points: newPoints,
          },
        });
      }
    }

    // 7. Kembalikan kuota voucher jika transaksi menggunakan voucher promo
    if (trx.voucherCode) {
      const outletData = await tx.outlet.findUnique({
        where: { id: trx.outletId },
        select: { tenantId: true },
      });
      if (outletData?.tenantId) {
        const normalizedCode = trx.voucherCode.trim().toUpperCase().replace(/\s+/g, "");
        const existingVoucher = await tx.voucher.findFirst({
          where: {
            tenantId: outletData.tenantId,
            code: normalizedCode,
          },
        });
        if (existingVoucher && existingVoucher.usedCount > 0) {
          await tx.voucher.update({
            where: { id: existingVoucher.id },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }
    }

    // 8. Batalkan antrean LaundryOrder fiktif terkait jika ada
    await tx.laundryOrder.updateMany({
      where: {
        outletId: trx.outletId,
        notes: { contains: trx.transactionNumber },
        status: { in: ["RECEIVED"] },
      },
      data: {
        status: "CANCELLED",
      },
    });

    return { transactionNumber: trx.transactionNumber };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/accounting");

  return { success: true, message: `Transaksi ${result.transactionNumber} berhasil di-void.` };
}
