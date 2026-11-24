"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export interface JournalEntryLine {
  id: string;
  date: string;
  referenceNo: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface AccountingSummaryResult {
  period: { start: string; end: string };
  financials: {
    grossSales: number;
    discounts: number;
    netSales: number;
    taxPb1: number;
    taxPpn: number;
    serviceCharge: number;
    adminFees: number;
    totalRevenue: number;
    operationalExpenses: number;
    staffCommissions: number;
    estimatedCogs: number;
    grossProfit: number;
    netProfit: number;
  };
  auditTotals: {
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    totalEntriesCount: number;
  };
  journalEntries: JournalEntryLine[];
}

/**
 * Normalisasi baris pembayaran agar total Debit yang dijurnal tidak melebihi total tagihan
 * (kompatibel dengan data historis split payment yang masih menyimpan bruto sebelum dipotong kembalian).
 */
function normalizePaymentsForJournal(
  payments: Array<{ method?: string; amount?: number | string | null }>,
  transactionTotal: number
): Array<{ method: string; amount: number }> {
  if (!payments || payments.length === 0) {
    return [{ method: "CASH", amount: Math.max(0, transactionTotal) }];
  }

  const rows = payments
    .map((p) => ({
      method: String(p.method || "CASH"),
      amount: Math.max(0, Number(p.amount || 0)),
    }))
    .filter((p) => p.amount > 0);

  if (rows.length === 0) {
    return [{ method: "CASH", amount: Math.max(0, transactionTotal) }];
  }

  const sum = rows.reduce((acc, r) => acc + r.amount, 0);
  let excess = Math.max(0, sum - transactionTotal);

  if (excess > 0) {
    for (const r of rows) {
      if (excess <= 0) break;
      if (r.method === "CASH") {
        const deduct = Math.min(r.amount, excess);
        r.amount = Math.round((r.amount - deduct) * 100) / 100;
        excess = Math.round((excess - deduct) * 100) / 100;
      }
    }
    for (const r of rows) {
      if (excess <= 0) break;
      const deduct = Math.min(r.amount, excess);
      r.amount = Math.round((r.amount - deduct) * 100) / 100;
      excess = Math.round((excess - deduct) * 100) / 100;
    }
  }

  return rows.filter((r) => r.amount > 0);
}

/**
 * Menghasilkan Jurnal Umum Akuntansi Otomatis (Double-Entry) dan Laporan Laba Rugi Real-Time.
 */
