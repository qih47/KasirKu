"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateItemCommission } from "@/modules/commission/commission-engine";
import { deductRecipeIngredients } from "@/modules/product/recipe-actions";

export type LiveOrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type LiveOrderPaymentStatus = "UNPAID_CASH" | "PAID_ONLINE";

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  outletId?: string | null;
}

async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as AuthenticatedUser | undefined;
  if (!session || !user?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }
  return user;
}

export interface LiveOrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  notes?: string;
  type?: string;
}

export interface LiveOrderSummary {
  id: string;
  orderNumber: string;
  verticalType: "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL";
  customerName: string;
  customerPhone: string | null;
  customerId: string | null;
  tableNumber: string | null;
  queueNumber: string | null;
  serviceType: string | null;
  fragrance: string | null;
  assignedStaffId: string | null;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID_CASH" | "PAID_ONLINE";
  items: LiveOrderItem[];
  subtotal: number;
  totalAmount: number;
  customerNotes: string | null;
  transactionId: string | null;
  createdAt: string;
}

// 1. Cek apakah tenant berlangganan plugin 'self_order'
export async function hasSelfOrderPlugin(tenantId: string): Promise<boolean> {
  const sub = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      isActive: true,
      plugins: {
        some: {
          plugin: { code: { in: ["cafe", "self_order"] } },
          isActive: true,
        },
      },
    },
  });

  return !!sub;
}

// 2. Ambil Live Orders aktif untuk POS Kasir
export async function getLiveOrdersAction(params?: {
  outletId?: string;
  status?: string;
}): Promise<LiveOrderSummary[]> {
  const user = await requireAuth();

  const isEnabled = await hasSelfOrderPlugin(user.tenantId);
  if (!isEnabled) {
    return [];
  }

  const targetOutletId = params?.outletId || user.outletId;

  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (targetOutletId) {
    whereClause.outletId = targetOutletId;
  }

  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status;
  } else {
    // Default: Ambil order yang belum selesai (PENDING, CONFIRMED, PREPARING, READY)
    whereClause.status = {
      in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
    };
  }

  const rawOrders = await prisma.liveOrder.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rawOrders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    verticalType: o.verticalType as any,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerId: o.customerId,
    tableNumber: o.tableNumber,
    queueNumber: o.queueNumber,
    serviceType: o.serviceType,
    fragrance: o.fragrance,
    assignedStaffId: o.assignedStaffId,
    status: o.status as any,
    paymentStatus: o.paymentStatus as any,
    items: (o.items as any) || [],
    subtotal: Number(o.subtotal || 0),
    totalAmount: Number(o.totalAmount || 0),
    customerNotes: o.customerNotes,
    transactionId: o.transactionId,
    createdAt: o.createdAt.toISOString(),
  }));
}

/**
 * Kalkulasi dinamis Pajak (PB1 / PPN), Service Charge, dan Biaya Admin
 * sesuai pengaturan resmi yang disimpan di tenant.receiptConfig (Anti-Hardcode).
 */
