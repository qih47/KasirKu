/**
 * payroll-export.ts
 * Utility export rekap gaji ke format .xlsx (Excel) menggunakan SheetJS.
 */

import * as XLSX from "xlsx";

export interface PayrollExportRow {
  name: string;
  position: string;
  outletName: string;
  salaryType: string;
  baseSalaryEarned: number;
  overtimePay: number;
  totalCommissions: number;
  totalFixedAllowances: number;
  customBonus: number;
  deductions: number;
  takeHomePay: number;
  isProrated: boolean;
  prorateNote?: string | null;
}

export function exportPayrollToExcel(
  rows: PayrollExportRow[],
  periodLabel: string,
  businessName: string,
  selectedMonth: string
) {
  const salaryTypeLabel = (type: string) => {
    switch (type) {
      case "DAILY": return "Harian";
      case "PER_SHIFT": return "Per Shift";
      case "COMMISSION_ONLY": return "Bagi Hasil Murni";
      case "MONTHLY": return "Bulanan Tetap";
      default: return type;
    }
  };

  // ── Header baris info ──────────────────────────────────────────────
  const metaRows = [
    [businessName.toUpperCase()],
    [`REKAP PENGGAJIAN KARYAWAN — ${periodLabel.toUpperCase()}`],
    [`Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`],
    [],
  ];

  // ── Kolom header tabel ─────────────────────────────────────────────
  const headers = [
    "No",
    "Nama Karyawan",
    "Jabatan / Posisi",
    "Cabang",
    "Skema Gaji",
    "Gaji Pokok / Earned (Rp)",
    "Uang Lembur (Rp)",
    "Bagi Hasil / Komisi (Rp)",
    "Tunjangan Tetap (Rp)",
    "Bonus Tambahan (Rp)",
    "Potongan / Kasbon (Rp)",
    "TAKE HOME PAY (Rp)",
    "Ket. Prorata",
  ];

  // ── Data rows ──────────────────────────────────────────────────────
  const dataRows = rows.map((r, i) => [
    i + 1,
    r.name,
    r.position,
    r.outletName,
    salaryTypeLabel(r.salaryType),
    r.baseSalaryEarned,
    r.overtimePay,
    r.totalCommissions,
    r.totalFixedAllowances,
    r.customBonus,
    r.deductions,
    r.takeHomePay,
    r.isProrated ? (r.prorateNote || "Prorata") : "",
  ]);

  // ── Baris total ────────────────────────────────────────────────────
  const totalsRow = [
    "",
    "TOTAL",
    "",
    "",
    "",
    rows.reduce((s, r) => s + r.baseSalaryEarned, 0),
    rows.reduce((s, r) => s + r.overtimePay, 0),
    rows.reduce((s, r) => s + r.totalCommissions, 0),
    rows.reduce((s, r) => s + r.totalFixedAllowances, 0),
    rows.reduce((s, r) => s + r.customBonus, 0),
    rows.reduce((s, r) => s + r.deductions, 0),
    rows.reduce((s, r) => s + r.takeHomePay, 0),
    "",
  ];

  // ── Susun worksheet ────────────────────────────────────────────────
  const wsData = [
    ...metaRows,
    headers,
    ...dataRows,
    [],
    totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Atur lebar kolom
  ws["!cols"] = [
    { wch: 4 },   // No
    { wch: 28 },  // Nama
    { wch: 18 },  // Jabatan
    { wch: 20 },  // Cabang
    { wch: 16 },  // Skema
    { wch: 22 },  // Gaji Pokok
    { wch: 18 },  // Lembur
    { wch: 22 },  // Komisi
    { wch: 20 },  // Tunjangan
    { wch: 18 },  // Bonus
    { wch: 18 },  // Potongan
    { wch: 22 },  // THP
    { wch: 35 },  // Prorata ket
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Gaji");

  const safePeriod = selectedMonth.replace(/-/g, "_");
  const fileName = `Gaji_${businessName.replace(/\s+/g, "_")}_${safePeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
