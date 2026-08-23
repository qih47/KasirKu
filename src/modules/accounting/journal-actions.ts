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
    totalRevenue: number;
    operationalExpenses: number;
    staffCommissions: number;
    estimatedCogs: number;
    grossProfit: number;
    netProfit: number;
  };
  journalEntries: JournalEntryLine[];
}

/**
 * Menghasilkan Jurnal Umum Akuntansi Otomatis dan Laporan Laba Rugi Real-Time.
 */
export async function getTenantAccountingSummaryAction(params?: {
  startDate?: string;
  endDate?: string;
  outletId?: string;
}): Promise<AccountingSummaryResult> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  const tenantId = user.tenantId;

  const start = params?.startDate ? new Date(params.startDate) : startOfDay(new Date());
  const end = params?.endDate ? new Date(params.endDate) : endOfDay(new Date());

  const outletFilter = params?.outletId ? { id: params.outletId } : { tenantId };

  // Query transaksi, mutasi kas, komisi staf dalam periode
  const [transactions, cashMovements, commissions] = await Promise.all([
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
        createdAt: { gte: start, lte: end },
      },
      include: { staff: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let grossSales = 0;
  let discounts = 0;
  let taxPb1 = 0;
  let taxPpn = 0;
  let serviceCharge = 0;
  let estimatedCogs = 0;

  const journalEntries: JournalEntryLine[] = [];

  for (const trx of transactions) {
    const total = Number(trx.totalAmount || 0);
    const subtotal = Number(trx.subtotalAmount || total);
    const disc = Number(trx.discountAmount || 0);
    const tax = Number(trx.taxAmount || 0);
    const svc = Number(trx.serviceCharge || 0);

    grossSales += subtotal;
    discounts += disc;
    taxPb1 += tax;
    serviceCharge += svc;

    const dateStr = trx.createdAt.toISOString().slice(0, 10);
    const ref = trx.transactionNumber;

    // 1. Debit: Kas / Bank (Aset Lancar)
    const pMethod = trx.payments[0]?.method || "CASH";
    const debitAccountName = pMethod === "CASH" ? "1-1001 Kas di Tangan (Laci)" : "1-1002 Bank & QRIS Settlement";

    journalEntries.push({
      id: `${trx.id}-debit`,
      date: dateStr,
      referenceNo: ref,
      description: `Penerimaan Pembayaran Penjualan (${pMethod})`,
      accountCode: pMethod === "CASH" ? "1-1001" : "1-1002",
      accountName: debitAccountName,
      debit: total,
      credit: 0,
    });

    // 2. Kredit: Pendapatan Penjualan
    journalEntries.push({
      id: `${trx.id}-rev`,
      date: dateStr,
      referenceNo: ref,
      description: `Pendapatan Penjualan Produk & Jasa`,
      accountCode: "4-1001",
      accountName: "4-1001 Pendapatan Penjualan POS",
      debit: 0,
      credit: subtotal - disc,
    });

    // 3. Kredit: Pajak Resto / PPN (Utang Lancar)
    if (tax > 0) {
      journalEntries.push({
        id: `${trx.id}-tax`,
        date: dateStr,
        referenceNo: ref,
        description: `Utang Pajak Resto (PB1) & PPN Terkumpul`,
        accountCode: "2-1001",
        accountName: "2-1001 Utang Pajak Penjualan",
        debit: 0,
        credit: tax,
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

    // Hitung Estimasi HPP
    for (const it of trx.items) {
      const pCost = Number((it.product as any)?.costPrice || (Number(it.price) * 0.45));
      estimatedCogs += pCost * it.qty;
    }
  }

  // Pengeluaran Kas Operasional
  const operationalExpenses = (cashMovements as any[])
    .filter((cm: any) => cm.type === "OUT")
    .reduce((sum: number, cm: any) => sum + Number(cm.amount || 0), 0);

  for (const cm of (cashMovements as any[]).filter((cm: any) => cm.type === "OUT")) {
    journalEntries.push({
      id: cm.id,
      date: cm.createdAt.toISOString().slice(0, 10),
      referenceNo: `KAS-OUT-${cm.id.slice(0, 6)}`,
      description: cm.note || "Pengeluaran Kas Operasional Toko",
      accountCode: "6-1001",
      accountName: "6-1001 Beban Operasional Toko",
      debit: Number(cm.amount),
      credit: 0,
    });
  }

  // Komisi Staf
  const staffCommissions = (commissions as any[]).reduce(
    (sum: number, c: any) => sum + Number(c.amount || 0),
    0
  );

  const netSales = grossSales - discounts;
  const totalRevenue = netSales + taxPb1 + serviceCharge;
  const grossProfit = netSales - estimatedCogs;
  const netProfit = grossProfit - operationalExpenses - staffCommissions;

  return {
    period: { start: start.toISOString(), end: end.toISOString() },
    financials: {
      grossSales,
      discounts,
      netSales,
      taxPb1,
      taxPpn,
      serviceCharge,
      totalRevenue,
      operationalExpenses,
      staffCommissions,
      estimatedCogs,
      grossProfit,
      netProfit,
    },
    journalEntries: journalEntries.slice(0, 100), // Batasi 100 baris terbaru
  };
}