export async function calculateOrderTaxesAndCharges(rc: any, subtotalAmount: number) {
  let taxPb1Amount = 0;
  let taxPpnAmount = 0;
  let serviceChargeAmount = 0;
  let adminFeeAmount = 0;
  let roundingAmount = 0;

  const isInclusive = rc?.taxCalculationType === "INCLUSIVE";
  const isPb1 = Boolean(rc?.showPb1 || rc?.taxPb1Active);
  const pb1Percent = Number(rc?.pb1Percent || rc?.taxPb1Percent || 0);

  const isPpn = Boolean(rc?.showTax || rc?.taxPpnActive);
  const taxPercent = Number(rc?.taxPercent || rc?.taxPpnPercent || 0);

  const isService = Boolean(rc?.showServiceCharge || rc?.serviceChargeActive);
  const servicePercent = Number(rc?.servicePercent || rc?.serviceChargePercent || 0);

  if (isInclusive) {
    const combinedRate = (isPb1 && pb1Percent > 0 ? pb1Percent : 0) +
      (isPpn && taxPercent > 0 ? taxPercent : 0) +
      (isService && servicePercent > 0 ? servicePercent : 0);
    const divisor = 100 + combinedRate;

    if (isPb1 && pb1Percent > 0) {
      taxPb1Amount = Math.round(subtotalAmount * (pb1Percent / divisor));
    }
    if (isPpn && taxPercent > 0) {
      taxPpnAmount = Math.round(subtotalAmount * (taxPercent / divisor));
    }
    if (isService && servicePercent > 0) {
      serviceChargeAmount = Math.round(subtotalAmount * (servicePercent / divisor));
    }
  } else {
    if (isPb1 && pb1Percent > 0) {
      taxPb1Amount = Math.round((subtotalAmount * pb1Percent) / 100);
    }
    if (isPpn && taxPercent > 0) {
      taxPpnAmount = Math.round((subtotalAmount * taxPercent) / 100);
    }
    if (isService && servicePercent > 0) {
      serviceChargeAmount = Math.round((subtotalAmount * servicePercent) / 100);
    }
  }

  if (rc?.showAdminFee && Number(rc?.adminFeeAmount || 0) > 0) {
    adminFeeAmount = Number(rc.adminFeeAmount);
  }

  const taxAmount = taxPb1Amount + taxPpnAmount;
  const totalCharges = isInclusive
    ? adminFeeAmount
    : (taxAmount + serviceChargeAmount + adminFeeAmount);
  let finalTotal = subtotalAmount + totalCharges;

  if (rc?.showRounding) {
    const roundStep = Number(rc?.roundingAmount || 100);
    if (roundStep > 0) {
      const rounded = Math.round(finalTotal / roundStep) * roundStep;
      roundingAmount = rounded - finalTotal;
      finalTotal = rounded;
    }
  }

  return {
    taxPb1Amount,
    taxPpnAmount,
    taxAmount,
    serviceChargeAmount,
    adminFeeAmount,
    roundingAmount,
    totalCharges,
    finalTotal,
  };
}

