/**
 * ESC/POS Thermal Printer Bridge Helper
 * Menyusun format teks dan raw byte sequences untuk printer thermal 58mm / 80mm (ESC/POS standard).
 */

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  businessName: string;
  outletName: string;
  outletAddress?: string;
  transactionNumber: string;
  date: string;
  cashierName: string;
  items: ReceiptItem[];
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  footerNote?: string;
}

export class EscPosBuilder {
  private buffer: string[] = [];

  // ESC/POS Command Constants
  private static ESC = "\x1B";
  private static GS = "\x1D";

  public init() {
    this.buffer.push(`${EscPosBuilder.ESC}@`); // Initialize printer
    return this;
  }

  public align(alignment: "LEFT" | "CENTER" | "RIGHT") {
    const code = alignment === "CENTER" ? "\x01" : alignment === "RIGHT" ? "\x02" : "\x00";
    this.buffer.push(`${EscPosBuilder.ESC}a${code}`);
    return this;
  }

  public bold(enabled: boolean) {
    this.buffer.push(`${EscPosBuilder.ESC}E${enabled ? "\x01" : "\x00"}`);
    return this;
  }

  public text(str: string) {
    this.buffer.push(`${str}\n`);
    return this;
  }

  public line(length: number = 32) {
    this.buffer.push(`${"-".repeat(length)}\n`);
    return this;
  }

  public feed(lines: number = 2) {
    this.buffer.push(`${EscPosBuilder.ESC}d${String.fromCharCode(lines)}`);
    return this;
  }

  public cut() {
    this.buffer.push(`${EscPosBuilder.GS}V\x41\x00`); // Full paper cut
    return this;
  }

  public build(): string {
    return this.buffer.join("");
  }
}

/**
 * Format thermal receipt 58mm
 */
export function generateEscPosReceipt58mm(data: ReceiptData): string {
  const builder = new EscPosBuilder();

  builder
    .init()
    .align("CENTER")
    .bold(true)
    .text(data.businessName.toUpperCase())
    .bold(false)
    .text(data.outletName)
    .text(data.outletAddress || "")
    .line(32)
    .align("LEFT")
    .text(`No. TRX : ${data.transactionNumber}`)
    .text(`Tanggal : ${data.date}`)
    .text(`Kasir   : ${data.cashierName}`)
    .line(32);

  for (const item of data.items) {
    builder
      .text(item.name)
      .text(
        `  ${item.qty} x Rp ${item.price.toLocaleString("id-ID")}`.padEnd(18) +
        `Rp ${item.subtotal.toLocaleString("id-ID")}`.padStart(14)
      );
  }

  builder
    .line(32)
    .text(
      `TOTAL`.padEnd(14) +
      `Rp ${data.totalAmount.toLocaleString("id-ID")}`.padStart(18)
    )
    .text(
      `BAYAR (${data.paymentMethod})`.padEnd(14) +
      `Rp ${data.amountPaid.toLocaleString("id-ID")}`.padStart(18)
    )
    .text(
      `KEMBALI`.padEnd(14) +
      `Rp ${data.change.toLocaleString("id-ID")}`.padStart(18)
    )
    .line(32)
    .align("CENTER")
    .text(data.footerNote || "Terima Kasih Atas Kunjungan Anda!")
    .text("Powered by POS Universal")
    .feed(3)
    .cut();

  return builder.build();
}
