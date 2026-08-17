"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "CARD";

export async function createPaymentInvoiceAction(data: {
  amount: number;
  method: PaymentMethod;
  description: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Akses ditolak.");

  const { amount, method, description } = data;
  const invoiceId = `INV-${Date.now()}`;

  // Simulasi QRIS atau VA
  let paymentDetails: any = {
    invoiceId,
    amount,
    method,
    description,
    status: "PENDING",
  };

  if (method === "QRIS") {
    paymentDetails.qrString = `00020101021226580016ID.CO.POSUNIVERSAL0118936000000000000000520458125303360540${amount}5802ID5913POS_UNIVERSAL6007JAKARTA6304`;
  } else if (method === "TRANSFER") {
    paymentDetails.vaNumber = `8808${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    paymentDetails.bankName = "BCA Virtual Account";
  }

  return { success: true, paymentDetails };
}

export async function simulatePaymentWebhookAction(invoiceId: string) {
  return {
    success: true,
    invoiceId,
    status: "SUCCESS",
    paidAt: new Date().toISOString(),
  };
}