// 3. Submit Self-Order dari Layar Publik Pelanggan (Scan QR Meja)
export async function submitSelfOrderAction(data: {
  tenantId: string;
  outletId: string;
  verticalType?: "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL";
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  queueNumber?: string;
  serviceType?: string;
  fragrance?: string;
  assignedStaffId?: string;
  items: LiveOrderItem[];
  customerNotes?: string;
  paymentStatus?: "UNPAID_CASH" | "PAID_ONLINE";
}) {
  const {
    tenantId,
    outletId,
    verticalType = "CAFE",
    customerName,
    customerPhone,
    tableNumber,
    queueNumber,
    serviceType,
    fragrance,
    assignedStaffId,
    items,
    customerNotes,
    paymentStatus = "UNPAID_CASH",
  } = data;

  if (!items || items.length === 0) {
    throw new Error("Keranjang pesanan masih kosong.");
  }

  if (!customerName || !customerName.trim()) {
    throw new Error("Nama pemesan wajib diisi.");
  }

  // Validasi outlet aktif dan milik tenant
  const outlet = await prisma.outlet.findFirst({
    where: { id: outletId, tenantId, isActive: true },
  });

  if (!outlet) {
    throw new Error("Outlet cabang tidak ditemukan atau sedang tidak aktif.");
  }

  // Validasi meja jika disediakan
  if (tableNumber) {
    const table = await prisma.cafeTable.findFirst({
      where: { outletId, tableNumber },
    });
    if (!table) {
      throw new Error(`Meja "${tableNumber}" tidak terdaftar pada cabang ini.`);
    }
  }

  // Cek apakah tenant berhak atas plugin self_order
  const isEnabled = await hasSelfOrderPlugin(tenantId);
  if (!isEnabled) {
    throw new Error("Layanan Self-Order belum diaktifkan oleh pemilik Bisnis.");
  }

  // Validasi harga produk dari database secara server-side (mencegah price tampering)
  const productIds = Array.from(new Set(items.map((i) => i.productId).filter(Boolean)));
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId, isActive: true },
  });
  const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

  const validatedItems: LiveOrderItem[] = [];
  let subtotal = 0;

  for (const it of items) {
    const dbProd = productMap.get(it.productId);
    if (!dbProd) {
      throw new Error(`Produk "${it.name}" tidak ditemukan atau sudah tidak aktif.`);
    }
    const effectivePrice = Number(dbProd.price);
    const qty = Math.max(1, Math.round(Number(it.qty) || 1));
    subtotal += effectivePrice * qty;
    validatedItems.push({
      productId: dbProd.id,
      name: dbProd.name,
      qty,
      price: effectivePrice,
      notes: it.notes?.trim() || undefined,
      type: dbProd.type,
    });
  }

  // Hitung pajak & service charge dinamis sesuai tenant.receiptConfig
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { receiptConfig: true },
  });
  const rc = (tenant?.receiptConfig as any) || {};
  const { finalTotal } = await calculateOrderTaxesAndCharges(rc, subtotal);
  const totalAmount = finalTotal;

  // Cari atau buat customer secara otomatis jika ada nomor kontak
  let customerId: string | null = null;
  const cleanPhone = customerPhone?.trim() || null;

  if (customerName.trim()) {
    if (cleanPhone) {
      let existingCustomer = await prisma.customer.findUnique({
        where: {
          tenantId_phone: {
            tenantId,
            phone: cleanPhone,
          },
        },
      });

      if (!existingCustomer) {
        existingCustomer = await prisma.customer.create({
          data: {
            tenantId,
            name: customerName.trim(),
            phone: cleanPhone,
          },
        });
      }
      customerId = existingCustomer.id;
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

  const liveOrder = await prisma.liveOrder.create({
    data: {
      tenantId,
      outletId,
      orderNumber,
      verticalType,
      customerName: customerName.trim() || "Tamu Meja",
      customerPhone: cleanPhone,
      customerId,
      tableNumber: tableNumber || null,
      queueNumber: queueNumber || null,
      serviceType: serviceType || null,
      fragrance: fragrance || null,
      assignedStaffId: assignedStaffId || null,
      status: "PENDING",
      paymentStatus,
      items: validatedItems as any,
      subtotal,
      totalAmount,
      customerNotes: customerNotes?.trim() || null,
    },
  });

  // Sinkronisasi status Meja Kafe ke OCCUPIED
  if (tableNumber) {
    await prisma.cafeTable.updateMany({
      where: { outletId, tableNumber },
      data: {
        status: "OCCUPIED",
        currentGuestName: customerName.trim(),
        currentOrderNotes: customerNotes?.trim() || `Pesanan Self-Order #${orderNumber}`,
      },
    });
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard/cafe/tables");
  return {
    success: true,
    order: {
      ...liveOrder,
      subtotal: Number(liveOrder.subtotal),
      totalAmount: Number(liveOrder.totalAmount),
      createdAt: liveOrder.createdAt.toISOString(),
    },
  };
}

// 4. Update Status Live Order (Kasir / Dapur mengubah status)
export async function updateLiveOrderStatusAction(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
) {
  const user = await requireAuth();

  const order = await prisma.liveOrder.findFirst({
    where: {
      id: orderId,
      tenantId: user.tenantId,
    },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  const updated = await prisma.liveOrder.update({
    where: { id: orderId },
    data: { status },
  });

  // Jika dibatalkan (CANCELLED) dan pesanan memiliki nomor meja, bebaskan meja jika tidak ada order aktif lain
  if (status === "CANCELLED" && order.tableNumber && order.outletId) {
    const remainingActiveOrders = await prisma.liveOrder.count({
      where: {
        outletId: order.outletId,
        tableNumber: order.tableNumber,
        id: { not: orderId },
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
      },
    });

    if (remainingActiveOrders === 0) {
      await prisma.cafeTable.updateMany({
        where: {
          outletId: order.outletId,
          tableNumber: order.tableNumber,
        },
        data: {
          status: "AVAILABLE",
          currentGuestName: null,
          currentOrderNotes: null,
        },
      });
    }
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard/cafe/tables");
  return { success: true, order: updated };
}

// 5. Kasir Menerima Bayar & Menyelesaikan Live Order Langsung ke Transaksi POS
export async function checkoutLiveOrderAction(data: {
  orderId: string;
  shiftId: string;
  paymentMethod: "CASH" | "QRIS";
  amountPaid: number;
}) {
  const user = await requireAuth();
  const { orderId, shiftId, paymentMethod, amountPaid } = data;

  const order = await prisma.liveOrder.findFirst({
    where: {
      id: orderId,
      tenantId: user.tenantId,
    },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  // 1. Validasi Shift Kasir masih aktif
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift || shift.closedAt !== null) {
    throw new Error("Shift kasir tidak ditemukan atau sudah ditutup.");
  }

  const items = (order.items as any[]) || [];
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { receiptConfig: true },
  });
  const rc = (tenant?.receiptConfig as any) || {};

  const subtotalAmount = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.qty)), 0);
  const { taxAmount, serviceChargeAmount, finalTotal } = await calculateOrderTaxesAndCharges(rc, subtotalAmount);

  if (amountPaid < finalTotal) {
    throw new Error(`Uang pembayaran kurang dari total tagihan (Rp ${finalTotal.toLocaleString("id-ID")}).`);
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `TRX-${todayStr}-${randomSuffix}`;

  // Atomic transaction
  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Buat Transaksi POS
    const transaction = await tx.transaction.create({
      data: {
        outletId: order.outletId,
        shiftId,
        customerId: order.customerId || null,
        transactionNumber,
        subtotalAmount,
        taxAmount,
        serviceCharge: serviceChargeAmount,
        discountAmount: 0,
        totalAmount: finalTotal,
        status: "PAID",
      },
    });

    // 2. Buat TransactionItems & kurangi stok (Legacy & OutletStock) dengan validasi kecukupan
    for (const item of items) {
      if (item.productId) {
        const trxItem = await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            subtotal: item.price * item.qty,
          },
        });

        // Kurangi stok barang jika bertipe BARANG
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.type === "BARANG") {
          let targetOutletStock = await tx.outletStock.findUnique({
            where: {
              outletId_productId: {
                outletId: order.outletId,
                productId: item.productId,
              },
            },
          });

          const currentStock = targetOutletStock ? targetOutletStock.stockQty : (product.stockQty ?? 0);
          if (currentStock < item.qty) {
            throw new Error(`Stok untuk "${product.name}" di cabang tidak mencukupi (Tersisa ${currentStock}, diminta ${item.qty}).`);
          }

          if (targetOutletStock) {
            await tx.outletStock.update({
              where: { id: targetOutletStock.id },
              data: { stockQty: currentStock - item.qty },
            });
          } else {
            targetOutletStock = await tx.outletStock.create({
              data: {
                outletId: order.outletId,
                productId: item.productId,
                stockQty: Math.max(0, currentStock - item.qty),
                isAvailable: true,
              },
            });
          }

          // Update legacy product stockQty juga untuk sinkronisasi
          if (product.stockQty !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: Math.max(0, (product.stockQty ?? 0) - item.qty) },
            });
          }

          await tx.stockMovement.create({
            data: {
              outletStockId: targetOutletStock.id,
              type: "OUT",
              qty: item.qty,
              note: `Live Order Checkout: ${transactionNumber}`,
            },
          });
        }

        // 3. Perhitungan Komisi Staf jika ada penugasan staf
        if (item.staffId && product) {
          const staffUser = await tx.user.findUnique({
            where: { id: item.staffId },
          });

          if (staffUser && staffUser.tenantId === user.tenantId) {
            const isEligible =
              staffUser.isCommissionActive !== false &&
              (Number(staffUser.commissionPercent || 0) > 0 ||
                Number(staffUser.commissionFlat || 0) > 0 ||
                Object.keys((staffUser.attributes as any) || {}).length > 0 ||
                Object.keys((product.attributes as any) || {}).length > 0);

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
                    outletId: order.outletId,
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
        }
      }
    }

    // 2b. Kurangi Bahan Baku Resep / BOM (Bill of Materials) jika produk F&B memiliki resep
    await deductRecipeIngredients(
      tx,
      items.map((i: any) => ({
        productId: i.productId,
        qty: i.qty,
      })),
      order.outletId,
      transaction.id
    );

    // 3. Catat Pembayaran
    await tx.payment.create({
      data: {
        transactionId: transaction.id,
        method: paymentMethod,
        amount: finalTotal,
        status: "SUCCESS",
      },
    });

    // 4. Update status Customer (LTV & Loyalty Points: 1 poin per Rp 10.000) jika ada
    if (order.customerId) {
      const pointsEarned = Math.floor(finalTotal / 10000);
      await (tx as any).customer.update({
        where: { id: order.customerId },
        data: {
          visits: { increment: 1 },
          totalSpent: { increment: finalTotal },
          points: { increment: pointsEarned },
          lastVisitAt: new Date(),
        },
      });
    }

    // 5. Tandai Live Order sebagai COMPLETED
    await (tx as any).liveOrder.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID_ONLINE", // Lunas setelah transaksi diselesaikan kasir
        transactionId: transaction.id,
      },
    });

    // 6. Jika Live Order terkait nomor meja resto, otomatis kembalikan status meja ke AVAILABLE (Kosong)
    if (order.tableNumber && order.outletId) {
      const activeOnTable = await tx.liveOrder.count({
        where: {
          outletId: order.outletId,
          tableNumber: order.tableNumber,
          id: { not: orderId },
          status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
        },
      });

      if (activeOnTable === 0) {
        await tx.cafeTable.updateMany({
          where: {
            outletId: order.outletId,
            tableNumber: order.tableNumber,
          },
          data: {
            status: "AVAILABLE",
            currentGuestName: null,
            currentOrderNotes: null,
          },
        });
      }
    }

    // Ambil data transaksi lengkap untuk dicetak struk & sinkronisasi kasir
    const fullTransaction = await tx.transaction.findUnique({
      where: { id: transaction.id },
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

    const pointsEarned = order.customerId ? Math.floor(finalTotal / 10000) : 0;
    const customerPointsTotal = fullTransaction?.customer?.points ?? 0;

    return {
      transaction: {
        ...(fullTransaction as any),
        receiptNumber: fullTransaction?.transactionNumber,
        tableNumber: order.tableNumber || undefined,
        queueNumber: order.queueNumber || undefined,
        orderType: "Dine In",
      },
      change: amountPaid - finalTotal,
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
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/accounting");

  return JSON.parse(JSON.stringify({ success: true, ...result }));
}

// 6. Ambil Data Menu Digital & Tenant untuk Halaman Publik Self-Order Pelanggan
export async function getPublicSelfOrderMenuData(
  tenantId: string,
  tableQuery?: string,
  explicitOutletId?: string
) {
  const whereOutlet: any = { isActive: true };
  if (explicitOutletId) {
    whereOutlet.id = explicitOutletId;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      outlets: {
        where: whereOutlet,
        take: 1,
      },
    },
  });

  if (!tenant) {
    return { isFound: false, isEnabled: false };
  }

  const isSelfOrderActive = await hasSelfOrderPlugin(tenantId);
  const targetOutlet = tenant.outlets[0] || null;
  const targetOutletId = targetOutlet?.id;

  // Ambil meja spesifik outlet
  const cafeTables = targetOutletId
    ? await prisma.cafeTable.findMany({
        where: { tenantId, outletId: targetOutletId },
        orderBy: { tableNumber: "asc" },
      })
    : [];

  // Ambil produk aktif (sembunyikan bahan baku mentah dapur)
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { outletId: null },
        { outletId: targetOutletId || undefined },
      ],
    },
    orderBy: { name: "asc" },
  });

  const filteredProducts = products.filter((p: any) => {
    const isIngredient = (p.attributes as any)?.isIngredient === true;
    const isRaw = (p.category || "").toLowerCase().includes("bahan baku") || (p.category || "").toLowerCase().includes("ingredient");
    return !isIngredient && !isRaw;
  });

  const categories = Array.from(
    new Set(filteredProducts.map((p: any) => p.category || "Umum"))
  );

  return {
    isFound: true,
    isEnabled: isSelfOrderActive,
    tenant: {
      id: tenant.id,
      businessName: tenant.businessName,
      logoUrl: tenant.logoUrl,
      outletId: targetOutlet?.id || null,
      outletName: targetOutlet?.name || "Outlet Utama",
      receiptConfig: (tenant.receiptConfig as any) || {},
    },
    tables: cafeTables.map((t: any) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      areaZone: t.areaZone,
      status: t.status,
    })),
    selectedTable: tableQuery || cafeTables[0]?.tableNumber || "Meja 01",
    products: filteredProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      category: p.category || "Umum",
      type: p.type,
      stockQty: p.stockQty,
      attributes: p.attributes,
    })),
    categories,
    receiptConfig: (tenant.receiptConfig as any) || {},
  };
}