export async function getTenantAccountingSummaryAction(params?: {
  startDate?: string;
  endDate?: string;
  outletId?: string;
}): Promise<AccountingSummaryResult> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const allowedRoles = ["OWNER", "ADMIN_CABANG", "SUPER_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      "Akses ditolak: Hanya Owner atau Admin Cabang yang dapat mengakses Laporan Laba Rugi & Jurnal Umum."
    );
  }

  const tenantId = user.tenantId as string;
  const isAdminCabang = user.role === "ADMIN_CABANG";

  if (isAdminCabang && !user.outletId) {
    throw new Error("Akun Admin Cabang belum ditugaskan ke cabang manapun.");
  }

  const requestedOutletId =
    params?.outletId && params.outletId !== "ALL" ? params.outletId : null;
  const effectiveOutletId = isAdminCabang
    ? (user.outletId as string)
    : requestedOutletId;

  const start = params?.startDate
    ? startOfDay(new Date(params.startDate))
    : startOfDay(new Date());
  const end = params?.endDate
    ? endOfDay(new Date(params.endDate))
    : endOfDay(new Date());

  // Enforce tenantId untuk mencegah IDOR lintas bisnis
  const outletFilter = effectiveOutletId
    ? { id: effectiveOutletId, tenantId }
    : { tenantId };

  // Query tenant settings, transaksi, mutasi kas, komisi staf dalam periode secara paralel
  const [tenant, transactions, cashMovements, commissions] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { receiptConfig: true },
    }),
    prisma.transaction.findMany({
      where: {
        outlet: outletFilter,
        status: "PAID",
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        outlet: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cashMovement.findMany({
      where: {
        shift: { outlet: outletFilter },
        createdAt: { gte: start, lte: end },
      },
      include: { shift: { include: { outlet: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffCommission.findMany({
      where: {
        tenantId,
        ...(effectiveOutletId ? { outletId: effectiveOutletId } : {}),
        createdAt: { gte: start, lte: end },
      },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const receiptConfig = (tenant?.receiptConfig as Record<string, any>) || {};
  const pb1Weight = receiptConfig.showPb1
    ? Math.max(0, Number(receiptConfig.pb1Percent ?? 10))
    : 0;
  const ppnWeight = receiptConfig.showTax
    ? Math.max(0, Number(receiptConfig.taxPercent ?? 11))
    : 0;
  const adminFeeConfigured = receiptConfig.showAdminFee
    ? Math.max(0, Number(receiptConfig.adminFeeAmount ?? 0))
    : 0;

  let grossSales = 0;
  let discounts = 0;
  let taxPb1 = 0;
  let taxPpn = 0;
  let serviceCharge = 0;
  let adminFees = 0;
  let estimatedCogs = 0;

  const journalEntries: JournalEntryLine[] = [];

  for (const trx of transactions as any[]) {
    const total = Number(trx.totalAmount || 0);
    const subtotal = Number(trx.subtotalAmount ?? total);
    const disc = Number(trx.discountAmount || 0);
    const tax = Number(trx.taxAmount || 0);
    const svc = Number(trx.serviceCharge || 0);
    const netSalesTrx = Math.round((subtotal - disc) * 100) / 100;

    grossSales += subtotal;
    discounts += disc;
    serviceCharge += svc;

    // Pecah taxAmount ke PB1 vs PPN secara dinamis sesuai konfigurasi Settings Tenant
    let trxPb1 = 0;
    let trxPpn = 0;
    if (tax > 0) {
      if (pb1Weight > 0 && ppnWeight > 0) {
        trxPb1 = Math.round((tax * (pb1Weight / (pb1Weight + ppnWeight))) * 100) / 100;
        trxPpn = Math.round((tax - trxPb1) * 100) / 100;
      } else if (ppnWeight > 0 && pb1Weight === 0) {
        trxPpn = tax;
      } else {
        trxPb1 = tax;
      }
    }
    taxPb1 += trxPb1;
    taxPpn += trxPpn;

    const dateStr = trx.createdAt.toISOString().slice(0, 10);
    const ref = trx.transactionNumber;

    // 1. Debit Multi-Metode: Kas / Bank sesuai rincian Payment (mencegah distorsi Split Payment)
    const normalizedPayments = normalizePaymentsForJournal(
      (trx.payments || []).filter((p: any) => p.status !== "FAILED"),
      total
    );

    let debitTotalTrx = 0;
    normalizedPayments.forEach((pay, idx) => {
      debitTotalTrx += pay.amount;
      const isCash = pay.method === "CASH";
      journalEntries.push({
        id: `${trx.id}-debit-${idx}`,
        date: dateStr,
        referenceNo: ref,
        description: `Penerimaan Pembayaran Penjualan (${pay.method})`,
        accountCode: isCash ? "1-1001" : "1-1002",
        accountName: isCash
          ? "1-1001 Kas di Tangan (Laci)"
          : "1-1002 Bank & QRIS Settlement",
        debit: pay.amount,
        credit: 0,
      });
    });

    // 2. Kredit: Pendapatan Penjualan
    if (netSalesTrx >= 0) {
      journalEntries.push({
        id: `${trx.id}-rev`,
        date: dateStr,
        referenceNo: ref,
        description: `Pendapatan Penjualan Produk & Jasa`,
        accountCode: "4-1001",
        accountName: "4-1001 Pendapatan Penjualan POS",
        debit: 0,
        credit: netSalesTrx,
      });
    } else {
      journalEntries.push({
        id: `${trx.id}-rev-adj`,
        date: dateStr,
        referenceNo: ref,
        description: `Diskon & Penyesuaian Penjualan POS`,
        accountCode: "4-1004",
        accountName: "4-1004 Potongan Penjualan POS",
        debit: Math.abs(netSalesTrx),
        credit: 0,
      });
    }

    // 3. Kredit: Utang Pajak PB1 & PPN sesuai setting tenant
    if (trxPb1 > 0) {
      journalEntries.push({
        id: `${trx.id}-pb1`,
        date: dateStr,
        referenceNo: ref,
        description: `Utang Pajak Resto / Daerah (PB1)`,
        accountCode: "2-1001",
        accountName: "2-1001 Utang Pajak Penjualan (PB1)",
        debit: 0,
        credit: trxPb1,
      });
    }
    if (trxPpn > 0) {
      journalEntries.push({
        id: `${trx.id}-ppn`,
        date: dateStr,
        referenceNo: ref,
        description: `Utang Pajak Pertambahan Nilai (PPN)`,
        accountCode: "2-1005",
        accountName: "2-1005 Utang Pajak Penjualan (PPN)",
        debit: 0,
        credit: trxPpn,
      });
    }

    // 4. Kredit: Service Charge
    if (svc > 0) {
      journalEntries.push({
        id: `${trx.id}-svc`,
        date: dateStr,
        referenceNo: ref,
        description: `Alokasi Service Charge Tamu`,
        accountCode: "2-1002",
        accountName: "2-1002 Titipan Service Charge Karyawan",
        debit: 0,
        credit: svc,
      });
    }

    // 5. Penyeimbang selisih (Barber Tip, Admin Fee, atau Pembulatan) agar Debit === Kredit per transaksi
    const creditSideBeforeRemainder =
      Math.max(0, netSalesTrx) + trxPb1 + trxPpn + svc;
    const debitSideBeforeRemainder =
      debitTotalTrx + (netSalesTrx < 0 ? Math.abs(netSalesTrx) : 0);
    const remainder =
      Math.round((debitSideBeforeRemainder - creditSideBeforeRemainder) * 100) /
      100;

    if (remainder > 0.009) {
      let remainingTipOrOther = remainder;
      if (adminFeeConfigured > 0 && remainingTipOrOther >= adminFeeConfigured) {
        adminFees += adminFeeConfigured;
        remainingTipOrOther =
          Math.round((remainingTipOrOther - adminFeeConfigured) * 100) / 100;
        journalEntries.push({
          id: `${trx.id}-admin`,
          date: dateStr,
          referenceNo: ref,
          description: `Penerimaan Biaya Admin / Aplikasi`,
          accountCode: "4-1002",
          accountName: "4-1002 Pendapatan Biaya Admin",
          debit: 0,
          credit: adminFeeConfigured,
        });
      }

      if (remainingTipOrOther > 0.009) {
        journalEntries.push({
          id: `${trx.id}-tip`,
          date: dateStr,
          referenceNo: ref,
          description: `Tip Kapster / Penerimaan Tambahan Struk`,
          accountCode: "2-1004",
          accountName: "2-1004 Titipan Tip Kapster & Biaya Lain",
          debit: 0,
          credit: remainingTipOrOther,
        });
      }
    } else if (remainder < -0.009) {
      journalEntries.push({
        id: `${trx.id}-rounding`,
        date: dateStr,
        referenceNo: ref,
        description: `Selisih Pembulatan / Penyesuaian Kasir`,
        accountCode: "6-1003",
        accountName: "6-1003 Selisih Pembulatan Penjualan",
        debit: Math.abs(remainder),
        credit: 0,
      });
    }

    // Hitung HPP Aktual dari Product.attributes.costPrice / hpp dengan fallback 45% harga jual
    for (const it of trx.items || []) {
      const attrs = (it.product?.attributes as Record<string, any>) || {};
      const parsedCost = Number(
        attrs.costPrice ?? attrs.hpp ?? (it.product as any)?.costPrice ?? 0
      );
      const pCost = parsedCost > 0 ? parsedCost : Number(it.price) * 0.45;
      estimatedCogs += pCost * it.qty;
    }
  }

  // Pemasukan Kas Laci Manual (CashMovement IN)
  for (const cm of (cashMovements as any[]).filter((m: any) => m.type === "IN")) {
    const amount = Number(cm.amount || 0);
    if (amount <= 0) continue;
    const dateStr = cm.createdAt.toISOString().slice(0, 10);
    const refNo = `KAS-IN-${cm.id.slice(0, 6)}`;

    journalEntries.push({
      id: `${cm.id}-in-debit`,
      date: dateStr,
      referenceNo: refNo,
      description: cm.note || "Pemasukan Kas Laci Manual (Cash In)",
      accountCode: "1-1001",
      accountName: "1-1001 Kas di Tangan (Laci)",
      debit: amount,
      credit: 0,
    });
    journalEntries.push({
      id: `${cm.id}-in-credit`,
      date: dateStr,
      referenceNo: refNo,
      description: `Setoran / Tambahan Kas Laci (${cm.id.slice(0, 6)})`,
      accountCode: "3-1002",
      accountName: "3-1002 Tambahan Modal & Pemasukan Kas Laci",
      debit: 0,
      credit: amount,
    });
  }

  // Pengeluaran Kas Operasional & Refund Penjualan (CashMovement OUT)
  let operationalExpenses = 0;
  let totalRefunds = 0;

  for (const cm of (cashMovements as any[]).filter((m: any) => m.type === "OUT")) {
    const isRefund =
      (cm.note || "").toLowerCase().includes("refund") ||
      (cm.note || "").toLowerCase().includes("void");
    const amount = Number(cm.amount || 0);
    if (amount <= 0) continue;

    if (isRefund) {
      totalRefunds += amount;
      journalEntries.push({
        id: `${cm.id}-debit`,
        date: cm.createdAt.toISOString().slice(0, 10),
        referenceNo: `KAS-REFUND-${cm.id.slice(0, 6)}`,
        description: cm.note || "Pengembalian Kas / Refund Transaksi",
        accountCode: "4-1003",
        accountName: "4-1003 Retur & Pengembalian Kas Penjualan",
        debit: amount,
        credit: 0,
      });
      journalEntries.push({
        id: `${cm.id}-credit`,
        date: cm.createdAt.toISOString().slice(0, 10),
        referenceNo: `KAS-REFUND-${cm.id.slice(0, 6)}`,
        description: `Pengeluaran Kas Laci untuk Refund (${cm.id.slice(0, 6)})`,
        accountCode: "1-1001",
        accountName: "1-1001 Kas di Tangan (Laci)",
        debit: 0,
        credit: amount,
      });
    } else {
      operationalExpenses += amount;
      journalEntries.push({
        id: `${cm.id}-debit`,
        date: cm.createdAt.toISOString().slice(0, 10),
        referenceNo: `KAS-OUT-${cm.id.slice(0, 6)}`,
        description: cm.note || "Pengeluaran Kas Operasional Toko",
        accountCode: "6-1001",
        accountName: "6-1001 Beban Operasional Toko",
        debit: amount,
        credit: 0,
      });
      journalEntries.push({
        id: `${cm.id}-credit`,
        date: cm.createdAt.toISOString().slice(0, 10),
        referenceNo: `KAS-OUT-${cm.id.slice(0, 6)}`,
        description: `Pengeluaran Kas Laci untuk Operasional (${cm.id.slice(0, 6)})`,
        accountCode: "1-1001",
        accountName: "1-1001 Kas di Tangan (Laci)",
        debit: 0,
        credit: amount,
      });
    }
  }

  // Komisi Staf (Seimbang: Debit Beban Komisi, Kredit Utang Komisi)
  const staffCommissions = (commissions as any[]).reduce(
    (sum: number, c: any) => sum + Number(c.amount || 0),
    0
  );

  if (staffCommissions > 0) {
    const commDate = end.toISOString().slice(0, 10);
    journalEntries.push({
      id: `commissions-debit-${start.toISOString().slice(0, 10)}`,
      date: commDate,
      referenceNo: "KOMISI-STAF",
      description: `Beban Komisi & Bagi Hasil Staf (${(commissions as any[]).length} transaksi)`,
      accountCode: "6-1002",
      accountName: "6-1002 Beban Komisi & Bagi Hasil Staf",
      debit: staffCommissions,
      credit: 0,
    });
    journalEntries.push({
      id: `commissions-credit-${start.toISOString().slice(0, 10)}`,
      date: commDate,
      referenceNo: "KOMISI-STAF",
      description: `Alokasi Akrual Utang Komisi Staf (${(commissions as any[]).length} transaksi)`,
      accountCode: "2-1003",
      accountName: "2-1003 Utang Komisi Staf",
      debit: 0,
      credit: staffCommissions,
    });
  }

  const netSales = grossSales - discounts - totalRefunds;
  const totalRevenue = netSales + taxPb1 + taxPpn + serviceCharge + adminFees;
  const grossProfit = netSales + adminFees - estimatedCogs;
  const netProfit = grossProfit - operationalExpenses - staffCommissions;

  // Hitung audit keseimbangan (Debit === Kredit) dari seluruh baris jurnal periode ini sebelum slice tampilan
  const totalDebit =
    Math.round(journalEntries.reduce((sum, e) => sum + e.debit, 0) * 100) / 100;
  const totalCredit =
    Math.round(journalEntries.reduce((sum, e) => sum + e.credit, 0) * 100) /
    100;
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 1;

  return {
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    financials: {
      grossSales,
      discounts,
      netSales,
      taxPb1,
      taxPpn,
      serviceCharge,
      adminFees,
      totalRevenue,
      operationalExpenses,
      staffCommissions,
      estimatedCogs,
      grossProfit,
      netProfit,
    },
    auditTotals: {
      totalDebit,
      totalCredit,
      isBalanced,
      totalEntriesCount: journalEntries.length,
    },
    journalEntries: journalEntries.slice(0, 100), // Batasi 100 baris terbaru untuk UI
  };
}
