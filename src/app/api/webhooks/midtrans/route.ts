import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransWebhookSignature } from "@/lib/midtrans";
import { markPaymentIntentPaid, getPaymentIntent } from "@/lib/payment-intent-store";
import { addDays, addMonths } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      settlement_time,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { error: "Payload webhook Midtrans tidak lengkap" },
        { status: 400 }
      );
    }

    // 1. Verifikasi Keaslian Signature SHA-512
    const isValid = await verifyMidtransWebhookSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      console.warn(`[Midtrans Webhook] Signature tidak valid untuk order_id: ${order_id}`);
      return NextResponse.json(
        { error: "Signature tidak valid" },
        { status: 403 }
      );
    }

    const isPaid =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    const isFailed =
      transaction_status === "cancel" ||
      transaction_status === "expire" ||
      transaction_status === "deny";

    console.log(`[Midtrans Webhook] Memproses order_id: ${order_id}, status: ${transaction_status}, isPaid: ${isPaid}`);

    // =========================================================================
    // 2. SKENARIO A: TRANSAKSI KASIR POS (Dynamic QRIS / Online Payment)
    // =========================================================================
    if (isPaid && (order_id.startsWith("POS-") || order_id.startsWith("TRX-"))) {
        markPaymentIntentPaid(order_id);
      }

      if (order_id.startsWith("TRX-") || order_id.startsWith("POS-")) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [{ transactionNumber: order_id }, { id: order_id }],
        },
        include: { payments: true },
      });

      if (transaction) {
        if (isPaid) {
          // Update status Transaksi menjadi PAID
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "PAID" },
          });

          // Update atau catat pembayaran
          const existingPayment = (transaction.payments as any[]).find(
            (p: any) => p.gatewayRef === transaction_id || p.method === "QRIS"
          );

          if (existingPayment) {
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: "SUCCESS",
                gatewayRef: transaction_id || order_id,
              },
            });
          } else {
            await prisma.payment.create({
              data: {
                transactionId: transaction.id,
                method: payment_type?.toUpperCase().includes("QRIS") ? "QRIS" : "TRANSFER",
                amount: gross_amount ? Number(gross_amount) : transaction.totalAmount,
                status: "SUCCESS",
                gatewayRef: transaction_id || order_id,
              },
            });
          }

          // Sinkronisasi status Live Order (Cafe Self Order) jika ada
          if ((prisma as any).liveOrder) {
            await (prisma as any).liveOrder.updateMany({
              where: { transactionId: transaction.id },
              data: { paymentStatus: "PAID_ONLINE", status: "CONFIRMED" },
            }).catch(() => {});
          }

          // Sinkronisasi status Booking (Barbershop) jika ada
          await prisma.booking.updateMany({
            where: {
              outletId: transaction.outletId,
              status: "IN_PROGRESS",
              updatedAt: { gte: transaction.createdAt },
            },
            data: { status: "COMPLETED", completedAt: new Date() },
          }).catch(() => {});
        } else if (isFailed) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "CANCELLED" },
          });

          await prisma.payment.updateMany({
            where: { transactionId: transaction.id },
            data: { status: "FAILED" },
          });
        }
      }
    }

    // =========================================================================
    // 3. SKENARIO B: TAGIHAN LANGGANAN SAAS (SUB_ / SUB- / INV-)
    // =========================================================================
    if (order_id.startsWith("SUB") || order_id.startsWith("INV")) {
      if (isPaid) {
        markPaymentIntentPaid(order_id);
        const stored = getPaymentIntent(order_id);
        let tenantId = stored?.tenantId;
        let tierCode = stored?.tierCode;
        let durationMonths = stored?.durationMonths;
        let selectedPluginIds = stored?.selectedPluginIds || [];

        if (!tenantId && order_id.includes("_")) {
          // Reconstruct dari format SUB_{tenantHex}_{tierCode}_{duration}M_{time}
          const parts = order_id.split("_");
          const tenantHex = parts[1];
          if (tenantHex && tenantHex.length === 32) {
            tenantId = tenantHex.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
          }
          tierCode = parts[2]?.toLowerCase();
          durationMonths = parseInt(parts[3], 10) || 1;
        }

        if (tenantId) {
          const licenseTier = await prisma.licenseTier.findFirst({
            where: {
              OR: [
                { code: (tierCode || "pro").toLowerCase() },
                { code: { startsWith: (tierCode || "pro").toLowerCase().slice(0, 3) } },
              ],
            },
          });

          if (licenseTier) {
            const effDuration = durationMonths || 1;
            const startDate = new Date();
            const endDate = addMonths(startDate, effDuration);

            const existingSub = await prisma.tenantSubscription.findFirst({
              where: { tenantId, isActive: true },
              include: { theme: true },
            });

            await prisma.$transaction(async (tx: any) => {
              await tx.tenantSubscription.updateMany({
                where: { tenantId, isActive: true },
                data: { isActive: false },
              });

              const newSub = await tx.tenantSubscription.create({
                data: {
                  tenantId,
                  licenseTierId: licenseTier.id,
                  billingCycle: effDuration >= 12 ? "ANNUAL" : "MONTHLY",
                  durationMonths: effDuration,
                  durationKey: `${effDuration}M`,
                  currentPeriodStart: startDate,
                  currentPeriodEnd: endDate,
                  isActive: true,
                },
              });

              if (existingSub?.theme) {
                await tx.tenantTheme.create({
                  data: {
                    subscriptionId: newSub.id,
                    themeId: existingSub.theme.themeId,
                    customConfig: existingSub.theme.customConfig,
                  },
                });
              }

              for (const pid of selectedPluginIds) {
                await tx.tenantPlugin.create({
                  data: {
                    subscriptionId: newSub.id,
                    pluginId: pid,
                    isActive: true,
                  },
                });
              }

              await tx.tenant.update({
                where: { id: tenantId },
                data: {
                  status: "ACTIVE",
                  lockedAt: null,
                },
              });
            });
          }
        }
      }
    }

    return NextResponse.json({
      status: "OK",
      message: "Notifikasi Midtrans berhasil diproses.",
      order_id,
      isPaid,
    });
  } catch (error: any) {
    console.error("[Midtrans Webhook Error]", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses webhook Midtrans" },
      { status: 500 }
    );
  }
}
