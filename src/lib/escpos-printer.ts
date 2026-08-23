/**
 * ESC/POS Modular Thermal Printer Helper (58mm / 80mm)
 * Mendukung 4 Vertikal Bisnis: Barbershop, F&B Cafe, Laundry, dan Retail/Supermarket + Kitchen Slip (KOT).
 */

export interface BaseReceiptItem {
  id?: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  notes?: string;
  barcode?: string;
  category?: string;
}

export interface UniversalReceiptData {
  vertical: "BARBERSHOP" | "CAFE" | "LAUNDRY" | "RETAIL" | "GENERAL";
  businessName: string;
  legalName?: string;
  npwp?: string;
  outletName: string;
  outletAddress?: string;
  outletPhone?: string;
  transactionNumber: string;
  date: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: BaseReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  voucherCode?: string;
  taxPb1Amount?: number;
  taxPpnAmount?: number;
  serviceChargeAmount?: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  footerNote?: string;

  // 1. Vertikal: Barbershop
  barberStaffName?: string;
  barberChairNumber?: number;
  barberQueueNumber?: string;
  barberTipAmount?: number;

  // 2. Vertikal: Cafe & Resto
  cafeTableNumber?: string;
  cafeAreaZone?: string;
  cafeOrderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  cafeWaiterName?: string;

  // 3. Vertikal: Laundry
  laundryServiceType?: "KILOAN" | "SATUAN";
  laundryWeightKg?: number;
  laundryUnitQty?: number;
  laundryFragrance?: string;
  laundryRackLocation?: string;
  laundryEstimatedCompletionDate?: string;

  // 4. Vertikal: Retail
  retailLoyaltyPointsEarned?: number;
  retailTotalLoyaltyPoints?: number;
  retailTotalSavings?: number;
}

export class EscPosBuilder {
  private buffer: string[] = [];

  private static ESC = "\x1B";
  private static GS = "\x1D";

