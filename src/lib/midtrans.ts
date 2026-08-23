import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

/**
 * Mendapatkan konfigurasi Midtrans aktif.
 * Prioritas: Platform Settings DB -> Environment Variables -> Default Sandbox Fallback.
 */
export async function getMidtransConfig(tenantId?: string): Promise<MidtransConfig> {
  const envServerKey = process.env.MIDTRANS_SERVER_KEY;
  const envClientKey = process.env.MIDTRANS_CLIENT_KEY;
  const envIsProd = process.env.MIDTRANS_IS_PRODUCTION === "true";

  // Cek Platform Settings jika ada
  let dbServerKey = "";
  let dbClientKey = "";
  let dbIsProd = false;

  try {
    const settings = await (prisma as any).platformSetting.findMany({
      where: {
        key: {
          in: ["midtrans_server_key", "midtrans_client_key", "midtrans_is_production"],
        },
      },
    });

    for (const s of settings) {
      if (s.key === "midtrans_server_key") dbServerKey = typeof s.value === "string" ? s.value : String(s.value || "");
      if (s.key === "midtrans_client_key") dbClientKey = typeof s.value === "string" ? s.value : String(s.value || "");
      if (s.key === "midtrans_is_production") dbIsProd = s.value === true || s.value === "true";
    }
  } catch (err) {
    // Abaikan jika database belum siap
  }

  const serverKey = dbServerKey || envServerKey || "SB-Mid-server-demo-posuniversal";
  const clientKey = dbClientKey || envClientKey || "SB-Mid-client-demo-posuniversal";
  const isProduction = dbServerKey ? dbIsProd : envIsProd;

  return { serverKey, clientKey, isProduction };
}

function getBaseUrl(isProduction: boolean) {
  return {
    coreApi: isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2",
    snapApi: isProduction
      ? "https://app.midtrans.com/snap/v1"
      : "https://app.sandbox.midtrans.com/snap/v1",
  };
}

/**
 * Membuat Dynamic QRIS melalui Midtrans Core API.
 * Mengembalikan string EMVCo standard yang dapat langsung digenerate menjadi QR image.
 */
export async function chargeMidtransDynamicQris(params: {
  orderId: string;
  amount: number;
  customerDetails?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customExpiryMinutes?: number;
}) {
  const config = await getMidtransConfig();
  const urls = getBaseUrl(config.isProduction);

  // Jika kunci masih demo sandbox placeholder, gunakan generator EMVCo lokal cerdas
  if (config.serverKey === "SB-Mid-server-demo-posuniversal" || (!config.serverKey.startsWith("SB-") && !config.serverKey.startsWith("Mid-server-"))) {
    const paddedAmount = Math.round(params.amount).toString();
    const mockQrString = `00020101021226580016ID.CO.POSUNIVERSAL0118936000000000000000520458125303360540${paddedAmount}5802ID5913POS_UNIVERSAL6007JAKARTA6304`;
    const expiry = new Date(Date.now() + (params.customExpiryMinutes || 15) * 60000).toISOString();

    return {
      isSimulated: true,
      transactionId: `MOCK-${Date.now()}`,
      orderId: params.orderId,
      grossAmount: params.amount,
      qrString: mockQrString,
      qrUrl: null,
      expiryTime: expiry,
      statusCode: "201",
      statusMessage: "Success, QRIS generated (Demo Sandbox Mode)",
    };
  }

  const authHeader = `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`;

  const payload: any = {
    payment_type: "qris",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.amount),
    },
    qris: {
      acquirer: "gopay",
    },
  };

  if (params.customExpiryMinutes) {
    payload.custom_expiry = {
      expiry_duration: params.customExpiryMinutes,
      unit: "minute",
    };
  }

  if (params.customerDetails) {
    payload.customer_details = params.customerDetails;
  }

  if (params.itemDetails && params.itemDetails.length > 0) {
    payload.item_details = params.itemDetails;
  }

  const response = await fetch(`${urls.coreApi}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || (data.status_code && !["200", "201"].includes(data.status_code))) {
    throw new Error(data.status_message || `Gagal generate QRIS Midtrans: ${response.statusText}`);
  }

  const qrAction = data.actions?.find((a: any) => a.name === "generate-qr-code");

  return {
    isSimulated: false,
    transactionId: data.transaction_id,
    orderId: data.order_id,
    grossAmount: Number(data.gross_amount),
    qrString: data.qr_string || qrAction?.url || "",
    qrUrl: qrAction?.url || null,
    expiryTime: data.expiry_time,
    statusCode: data.status_code,
    statusMessage: data.status_message,
    raw: data,
  };
}

/**
 * Membuat Snap Token & Redirect URL untuk Pembayaran Faktur Langganan SaaS / Upgrade Tier.
 */
export async function createMidtransSnapTransaction(params: {
  orderId: string;
  amount: number;
  customerDetails?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  callbacks?: {
    finish?: string;
  };
}) {
  const config = await getMidtransConfig();
  const urls = getBaseUrl(config.isProduction);

  // Jika kunci demo placeholder, buat token simulasi
  if (config.serverKey === "SB-Mid-server-demo-posuniversal" || (!config.serverKey.startsWith("SB-") && !config.serverKey.startsWith("Mid-server-"))) {
    return {
      isSimulated: true,
      token: `MOCK_SNAP_TOKEN_${Date.now()}`,
      redirectUrl: `/dashboard/subscription?simulated_order_id=${params.orderId}`,
      clientKey: config.clientKey,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`;

  const payload: any = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.amount),
    },
  };

  if (params.customerDetails) {
    payload.customer_details = params.customerDetails;
  }

  if (params.itemDetails && params.itemDetails.length > 0) {
    payload.item_details = params.itemDetails;
  }

  if (params.callbacks) {
    payload.callbacks = params.callbacks;
  }

  const response = await fetch(`${urls.snapApi}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(data.error_messages?.join(", ") || "Gagal membuat transaksi Snap Midtrans.");
  }

  return {
    isSimulated: false,
    token: data.token,
    redirectUrl: data.redirect_url,
    clientKey: config.clientKey,
  };
}

/**
 * Cek status transaksi real-time ke Midtrans.
 */
export async function getMidtransTransactionStatus(orderId: string) {
  const config = await getMidtransConfig();
  const urls = getBaseUrl(config.isProduction);

  if (config.serverKey === "SB-Mid-server-demo-posuniversal" || (!config.serverKey.startsWith("SB-") && !config.serverKey.startsWith("Mid-server-"))) {
    // Mode demo fallback
    return {
      isSimulated: true,
      order_id: orderId,
      transaction_status: "pending",
      status_code: "201",
    };
  }

  const authHeader = `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`;

  const response = await fetch(`${urls.coreApi}/${orderId}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    return {
      error: true,
      status_code: response.status.toString(),
      status_message: errData.status_message || response.statusText,
    };
  }

  return await response.json();
}

/**
 * Memverifikasi keaslian webhook signature Midtrans menggunakan SHA-512 hash.
 */
export async function verifyMidtransWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): Promise<boolean> {
  const config = await getMidtransConfig();
  if (config.serverKey === "SB-Mid-server-demo-posuniversal") {
    // Bypass verifikasi pada mode demo simulator lokal
    return true;
  }

  const rawString = `${orderId}${statusCode}${grossAmount}${config.serverKey}`;
  const expectedHash = crypto.createHash("sha512").update(rawString).digest("hex");

  return expectedHash.toLowerCase() === signatureKey.toLowerCase();
}
