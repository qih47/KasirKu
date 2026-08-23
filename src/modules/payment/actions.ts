"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  chargeMidtransDynamicQris,
  createMidtransSnapTransaction,
  getMidtransTransactionStatus,
  getMidtransConfig,
} from "@/lib/midtrans";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "CARD";

/**
 * Generate Real Dynamic QRIS untuk Transaksi Kasir POS.
 * Mengembalikan EMVCo payload string, qrDataUrl (base64 image), dan expiry countdown.
 */
export async function generatePosDynamicQrisAction(data: {
  orderId: string;
  amount: number;
  outletId?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const { orderId, amount, customerName, customerPhone, items } = data;

  if (!amount || amount <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }

  // 1. Panggil Midtrans Core API (Dynamic QRIS)
  const result = await chargeMidtransDynamicQris({
    orderId,
    amount,
    customerDetails: customerName
      ? {
          first_name: customerName,
          phone: customerPhone || undefined,
        }
      : undefined,
    itemDetails: (items || []).map((it: any) => ({
      id: it.id,
      name: it.name.substring(0, 45),
      price: Math.round(it.price),
      quantity: it.quantity,
    })),
    customExpiryMinutes: 15,
  });

  // 2. Generate Base64 QR Image Data URL untuk preview instan di layar kasir
  let qrDataUrl = "";
  if (result.qrString) {
    qrDataUrl = await QRCode.toDataURL(result.qrString, {
      margin: 1,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  }

  return {
    success: true,
    orderId: result.orderId,
    transactionId: result.transactionId,
    grossAmount: result.grossAmount,
    qrString: result.qrString,
    qrDataUrl,
    expiryTime: result.expiryTime,
    isSimulated: result.isSimulated,
  };
}

/**
 * Cek status pembayaran POS secara real-time (Polling & Webhook Sync).
 */
export async function checkPosPaymentStatusAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Akses ditolak.");

  // 1. Cek di Database Lokal apakah sudah PAID melalui Webhook
  const transaction = await prisma.transaction.findFirst({
    where: {
      OR: [{ transactionNumber: orderId }, { id: orderId }],
    },
    include: { payments: true },
  });

  if (transaction && transaction.status === "PAID") {
    return {
      isPaid: true,
      status: "PAID",
      source: "DATABASE_WEBHOOK",
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      totalAmount: Number(transaction.totalAmount),
    };
  }

  // 2. Jika belum PAID di database lokal, cek status langsung ke Midtrans API
  try {
    const midtransStatus = await getMidtransTransactionStatus(orderId);
    const trxStatus = midtransStatus.transaction_status;
    const fraudStatus = midtransStatus.fraud_status;

    const isSettled =
      trxStatus === "settlement" ||
      (trxStatus === "capture" && (fraudStatus === "accept" || !fraudStatus));

    if (isSettled && transaction) {
      // Sinkronisasi status menjadi PAID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "PAID" },
      });

      await prisma.payment.updateMany({
        where: { transactionId: transaction.id },
        data: { status: "SUCCESS", gatewayRef: midtransStatus.transaction_id || orderId },
      });

      return {
        isPaid: true,
        status: "PAID",
        source: "MIDTRANS_DIRECT_POLL",
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        totalAmount: Number(transaction.totalAmount),
      };
    }

    return {
      isPaid: isSettled,
      status: trxStatus || "PENDING",
      source: "MIDTRANS_PENDING",
    };
  } catch (err: any) {
    return {
      isPaid: false,
      status: "PENDING",
      error: err.message,
    };
  }
}

/**
 * Generate Midtrans Snap Token untuk Faktur Langganan SaaS / Upgrade Lisensi.
 */