  public init() {
    this.buffer.push(`${EscPosBuilder.ESC}@`);
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

  public doubleSize(enabled: boolean) {
    this.buffer.push(`${EscPosBuilder.ESC}!${enabled ? "\x30" : "\x00"}`);
    return this;
  }

  public text(str: string) {
    this.buffer.push(`${str}\n`);
    return this;
  }

  public divider(length: number = 32, char: string = "-") {
    this.buffer.push(`${char.repeat(length)}\n`);
    return this;
  }

  public row(left: string, right: string, totalWidth: number = 32) {
    const rightLen = right.length;
    const maxLeftLen = totalWidth - rightLen - 1;
    const truncatedLeft = left.length > maxLeftLen ? left.substring(0, maxLeftLen) : left;
    const spaces = Math.max(1, totalWidth - truncatedLeft.length - rightLen);
    this.buffer.push(`${truncatedLeft}${" ".repeat(spaces)}${right}\n`);
    return this;
  }

  public feed(lines: number = 2) {
    this.buffer.push(`${EscPosBuilder.ESC}d${String.fromCharCode(lines)}`);
    return this;
  }

  public cut() {
    this.buffer.push(`${EscPosBuilder.GS}V\x41\x00`);
    return this;
  }

  public build(): string {
    return this.buffer.join("");
  }
}

/**
 * 1. Template Struk BARBERSHOP & SALON
 */
export function generateBarberEscPosReceipt(data: UniversalReceiptData, paperSize: "58mm" | "80mm" = "58mm"): string {
  const width = paperSize === "80mm" ? 48 : 32;
  const b = new EscPosBuilder();

  b.init()
    .align("CENTER")
    .bold(true)
    .doubleSize(true)
    .text(data.businessName.toUpperCase())
    .doubleSize(false)
    .bold(false)
    .text(data.outletName)
    if (data.outletAddress) b.text(data.outletAddress);
    if (data.outletPhone) b.text(`Telp: ${data.outletPhone}`);
    b.divider(width, "=");

  // Badge Antrian & Kapster
  b.align("CENTER").bold(true);
  if (data.barberQueueNumber) {
    b.text(`[ NO. ANTRIAN: ${data.barberQueueNumber} ]`);
  }
  if (data.barberStaffName || data.barberChairNumber) {
    const kapsterInfo = [
      data.barberChairNumber ? `KURSI #${data.barberChairNumber}` : "",
      data.barberStaffName ? `KAPSTER: ${data.barberStaffName.toUpperCase()}` : "",
    ].filter(Boolean).join(" | ");
    b.text(`[ ${kapsterInfo} ]`);
  }
  b.bold(false).divider(width, "-");

  // Metadata
  b.align("LEFT")
    .row("No. Trx", data.transactionNumber, width)
    .row("Tanggal", data.date, width)
    .row("Kasir", data.cashierName, width);
  if (data.customerName) b.row("Pelanggan", data.customerName, width);
  b.divider(width, "-");

  // Items
  for (const item of data.items) {
    b.bold(true).text(item.name).bold(false);
    b.row(
      `  ${item.qty}x @Rp ${item.price.toLocaleString("id-ID")}`,
      `Rp ${item.subtotal.toLocaleString("id-ID")}`,
      width
    );
  }
  b.divider(width, "-");

  // Finansial
  b.row("Subtotal", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width);
  if (data.discountAmount && data.discountAmount > 0) {
    b.row("Diskon", `-Rp ${data.discountAmount.toLocaleString("id-ID")}`, width);
  }
  if (data.barberTipAmount && data.barberTipAmount > 0) {
    b.row("Tip Kapster", `+Rp ${data.barberTipAmount.toLocaleString("id-ID")}`, width);
  }
  b.bold(true).row("TOTAL BAYAR", `Rp ${data.totalAmount.toLocaleString("id-ID")}`, width).bold(false);
  b.row(`Bayar (${data.paymentMethod})`, `Rp ${data.amountPaid.toLocaleString("id-ID")}`, width);
  b.row("Kembalian", `Rp ${data.change.toLocaleString("id-ID")}`, width);
  b.divider(width, "=");

  // Footer
  b.align("CENTER")
    .text("Gaya Rambut Maksimal, Percaya Diri!")
    .text(data.footerNote || "Terima Kasih Atas Kunjungan Anda")
    .text("Powered by POS Universal")
    .feed(3)
    .cut();

  return b.build();
}

/**
 * 2. Template Struk F&B CAFE & RESTO
 */
export function generateCafeEscPosReceipt(data: UniversalReceiptData, paperSize: "58mm" | "80mm" = "58mm"): string {
  const width = paperSize === "80mm" ? 48 : 32;
  const b = new EscPosBuilder();

  b.init()
    .align("CENTER")
    .bold(true)
    .doubleSize(true)
    .text(data.businessName.toUpperCase())
    .doubleSize(false)
    .bold(false)
    .text(data.outletName);
  if (data.outletAddress) b.text(data.outletAddress);
  if (data.outletPhone) b.text(`Telp: ${data.outletPhone}`);
  b.divider(width, "=");

  // Badge Meja & Tipe Order
  b.align("CENTER").bold(true);
  const orderTypeBadge = data.cafeOrderType === "TAKEAWAY" ? "TAKE AWAY" : "DINE IN";
  const tableBadge = data.cafeTableNumber ? `MEJA: ${data.cafeTableNumber}` : "FREE SEATING";
  const zoneBadge = data.cafeAreaZone ? `(${data.cafeAreaZone})` : "";
  b.text(`[ ${orderTypeBadge} | ${tableBadge} ${zoneBadge} ]`.trim());
  b.bold(false).divider(width, "-");

  // Metadata
  b.align("LEFT")
    .row("No. Trx", data.transactionNumber, width)
    .row("Waktu", data.date, width)
    .row("Kasir", data.cashierName, width);
  if (data.customerName) b.row("Tamu", data.customerName, width);
  b.divider(width, "-");

  // Items + Modifiers
  for (const item of data.items) {
    b.bold(true).text(item.name).bold(false);
    if (item.notes) {
      b.text(`  * Note: ${item.notes}`);
    }
    b.row(
      `  ${item.qty}x @Rp ${item.price.toLocaleString("id-ID")}`,
      `Rp ${item.subtotal.toLocaleString("id-ID")}`,
      width
    );
  }
  b.divider(width, "-");

  // Perhitungan Pajak Resto (PB1) & Service Charge
  b.row("Subtotal", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width);
  if (data.discountAmount && data.discountAmount > 0) {
    b.row("Diskon", `-Rp ${data.discountAmount.toLocaleString("id-ID")}`, width);
  }
  if (data.serviceChargeAmount && data.serviceChargeAmount > 0) {
    b.row("Service Charge", `+Rp ${data.serviceChargeAmount.toLocaleString("id-ID")}`, width);
  }
  if (data.taxPb1Amount && data.taxPb1Amount > 0) {
    b.row("PB1 Resto (10%)", `+Rp ${data.taxPb1Amount.toLocaleString("id-ID")}`, width);
  }
  b.bold(true).row("TOTAL", `Rp ${data.totalAmount.toLocaleString("id-ID")}`, width).bold(false);
  b.row(`Bayar (${data.paymentMethod})`, `Rp ${data.amountPaid.toLocaleString("id-ID")}`, width);
  b.row("Kembalian", `Rp ${data.change.toLocaleString("id-ID")}`, width);
  b.divider(width, "=");

  // Footer
  b.align("CENTER")
    .text("Selamat Menikmati Hidangan Kami!")
    .text(data.footerNote || "Silakan Datang Kembali")
    .text("Powered by POS Universal")
    .feed(3)
    .cut();

  return b.build();
}

/**
 * 2B. Slip Dapur KOT (Kitchen Order Ticket) F&B Cafe
 */
export function generateCafeKotKitchenSlip(data: UniversalReceiptData, paperSize: "58mm" | "80mm" = "58mm"): string {
  const width = paperSize === "80mm" ? 48 : 32;
  const b = new EscPosBuilder();

  b.init()
    .align("CENTER")
    .bold(true)
    .doubleSize(true)
    .text("*** SLIP DAPUR (KOT) ***")
    .doubleSize(false)
    .text(`OUTLET: ${data.outletName.toUpperCase()}`)
    .divider(width, "=");

  // Big Table / Order Type Header
  b.align("CENTER").bold(true);
  const orderType = data.cafeOrderType === "TAKEAWAY" ? "BUNGKUS / TAKE AWAY" : "DINE IN";
  const table = data.cafeTableNumber ? `MEJA ${data.cafeTableNumber}` : "ORDER CEPAT";
  b.doubleSize(true).text(`${orderType} - ${table}`).doubleSize(false);
  b.bold(false).divider(width, "-");

  b.align("LEFT")
    .row("Waktu Order", data.date, width)
    .row("No. Ref", data.transactionNumber.slice(-6), width);
  if (data.customerName) b.row("Nama Tamu", data.customerName, width);
  b.divider(width, "=");

  // List Item Pesanan
  b.align("LEFT");
  for (const item of data.items) {
    b.bold(true).text(`[ ] ${item.qty}x  ${item.name.toUpperCase()}`).bold(false);
    if (item.notes) {
      b.text(`    >>> NOTE: ${item.notes}`);
    }
    b.feed(1);
  }
  b.divider(width, "=");

  b.align("CENTER")
    .bold(true)
    .text(`TOTAL ITEM: ${data.items.reduce((s, i) => s + i.qty, 0)}`)
    .bold(false)
    .feed(3)
    .cut();

  return b.build();
}

/**
 * 3. Template Struk LAUNDRY KILOAN & SATUAN
 */
export function generateLaundryEscPosReceipt(data: UniversalReceiptData, paperSize: "58mm" | "80mm" = "58mm"): string {
  const width = paperSize === "80mm" ? 48 : 32;
  const b = new EscPosBuilder();

  b.init()
    .align("CENTER")
    .bold(true)
    .doubleSize(true)
    .text(data.businessName.toUpperCase())
    .doubleSize(false)
    .bold(false)
    .text(data.outletName);
  if (data.outletAddress) b.text(data.outletAddress);
  if (data.outletPhone) b.text(`WA: ${data.outletPhone}`);
  b.divider(width, "=");

  // Rak Penyimpanan & Wangi Parfum
  b.align("CENTER").bold(true);
  if (data.laundryRackLocation) {
    b.text(`[ RAK PENYIMPANAN: ${data.laundryRackLocation.toUpperCase()} ]`);
  }
  if (data.laundryFragrance) {
    b.text(`[ PARFUM: ${data.laundryFragrance.toUpperCase()} ]`);
  }
  if (data.laundryEstimatedCompletionDate) {
    b.text(`EST. SELESAI: ${data.laundryEstimatedCompletionDate}`);
  }
  b.bold(false).divider(width, "-");

  // Metadata
  b.align("LEFT")
    .row("No. Nota", data.transactionNumber, width)
    .row("Tgl Terima", data.date, width)
    .row("Operator", data.cashierName, width);
  if (data.customerName) b.row("Pelanggan", data.customerName, width);
  if (data.customerPhone) b.row("No. HP", data.customerPhone, width);
  b.divider(width, "-");

  // Items
  for (const item of data.items) {
    b.bold(true).text(item.name).bold(false);
    b.row(
      `  ${item.qty} ${data.laundryServiceType === "KILOAN" ? "Kg" : "Pcs"} @Rp ${item.price.toLocaleString("id-ID")}`,
      `Rp ${item.subtotal.toLocaleString("id-ID")}`,
      width
    );
  }
  b.divider(width, "-");

  // Finansial
  b.row("Subtotal", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width);
  if (data.discountAmount && data.discountAmount > 0) {
    b.row("Diskon", `-Rp ${data.discountAmount.toLocaleString("id-ID")}`, width);
  }
  b.bold(true).row("TOTAL BIAYA", `Rp ${data.totalAmount.toLocaleString("id-ID")}`, width).bold(false);
  b.row(`Status Bayar (${data.paymentMethod})`, `Rp ${data.amountPaid.toLocaleString("id-ID")}`, width);
  b.divider(width, "=");

  // Syarat Ketentuan Laundry
  b.align("CENTER")
    .text("KLAIM PENGAMBILAN CUCIAN:")
    .text("1. Harap bawa nota ini saat ambil cucian.")
    .text("2. Komplain maksimal 1x24 jam setelah diambil.")
    .text("3. Cucian tidak diambil > 30 hari di luar tanggungan.")
    .text(data.footerNote || "Terima Kasih Atas Kepercayaan Anda")
    .feed(3)
    .cut();

  return b.build();
}

/**
 * 4. Template Struk RETAIL / TOKO & SUPERMARKET
 */
export function generateRetailEscPosReceipt(data: UniversalReceiptData, paperSize: "58mm" | "80mm" = "58mm"): string {
  const width = paperSize === "80mm" ? 48 : 32;
  const b = new EscPosBuilder();

  b.init()
    .align("CENTER")
    .bold(true)
    .doubleSize(true)
    .text(data.businessName.toUpperCase())
    .doubleSize(false)
    .bold(false)
    .text(data.outletName);
  if (data.legalName) b.text(`PT/CV: ${data.legalName}`);
  if (data.npwp) b.text(`NPWP: ${data.npwp}`);
  if (data.outletAddress) b.text(data.outletAddress);
  b.divider(width, "=");

  // Metadata
  b.align("LEFT")
    .row("No. Struk", data.transactionNumber, width)
    .row("Waktu", data.date, width)
    .row("Kasir", data.cashierName, width);
  if (data.customerName) b.row("Member", data.customerName, width);
  b.divider(width, "-");

  // Items
  for (const item of data.items) {
    b.text(item.name);
    b.row(
      `  ${item.qty}x @Rp ${item.price.toLocaleString("id-ID")}`,
      `Rp ${item.subtotal.toLocaleString("id-ID")}`,
      width
    );
  }
  b.divider(width, "-");

  // Finansial & Pajak
  b.row("Subtotal", `Rp ${data.subtotal.toLocaleString("id-ID")}`, width);
  if (data.discountAmount && data.discountAmount > 0) {
    b.row("Hemat Diskon", `-Rp ${data.discountAmount.toLocaleString("id-ID")}`, width);
  }
  if (data.taxPpnAmount && data.taxPpnAmount > 0) {
    b.row("PPN (11%)", `+Rp ${data.taxPpnAmount.toLocaleString("id-ID")}`, width);
  }
  b.bold(true).row("TOTAL BELANJA", `Rp ${data.totalAmount.toLocaleString("id-ID")}`, width).bold(false);
  b.row(`Bayar (${data.paymentMethod})`, `Rp ${data.amountPaid.toLocaleString("id-ID")}`, width);
  b.row("Kembalian", `Rp ${data.change.toLocaleString("id-ID")}`, width);

  // Poin Loyalitas & Penghematan
  if (data.retailLoyaltyPointsEarned || data.retailTotalSavings) {
    b.divider(width, "-");
    if (data.retailTotalSavings && data.retailTotalSavings > 0) {
      b.row("Anda Berhemat", `Rp ${data.retailTotalSavings.toLocaleString("id-ID")}`, width);
    }
    if (data.retailLoyaltyPointsEarned && data.retailLoyaltyPointsEarned > 0) {
      b.row("Poin Didapat", `+${data.retailLoyaltyPointsEarned} Poin`, width);
    }
  }

  b.divider(width, "=");

  // Footer & Kebijakan Retur
  b.align("CENTER")
    .text("Barang yang sudah dibeli dapat ditukar")
    .text("maks. 2x24 jam dengan membawa struk ini.")
    .text(data.footerNote || "Terima Kasih Telah Berbelanja")
    .text("Powered by POS Universal")
    .feed(3)
    .cut();

  return b.build();
}

/**
 * Universal Dispatcher: Memilih template berdasarkan vertikal aktif
 */
export function generateUniversalEscPosReceipt(
  data: UniversalReceiptData,
  paperSize: "58mm" | "80mm" = "58mm"
): string {
  switch (data.vertical) {
    case "BARBERSHOP":
      return generateBarberEscPosReceipt(data, paperSize);
    case "CAFE":
      return generateCafeEscPosReceipt(data, paperSize);
    case "LAUNDRY":
      return generateLaundryEscPosReceipt(data, paperSize);
    case "RETAIL":
    default:
      return generateRetailEscPosReceipt(data, paperSize);
  }
}
