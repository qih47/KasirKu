export interface StoredPaymentIntent {
  orderId: string;
  type: "SAAS" | "POS" | "STORE";
  tenantId: string;
  outletId?: string;
  tierCode?: string;
  durationMonths?: number;
  selectedPluginIds?: string[];
  totalAmount: number;
  status: "PENDING" | "PAID";
  paidAt?: string;
  metadata?: any;
}

const g = globalThis as unknown as {
  __paymentIntentStore?: Map<string, StoredPaymentIntent>;
};

if (!g.__paymentIntentStore) {
  g.__paymentIntentStore = new Map<string, StoredPaymentIntent>();
}

export const paymentIntentStore = g.__paymentIntentStore;

export function savePaymentIntent(intent: StoredPaymentIntent) {
  paymentIntentStore.set(intent.orderId, intent);
}

export function getPaymentIntent(orderId: string): StoredPaymentIntent | undefined {
  return paymentIntentStore.get(orderId);
}

export function markPaymentIntentPaid(orderId: string): StoredPaymentIntent | undefined {
  let intent = paymentIntentStore.get(orderId);
  if (!intent) {
    intent = {
      orderId,
      type: orderId.startsWith("POS-") ? "POS" : (orderId.startsWith("SUB") || orderId.startsWith("INV")) ? "SAAS" : "STORE",
      tenantId: "",
      totalAmount: 0,
      status: "PAID",
      paidAt: new Date().toISOString(),
    };
    paymentIntentStore.set(orderId, intent);
    return intent;
  }
  intent.status = "PAID";
  intent.paidAt = new Date().toISOString();
  paymentIntentStore.set(orderId, intent);
  return intent;
}