export async function createSaaSSnapInvoiceAction(data: {
  tierCode: string;
  durationMonths: number;
  totalAmount: number;
  tierName: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  const { tierCode, durationMonths, totalAmount, tierName } = data;

  const orderId = `SUB-${user.tenantId}-${tierCode.toUpperCase()}-${durationMonths}-${Date.now()}`;

  const snapResult = await createMidtransSnapTransaction({
    orderId,
    amount: totalAmount,
    customerDetails: {
      first_name: user.name || "Tenant Owner",
      email: user.email || undefined,
    },
    itemDetails: [
      {
        id: `TIER-${tierCode}`,
        name: `Langganan ${tierName} (${durationMonths} Bulan)`,
        price: Math.round(totalAmount),
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?status=success&order_id=${orderId}`,
    },
  });

  return {
    success: true,
    orderId,
    token: snapResult.token,
    redirectUrl: snapResult.redirectUrl,
    clientKey: snapResult.clientKey,
    isSimulated: snapResult.isSimulated,
  };
}

/**
 * Generate Real Dynamic QRIS untuk Pembayaran Langganan SaaS / Upgrade Lisensi.
 */
export async function generateSaaSDynamicQrisAction(data: {
  tierCode: string;
  durationMonths: number;
  totalAmount: number;
  tierName: string;
  pluginNames?: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai Owner.");
  }

  const user = session.user as any;
  const { tierCode, durationMonths, totalAmount, tierName, pluginNames } = data;

  if (!totalAmount || totalAmount <= 0) {
    throw new Error("Nominal invoice langganan tidak valid.");
  }

  const orderId = `SUB-${user.tenantId.substring(0, 8)}-${tierCode.toUpperCase()}-${durationMonths}M-${Date.now().toString().slice(-6)}`;

  const result = await chargeMidtransDynamicQris({
    orderId,
    amount: totalAmount,
    customerDetails: {
      first_name: user.name || "Owner",
      email: user.email || undefined,
    },
    itemDetails: [
      {
        id: `TIER-${tierCode}`,
        name: `Lisensi ${tierName} (${durationMonths} Bulan)`.substring(0, 45),
        price: Math.round(totalAmount),
        quantity: 1,
      },
    ],
    customExpiryMinutes: 15,
  });

  let qrDataUrl = "";
  if (result.qrString) {
    qrDataUrl = await QRCode.toDataURL(result.qrString, {
      margin: 1,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  }

  // Rekening Virtual Account Demo Standar
  const vaNumbers = {
    bca: `80777${Date.now().toString().slice(-8)}`,
    mandiri: `89508${Date.now().toString().slice(-8)}`,
    bni: `98812${Date.now().toString().slice(-8)}`,
    bri: `10234${Date.now().toString().slice(-8)}`,
  };

  return {
    success: true,
    orderId,
    grossAmount: totalAmount,
    qrString: result.qrString,
    qrDataUrl,
    expiryTime: result.expiryTime,
    isSimulated: result.isSimulated,
    vaNumbers,
  };
}

/**
 * Cek status pembayaran langganan SaaS via polling.
 */
export async function checkSaaSPaymentStatusAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Akses ditolak.");

  try {
    const midtransStatus = await getMidtransTransactionStatus(orderId);
    const trxStatus = midtransStatus?.transaction_status;
    const isSettled = trxStatus === "settlement" || trxStatus === "capture";

    return {
      isPaid: isSettled,
      status: trxStatus || "PENDING",
    };
  } catch (err: any) {
    return {
      isPaid: false,
      status: "PENDING",
      error: err.message,
    };
  }
}

/**
 * Simulasi Pembayaran Berhasil (Khusus Demo / Sandbox / Manual Kasir Override)
 */
export async function simulatePaymentWebhookAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Akses ditolak.");

  const transaction = await prisma.transaction.findFirst({
    where: {
      OR: [{ transactionNumber: orderId }, { id: orderId }],
    },
  });

  if (transaction) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "PAID" },
    });

    await prisma.payment.updateMany({
      where: { transactionId: transaction.id },
      data: { status: "SUCCESS", gatewayRef: `MOCK-PAID-${Date.now()}` },
    });

    revalidatePath("/dashboard");
    revalidatePath("/pos");
  }

  return {
    success: true,
    orderId,
    status: "PAID",
    paidAt: new Date().toISOString(),
  };
}
