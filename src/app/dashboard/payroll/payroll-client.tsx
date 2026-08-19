"use client";

import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/swal";
import {
  getPayrollData,
  updatePayrollCutoffAction,
  savePayrollSnapshotAction,
  toggleLockPayrollPeriodAction,
  getPayrollHistoryAction,
  unlockPayrollPeriodAction,
  PayrollStaffRecord,
} from "@/modules/payroll/payroll-actions";
import {
  getStaffAdvancesData,
  createStaffAdvanceAction,
  recordManualAdvancePaymentAction,
  deleteStaffAdvanceAction,
  StaffAdvanceItem,
} from "@/modules/payroll/advance-actions";
import { exportPayrollToExcel } from "@/lib/payroll-export";
import {
  DollarSign,
  Calendar,
  Store,
  Users,
  Printer,
  Share2,
  FileText,
  Percent,
  CheckCircle2,
  Search,
  ArrowUpRight,
  TrendingUp,
  X,
  Phone,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  Loader2,
  Save,
  Lock,
  Unlock,
  Sparkles,
  FileSpreadsheet,
  History,
  SendHorizonal,
  CreditCard,
  Plus,
  Trash2,
  Wallet,
  Receipt,
} from "lucide-react";

export function PayrollClient({
  initialData,
}: {
  initialData: {
    selectedMonth: string;
    monthLabel?: string;
    periodLabel: string;
    payrollCutoffDay?: number;
    cutoffStartDate?: string;
    cutoffEndDate?: string;
    isPeriodLocked?: boolean;
    hasSavedSnapshots?: boolean;
    records: PayrollStaffRecord[];
    outlets: any[];
    businessName: string;
    summary: {
      totalStaffCount: number;
      totalPayrollExpenditure: number;
      totalBaseSalarySum: number;
      totalCommissionsSum: number;
    };
  };
}) {
  const [data, setData] = useState(initialData);
  const [month, setMonth] = useState(initialData.selectedMonth);
  const [outletId, setOutletId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [cutoffDay, setCutoffDay] = useState<number>(initialData.payrollCutoffDay || 25);
  const [savingCutoff, setSavingCutoff] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [lockingPeriod, setLockingPeriod] = useState(false);

  // Tab: "PAYROLL" | "ADVANCES" | "HISTORY"
  const [activeTab, setActiveTab] = useState<"PAYROLL" | "ADVANCES" | "HISTORY">("PAYROLL");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [unlockingPeriod, setUnlockingPeriod] = useState<string | null>(null);
  const [broadcastingWA, setBroadcastingWA] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);

  // Staff Advance (Kasbon) States
  const [advanceData, setAdvanceData] = useState<any | null>(null);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceFilterStatus, setAdvanceFilterStatus] = useState<string>("ALL");
  const [advanceSearchQuery, setAdvanceSearchQuery] = useState("");
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedAdvanceForRepay, setSelectedAdvanceForRepay] = useState<StaffAdvanceItem | null>(null);
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Form State: Add Advance
  const [newAdvanceStaffId, setNewAdvanceStaffId] = useState("");
  const [newAdvanceAmount, setNewAdvanceAmount] = useState<number | string>("");
  const [newAdvanceScheme, setNewAdvanceScheme] = useState<"FULL" | "INSTALLMENT">("FULL");
  const [newAdvanceMonthly, setNewAdvanceMonthly] = useState<number | string>("");
  const [newAdvanceNote, setNewAdvanceNote] = useState("");

  // Form State: Repay Advance Manual
  const [manualRepayAmount, setManualRepayAmount] = useState<number | string>("");
  const [manualRepayNote, setManualRepayNote] = useState("");

  // Local adjustments for allowance / deductions per staff
  const [adjustments, setAdjustments] = useState<
    Record<string, { allowances: number; deductions: number }>
  >(() => {
    const init: Record<string, { allowances: number; deductions: number }> = {};
    initialData.records.forEach((r) => {
      init[r.staffId] = {
        allowances: r.customBonus || 0,
        deductions: r.deductions || 0,
      };
    });
    return init;
  });

  // Dynamic attendance work units (Hari Masuk / Shift Dikerjakan)
  const [workUnits, setWorkUnits] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    initialData.records.forEach((r) => {
      init[r.staffId] = r.workUnits;
    });
    return init;
  });

  // Dynamic overtime hours (Total Jam Lembur)
  const [overtimeHours, setOvertimeHours] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    initialData.records.forEach((r) => {
      init[r.staffId] = r.overtimeHours || 0;
    });
    return init;
  });

  // Dynamic advance deduction per staff
  const [advanceDeductions, setAdvanceDeductions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    initialData.records.forEach((r) => {
      init[r.staffId] = r.advanceDeduction || 0;
    });
    return init;
  });

  // Active Selected Staff for Slip Gaji Modal
  const [selectedSlipStaff, setSelectedSlipStaff] = useState<PayrollStaffRecord | null>(null);

  // Active Selected Staff for Commission / Bagi Hasil Breakdown Modal
  const [selectedDetailStaff, setSelectedDetailStaff] = useState<PayrollStaffRecord | null>(null);

  const fetchPayroll = async (newMonth: string, newOutlet: string) => {
    setLoading(true);
    try {
      const res = await getPayrollData({ month: newMonth, outletId: newOutlet });
      setData(res);
      // Sinkronkan state lokal dengan data yang baru ditarik
      const newWorkUnits: Record<string, number> = {};
      const newOtHours: Record<string, number> = {};
      const newAdj: Record<string, { allowances: number; deductions: number }> = {};
      const newAdv: Record<string, number> = {};
      res.records.forEach((r: PayrollStaffRecord) => {
        newWorkUnits[r.staffId] = r.workUnits;
        newOtHours[r.staffId] = r.overtimeHours || 0;
        newAdj[r.staffId] = {
          allowances: r.customBonus || 0,
          deductions: r.deductions || 0,
        };
        newAdv[r.staffId] = r.advanceDeduction || 0;
      });
      setWorkUnits(newWorkUnits);
      setOvertimeHours(newOtHours);
      setAdjustments(newAdj);
      setAdvanceDeductions(newAdv);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat data penggajian.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async () => {
    setAdvanceLoading(true);
    try {
      const res = await getStaffAdvancesData({ outletId: outletId });
      setAdvanceData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat data kasbon karyawan.");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvanceStaffId || !newAdvanceAmount || Number(newAdvanceAmount) <= 0) {
      toastError("Pilih staf dan masukkan nominal kasbon.");
      return;
    }
    setSavingAdvance(true);
    try {
      await createStaffAdvanceAction({
        staffId: newAdvanceStaffId,
        amount: Number(newAdvanceAmount),
        installmentMonthly:
          newAdvanceScheme === "INSTALLMENT" && Number(newAdvanceMonthly) > 0
            ? Number(newAdvanceMonthly)
            : null,
        note: newAdvanceNote,
        outletId: outletId !== "ALL" ? outletId : undefined,
      });
      toastSuccess("Pengajuan kasbon karyawan berhasil dicatat!");
      setShowAddAdvanceModal(false);
      setNewAdvanceStaffId("");
      setNewAdvanceAmount("");
      setNewAdvanceMonthly("");
      setNewAdvanceNote("");
      await fetchAdvances();
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal mencatat kasbon.");
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleManualRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvanceForRepay || !manualRepayAmount || Number(manualRepayAmount) <= 0) {
      toastError("Masukkan nominal pelunasan kasbon.");
      return;
    }
    setSavingAdvance(true);
    try {
      await recordManualAdvancePaymentAction({
        advanceId: selectedAdvanceForRepay.id,
        paymentAmount: Number(manualRepayAmount),
        note: manualRepayNote,
      });
      toastSuccess("Pembayaran kasbon berhasil dicatat!");
      setShowRepayModal(false);
      setSelectedAdvanceForRepay(null);
      setManualRepayAmount("");
      setManualRepayNote("");
      await fetchAdvances();
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal mencatat pembayaran kasbon.");
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleDeleteAdvance = async (advanceId: string) => {
    const confirmed = window.confirm("Hapus catatan kasbon ini?");
    if (!confirmed) return;
    try {
      await deleteStaffAdvanceAction(advanceId);
      toastSuccess("Catatan kasbon berhasil dihapus.");
      await fetchAdvances();
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal menghapus kasbon.");
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonth(val);
    fetchPayroll(val, outletId);
  };

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setOutletId(val);
    fetchPayroll(month, val);
    if (activeTab === "ADVANCES") {
      fetchAdvances();
    }
  };

  const handleCutoffChange = async (newDay: number) => {
    setCutoffDay(newDay);
    setSavingCutoff(true);
    try {
      await updatePayrollCutoffAction(newDay);
      toastSuccess(
        newDay === 1
          ? "Siklus gajian diatur ke Tgl 1 (1 s/d Akhir Bulan Kalender)."
          : `Siklus gajian diatur ke Tgl ${newDay} (Cut-off Tgl ${newDay} bln lalu s/d Tgl ${newDay - 1} bln ini).`
      );
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah tanggal gajian.");
    } finally {
      setSavingCutoff(false);
    }
  };

  const handleAdjustmentChange = (
    staffId: string,
    field: "allowances" | "deductions",
    val: number
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [staffId]: {
        allowances: field === "allowances" ? val : prev[staffId]?.allowances || 0,
        deductions: field === "deductions" ? val : prev[staffId]?.deductions || 0,
      },
    }));
  };

  const handleWorkUnitChange = (staffId: string, val: number) => {
    setWorkUnits((prev) => ({
      ...prev,
      [staffId]: Math.max(0, val),
    }));
  };

  const handleOvertimeHoursChange = (staffId: string, val: number) => {
    setOvertimeHours((prev) => ({
      ...prev,
      [staffId]: Math.max(0, val),
    }));
  };

  const handleAdvanceDeductionChange = (staffId: string, val: number) => {
    setAdvanceDeductions((prev) => ({
      ...prev,
      [staffId]: Math.max(0, val),
    }));
  };

  const getStaffAdvanceDeduction = (record: PayrollStaffRecord) => {
    if (advanceDeductions[record.staffId] !== undefined) return advanceDeductions[record.staffId];
    return record.advanceDeduction || 0;
  };

  // Filter staff list
  const filteredRecords = data.records.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      const matchPos = r.position.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPos) return false;
    }
    return true;
  });

  // Calculate dynamic work units
  const getStaffWorkUnits = (record: PayrollStaffRecord) => {
    if (workUnits[record.staffId] !== undefined) return workUnits[record.staffId];
    return record.workUnits;
  };

  // Calculate base salary received (termasuk Prorata)
  const getStaffBaseSalary = (record: PayrollStaffRecord) => {
    const units = getStaffWorkUnits(record);
    if (record.salaryType === "DAILY" || record.salaryType === "PER_SHIFT") {
      return record.baseSalary * units;
    }
    if (record.salaryType === "MONTHLY") {
      if (record.isProrated) {
        return Math.round((units / 26) * record.baseSalary);
      }
      return record.baseSalary;
    }
    if (record.salaryType === "COMMISSION_ONLY" || record.salaryType === "NONE") {
      return 0;
    }
    return record.baseSalary;
  };

  // Overtime calculation
  const getStaffOvertimeHours = (record: PayrollStaffRecord) => {
    if (overtimeHours[record.staffId] !== undefined) return overtimeHours[record.staffId];
    return record.overtimeHours || 0;
  };

  const getStaffOvertimePay = (record: PayrollStaffRecord) => {
    return (record.overtimeRate || 0) * getStaffOvertimeHours(record);
  };

  // Calculate total take-home pay
  const getStaffNetSalary = (record: PayrollStaffRecord) => {
    const base = getStaffBaseSalary(record);
    const ot = getStaffOvertimePay(record);
    const adj = adjustments[record.staffId] || { allowances: 0, deductions: 0 };
    const adv = getStaffAdvanceDeduction(record);
    return Math.max(
      0,
      base + ot + (record.totalFixedAllowances || 0) + record.totalCommissions + adj.allowances - adj.deductions - adv
    );
  };

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    try {
      const recordsPayload = data.records.map((r) => {
        const units = getStaffWorkUnits(r);
        const otH = getStaffOvertimeHours(r);
        const otP = getStaffOvertimePay(r);
        const baseEarned = getStaffBaseSalary(r);
        const adj = adjustments[r.staffId] || { allowances: r.customBonus || 0, deductions: r.deductions || 0 };
        const net = getStaffNetSalary(r);

        return {
          staffId: r.staffId,
          salaryType: r.salaryType,
          baseRate: r.baseSalary,
          workUnits: units,
          baseSalaryEarned: baseEarned,
          isProrated: r.isProrated,
          prorateNote: r.prorateNote,
          overtimeHours: otH,
          overtimeRate: r.overtimeRate,
          overtimePay: otP,
          commissionCount: r.commissionCount,
          totalCommissions: r.totalCommissions,
          allowanceMeal: r.allowanceMeal,
          allowanceTransport: r.allowanceTransport,
          allowanceOther: r.allowanceOther,
          customBonus: adj.allowances,
          deductions: adj.deductions,
          takeHomePay: net,
        };
      });

      await savePayrollSnapshotAction({
        periodMonth: data.selectedMonth,
        cutoffStartDate: data.cutoffStartDate || new Date().toISOString(),
        cutoffEndDate: data.cutoffEndDate || new Date().toISOString(),
        records: recordsPayload,
      });

      toastSuccess("Perubahan data kehadiran, lembur, dan penyesuaian gaji berhasil disimpan!");
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan data penggajian.");
    } finally {
      setSavingSnapshot(false);
    }
  };

  const handleToggleLock = async () => {
    setLockingPeriod(true);
    try {
      const newLockedState = !(data as any).isPeriodLocked;
      await toggleLockPayrollPeriodAction({
        periodMonth: data.selectedMonth,
        isLocked: newLockedState,
      });

      toastSuccess(
        newLockedState
          ? "Penggajian periode ini berhasil DIKUNCI (FINAL)."
          : "Penggajian periode ini telah dibuka kembali untuk penyesuaian."
      );
      await fetchPayroll(month, outletId);
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status kunci periode.");
    } finally {
      setLockingPeriod(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // ── Export Excel ─────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const exportRows = data.records.map((r) => ({
      name: r.name,
      position: r.position,
      outletName: r.outletName,
      salaryType: r.salaryType,
      baseSalaryEarned: getStaffBaseSalary(r),
      overtimePay: getStaffOvertimePay(r),
      totalCommissions: r.totalCommissions,
      totalFixedAllowances: r.totalFixedAllowances || 0,
      customBonus: adjustments[r.staffId]?.allowances || 0,
      deductions: adjustments[r.staffId]?.deductions || 0,
      advanceDeduction: getStaffAdvanceDeduction(r),
      takeHomePay: getStaffNetSalary(r),
      isProrated: r.isProrated,
      prorateNote: r.prorateNote,
    }));
    exportPayrollToExcel(exportRows, data.periodLabel, data.businessName, data.selectedMonth);
    toastSuccess("File Excel rekap gaji berhasil diunduh!");
  };

  // ── Broadcast WhatsApp ke semua karyawan ─────────────────────────────────
  const handleBroadcastAll = async () => {
    const eligible = data.records.filter((r) => r.phone);
    if (eligible.length === 0) {
      toastError("Tidak ada karyawan dengan nomor WhatsApp yang terdaftar.");
      return;
    }

    const confirmed = window.confirm(
      `Kirim slip gaji ke ${eligible.length} karyawan via WhatsApp?\nBrowser akan membuka ${eligible.length} tab secara berurutan dengan jeda 900ms.\n\nLanjutkan?`
    );
    if (!confirmed) return;

    setBroadcastingWA(true);
    setBroadcastProgress({ current: 0, total: eligible.length });

    for (let i = 0; i < eligible.length; i++) {
      setBroadcastProgress({ current: i + 1, total: eligible.length });
      handleSendWhatsApp(eligible[i]);
      if (i < eligible.length - 1) {
        await new Promise((res) => setTimeout(res, 900));
      }
    }

    setBroadcastingWA(false);
    setBroadcastProgress(null);
    toastSuccess(`Slip gaji telah dikirim ke ${eligible.length} karyawan!`);
  };

  // ── Fetch History ─────────────────────────────────────────────────────────
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await getPayrollHistoryAction();
      setHistoryData(result);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat riwayat penggajian.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSwitchTab = (tab: "PAYROLL" | "ADVANCES" | "HISTORY") => {
    setActiveTab(tab);
    if (tab === "HISTORY" && historyData.length === 0) {
      fetchHistory();
    }
    if (tab === "ADVANCES" && !advanceData) {
      fetchAdvances();
    }
  };

  const handleUnlockHistory = async (periodMonth: string) => {
    const confirmed = window.confirm(
      `Buka kunci periode ${periodMonth} untuk koreksi?\nData gaji periode ini akan kembali ke status DRAFT dan bisa diedit kembali.`
    );
    if (!confirmed) return;

    setUnlockingPeriod(periodMonth);
    try {
      await unlockPayrollPeriodAction(periodMonth);
      toastSuccess(`Periode ${periodMonth} berhasil dibuka kembali (DRAFT).`);
      await fetchHistory();
    } catch (err: any) {
      toastError(err.message || "Gagal membuka kunci periode.");
    } finally {
      setUnlockingPeriod(null);
    }
  };

  const handleSendWhatsApp = (record: PayrollStaffRecord) => {
    if (!record.phone) {
      toastError("Nomor WhatsApp karyawan belum terdaftar.");
      return;
    }

    const netSalary = getStaffNetSalary(record);
    const baseSalaryEarned = getStaffBaseSalary(record);
    const otPay = getStaffOvertimePay(record);
    const otHours = getStaffOvertimeHours(record);
    const units = getStaffWorkUnits(record);
    const adj = adjustments[record.staffId] || { allowances: 0, deductions: 0 };

    let baseSalaryText = "";
    if (record.salaryType === "DAILY") {
      baseSalaryText = `+ Gaji Pokok (${units} Hari @ Rp ${record.baseSalary.toLocaleString("id-ID")}): Rp ${baseSalaryEarned.toLocaleString("id-ID")}\n`;
    } else if (record.salaryType === "PER_SHIFT") {
      baseSalaryText = `+ Gaji Pokok (${units} Shift @ Rp ${record.baseSalary.toLocaleString("id-ID")}): Rp ${baseSalaryEarned.toLocaleString("id-ID")}\n`;
    } else if (record.salaryType === "COMMISSION_ONLY") {
      baseSalaryText = `+ Gaji Pokok: Bagi Hasil Murni (Rp 0)\n`;
    } else if (record.isProrated) {
      const joinStr = record.joinDate ? new Date(record.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-";
      baseSalaryText = `+ Gaji Pokok (Prorata ${units}/26 Hari, Masuk ${joinStr}): Rp ${baseSalaryEarned.toLocaleString("id-ID")}\n`;
    } else {
      baseSalaryText = `+ Gaji Pokok: Rp ${record.baseSalary.toLocaleString("id-ID")}\n`;
    }

    let overtimeText = "";
    if (otPay > 0) {
      overtimeText = `+ Uang Lembur (${otHours} Jam @ Rp ${record.overtimeRate.toLocaleString("id-ID")}/jam): Rp ${otPay.toLocaleString("id-ID")}\n`;
    }

    let commissionText = "";
    if (record.totalCommissions > 0) {
      commissionText = `+ Bagi Hasil / Komisi POS (${record.commissionCount} Trx): Rp ${record.totalCommissions.toLocaleString("id-ID")}\n`;
    }

    let allowanceLines = "";
    if (record.allowanceMeal > 0) {
      allowanceLines += `+ Uang Makan: Rp ${record.allowanceMeal.toLocaleString("id-ID")}\n`;
    }
    if (record.allowanceTransport > 0) {
      allowanceLines += `+ Uang Transport: Rp ${record.allowanceTransport.toLocaleString("id-ID")}\n`;
    }
    if (record.allowanceOther > 0) {
      allowanceLines += `+ Tunjangan Jabatan/Lain: Rp ${record.allowanceOther.toLocaleString("id-ID")}\n`;
    }
    if (adj.allowances > 0) {
      allowanceLines += `+ Bonus/Tunjangan Tambahan: Rp ${adj.allowances.toLocaleString("id-ID")}\n`;
    }

    const advDeduction = getStaffAdvanceDeduction(record);
    let deductionLines = "";
    if (adj.deductions > 0) {
      deductionLines += `- Potongan / Denda: Rp ${adj.deductions.toLocaleString("id-ID")}\n`;
    }
    if (advDeduction > 0) {
      deductionLines += `- Potongan Cicilan Kasbon: Rp ${advDeduction.toLocaleString("id-ID")}\n`;
    }

    const message = `*SLIP GAJI RESMI - ${data.businessName.toUpperCase()}*
Periode: ${data.periodLabel}
----------------------------------------
Nama: *${record.name}*
Posisi: ${record.position} (${record.outletName})
Skema: ${record.salaryType === "DAILY" ? "Harian" : record.salaryType === "PER_SHIFT" ? "Per Shift" : record.salaryType === "COMMISSION_ONLY" ? "Bagi Hasil Murni" : "Bulanan Tetap"}

*A. RINCIAN PENDAPATAN (EARNINGS):*
${baseSalaryText}${overtimeText}${commissionText}${allowanceLines}
${deductionLines ? `*B. POTONGAN (DEDUCTIONS):*\n${deductionLines}` : ""}----------------------------------------
*TOTAL DITERIMA (Take Home Pay):*
👉 *Rp ${netSalary.toLocaleString("id-ID")}*

Terima kasih atas dedikasi dan kerja keras Anda! 🙏`;

    const cleanedPhone = record.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanedPhone.startsWith("0") ? `62${cleanedPhone.slice(1)}` : cleanedPhone;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span>Penggajian Karyawan &amp; Komisi (Payroll)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi gaji pokok, komisi transaksi POS, tunjangan, dan cetak slip gaji digital.
          </p>
        </div>

        {/* Date / Month Picker */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={handleMonthChange}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <Store className="w-4 h-4 text-slate-400" />
            <select
              value={outletId}
              onChange={handleOutletChange}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Cabang</option>
              {data.outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher: Payroll Aktif / Kasbon / Riwayat Gaji ────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleSwitchTab("PAYROLL")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "PAYROLL"
              ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Penggajian Aktif
        </button>
        <button
          type="button"
          onClick={() => handleSwitchTab("ADVANCES")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "ADVANCES"
              ? "bg-white dark:bg-slate-800 text-amber-600 shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          Kasbon Karyawan
        </button>
        <button
          type="button"
          onClick={() => handleSwitchTab("HISTORY")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "HISTORY"
              ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Riwayat Gaji
        </button>
      </div>

      {/* ── HISTORY TAB PANEL ─────────────────────────────────────────────── */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Riwayat Penggajian Tersimpan
            </h2>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
            >
              {historyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-sm font-semibold">Memuat riwayat...</span>
            </div>
          ) : historyData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Belum ada periode gaji yang tersimpan.<br />
              <span className="text-xs">Simpan data penggajian dari tab &ldquo;Penggajian Aktif&rdquo; terlebih dahulu.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {historyData.map((h: any) => (
                <div
                  key={h.periodMonth}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode</p>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {new Date(h.periodMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    {h.isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                        <Lock className="w-3 h-3" /> FINAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <FileText className="w-3 h-3" /> DRAFT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5">
                      <p className="text-slate-400 font-medium">Karyawan</p>
                      <p className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{h.totalStaff} Orang</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2.5">
                      <p className="text-emerald-600 font-medium">Total Gaji</p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-black text-sm mt-0.5">
                        Rp {h.totalTakeHomePay.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {h.lockedAt && (
                    <p className="text-[10px] text-slate-400 italic">
                      Dikunci: {new Date(h.lockedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMonth(h.periodMonth);
                        handleSwitchTab("PAYROLL");
                        fetchPayroll(h.periodMonth, outletId);
                      }}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Lihat Detail
                    </button>
                    {h.isLocked && (
                      <button
                        type="button"
                        disabled={unlockingPeriod === h.periodMonth}
                        onClick={() => handleUnlockHistory(h.periodMonth)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {unlockingPeriod === h.periodMonth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                        Buka Kunci
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KASBON KARYAWAN TAB PANEL ────────────────────────────────────── */}
      {activeTab === "ADVANCES" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header & Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                Manajemen Kasbon &amp; Pinjaman Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola pinjaman staf, skema cicilan, pelunasan manual, dan auto-deduct slip gaji bulanan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAdvances}
                disabled={advanceLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                {advanceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowAddAdvanceModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Kasbon Baru</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metrics for Kasbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Sisa Kasbon Berjalan
              </span>
              <p className="text-2xl font-black text-amber-600 font-mono">
                Rp {(advanceData?.metrics?.totalActiveAdvance || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Pinjaman yang belum lunas</p>
            </div>

            <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Karyawan Berkasbon
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {advanceData?.metrics?.activeStaffCount || 0}{" "}
                <span className="text-xs text-slate-400 font-semibold">Orang</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Memiliki tanggungan aktif</p>
            </div>

            <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Kasbon Terlunasi
              </span>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                Rp {(advanceData?.metrics?.totalPaidOffAdvance || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Sudah lunas terpotong/dibayar</p>
            </div>

            <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Riwayat Kasbon
              </span>
              <p className="text-2xl font-black text-indigo-600">
                {advanceData?.metrics?.totalTransactionsCount || 0}{" "}
                <span className="text-xs text-slate-400 font-semibold">Transaksi</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Semua catatan pinjaman</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={advanceSearchQuery}
                onChange={(e) => setAdvanceSearchQuery(e.target.value)}
                placeholder="Cari nama karyawan berkasbon..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {["ALL", "ACTIVE", "PAID_OFF"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAdvanceFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      advanceFilterStatus === st
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {st === "ALL" ? "Semua" : st === "ACTIVE" ? "Aktif Berjalan" : "Lunas"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advances Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {advanceLoading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                <p className="text-xs font-semibold">Memuat daftar kasbon...</p>
              </div>
            ) : !advanceData || advanceData.advances.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium text-sm">
                Belum ada data kasbon karyawan tercatat.<br />
                <span className="text-xs">Klik tombol &ldquo;+ Catat Kasbon Baru&rdquo; untuk menambahkan pinjaman.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Karyawan &amp; Cabang</th>
                      <th className="py-3.5 px-4">Tgl Pengajuan</th>
                      <th className="py-3.5 px-4 text-right">Total Pinjaman</th>
                      <th className="py-3.5 px-4 text-right font-black text-amber-600">Sisa Kasbon</th>
                      <th className="py-3.5 px-4">Skema Potongan</th>
                      <th className="py-3.5 px-4">Catatan / Keperluan</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {advanceData.advances
                      .filter((a: StaffAdvanceItem) => {
                        if (advanceFilterStatus !== "ALL" && a.status !== advanceFilterStatus) {
                          return false;
                        }
                        if (advanceSearchQuery.trim()) {
                          const q = advanceSearchQuery.toLowerCase();
                          return (
                            a.staffName.toLowerCase().includes(q) ||
                            a.staffPosition.toLowerCase().includes(q) ||
                            (a.note && a.note.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((adv: StaffAdvanceItem) => (
                        <tr key={adv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{adv.staffName}</div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Store className="w-3 h-3" />
                              {adv.outletName} &bull; {adv.staffPosition}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(adv.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-800 dark:text-slate-200">
                            Rp {adv.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-right text-amber-600 text-sm">
                            Rp {adv.remainingAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {adv.installmentMonthly ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold font-mono">
                                🗓️ Rp {adv.installmentMonthly.toLocaleString("id-ID")}/bln
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold">
                                ⚡ Potong Sekaligus
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={adv.note || ""}>
                            {adv.note || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {adv.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                                🟢 AKTIF
                              </span>
                            ) : adv.status === "PAID_OFF" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                ✓ LUNAS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                                {adv.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {adv.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAdvanceForRepay(adv);
                                    setManualRepayAmount(adv.remainingAmount);
                                    setShowRepayModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Catat Pembayaran / Pelunasan Kasbon Manual"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Bayar Manual</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAdvance(adv.id)}
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title="Hapus Catatan Kasbon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYROLL AKTIF (kondisional hanya tampil di tab PAYROLL) ──────── */}
      {activeTab === "PAYROLL" && (
      <>

      {/* Cut-off Info & Payday Cycle Configuration Banner (Fully Theme Responsive) */}

      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl border shadow-xs animate-fadeIn"
        style={{
          backgroundColor: "var(--theme-inner-bg, rgba(99, 102, 241, 0.08))",
          borderColor: "var(--theme-card-border, rgba(99, 102, 241, 0.2))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0"
            style={{
              backgroundColor: "var(--theme-primary, #4f46e5)",
            }}
          >
            📅
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-black text-xs sm:text-sm"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                Periode Cut-Off: {data.periodLabel}
              </span>
              <span
                className="px-2 py-0.5 rounded-md font-extrabold text-[10px]"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "var(--theme-primary, #6366f1)",
                  border: "1px solid var(--theme-card-border, rgba(99, 102, 241, 0.3))",
                }}
              >
                {cutoffDay === 1 ? "1 - 31 Kalender" : `Tgl ${cutoffDay} - ${cutoffDay - 1}`}
              </span>
            </div>
            <p
              className="text-[11px] font-medium mt-0.5"
              style={{ color: "var(--theme-text-secondary, #64748b)" }}
            >
              Komisi kasir POS &amp; rekap lembur ditarik otomatis sesuai rentang cut-off toko.
            </p>
          </div>
        </div>

        {/* Tanggal Gajian Dropdown Selector */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/40 dark:border-slate-800">
          <span
            className="text-[11px] font-bold whitespace-nowrap"
            style={{ color: "var(--theme-text-secondary, #64748b)" }}
          >
            Tanggal Gajian:
          </span>
          <div className="relative">
            <select
              value={cutoffDay}
              disabled={savingCutoff}
              onChange={(e) => handleCutoffChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer focus:outline-none shadow-xs border transition"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                color: "var(--theme-text-primary, #0f172a)",
              }}
            >
              <option value={25}>Tgl 25 (Cut-off 25 bln lalu - 24 bln ini)</option>
              <option value={1}>Tgl 1 / Akhir Bulan (1 - 31 bln berjalan)</option>
              <option value={20}>Tgl 20 (Cut-off 20 bln lalu - 19 bln ini)</option>
              <option value={27}>Tgl 27 (Cut-off 27 bln lalu - 26 bln ini)</option>
              <option value={28}>Tgl 28 (Cut-off 28 bln lalu - 27 bln ini)</option>
              <option value={5}>Tgl 5 (Cut-off 5 bln lalu - 4 bln ini)</option>
              <option value={10}>Tgl 10 (Cut-off 10 bln lalu - 9 bln ini)</option>
              <option value={15}>Tgl 15 (Cut-off 15 bln lalu - 14 bln ini)</option>
            </select>
            {savingCutoff && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Pengeluaran Gaji
          </span>
          <p className="text-2xl font-black text-emerald-600">
            Rp {data.summary.totalPayrollExpenditure.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Periode {data.periodLabel}</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Gaji Pokok
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Rp {data.summary.totalBaseSalarySum.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Gaji tetap seluruh karyawan</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Bagi Hasil &amp; Komisi POS
          </span>
          <p className="text-2xl font-black text-indigo-600">
            Rp {data.summary.totalCommissionsSum.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Bagi hasil transaksi kasir aktif</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Karyawan Menerima Gaji
          </span>
          <p className="text-2xl font-black text-purple-600">
            {data.summary.totalStaffCount}{" "}
            <span className="text-xs text-slate-400 font-semibold">Orang</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Di seluruh outlet aktif</p>
        </div>
      </div>

      {/* Search Bar & Action Buttons (Simpan Draft / Kunci Periode) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama karyawan, jabatan..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Status Kunci Badge */}
          <div className="flex items-center gap-1.5">
            {(data as any).isPeriodLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800">
                <Lock className="w-3.5 h-3.5" />
                <span>Terkunci (Final)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Draft Aktif</span>
              </span>
            )}
          </div>

          {/* Tombol Simpan Perubahan */}
          <button
            type="button"
            disabled={savingSnapshot || (data as any).isPeriodLocked}
            onClick={handleSaveSnapshot}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {savingSnapshot ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Simpan</span>
          </button>

          {/* Tombol Kunci / Buka Kunci */}
          <button
            type="button"
            disabled={lockingPeriod}
            onClick={handleToggleLock}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              (data as any).isPeriodLocked
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                : "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
            }`}
          >
            {lockingPeriod ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (data as any).isPeriodLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Kunci</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci</span>
              </>
            )}
          </button>

          {/* Tombol Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={data.records.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download rekap gaji periode ini ke Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* Tombol Kirim Semua WhatsApp */}
          <button
            type="button"
            onClick={handleBroadcastAll}
            disabled={broadcastingWA || data.records.filter((r) => r.phone).length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={`Kirim slip gaji ke ${data.records.filter((r) => r.phone).length} karyawan via WhatsApp`}
          >
            {broadcastingWA ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{broadcastProgress ? `${broadcastProgress.current}/${broadcastProgress.total}` : "..."}</span>
              </>
            ) : (
              <>
                <SendHorizonal className="w-3.5 h-3.5" />
                <span>Kirim Semua WA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Memuat rincian penggajian...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Nama &amp; Cabang</th>
                  <th className="py-3.5 px-4">Posisi &amp; Skema</th>
                  <th className="py-3.5 px-4">Gaji Pokok (Kehadiran)</th>
                  <th className="py-3.5 px-4">Uang Lembur (Jam)</th>
                  <th className="py-3.5 px-4">Bagi Hasil &amp; Komisi</th>
                  <th className="py-3.5 px-4">Tunjangan Tetap</th>
                  <th className="py-3.5 px-4">Bonus / Penyesuaian (Rp)</th>
                  <th className="py-3.5 px-4 font-black text-rose-600">Potongan Kasbon (-)</th>
                  <th className="py-3.5 px-4 font-black text-emerald-600">Total Gaji Bersih</th>
                  <th className="py-3.5 px-4 text-right">Aksi Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data staf pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const adj = adjustments[rec.staffId] || { allowances: 0, deductions: 0 };
                    const netSalary = getStaffNetSalary(rec);
                    const baseSalaryEarned = getStaffBaseSalary(rec);
                    const otPay = getStaffOvertimePay(rec);
                    const otHours = getStaffOvertimeHours(rec);
                    const units = getStaffWorkUnits(rec);

                    return (
                      <tr
                        key={rec.staffId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                      >
                        {/* 1. Name & Branch */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {rec.name}
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3" />
                            {rec.outletName}
                          </span>
                        </td>

                        {/* 2. Position & Salary Scheme */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 block w-fit">
                            {rec.position}
                          </span>
                          <span className="text-[9.5px] text-slate-400 mt-1 block">
                            {rec.salaryType === "DAILY"
                              ? "🗓️ Harian"
                              : rec.salaryType === "PER_SHIFT"
                              ? "⏱️ Per Shift"
                              : rec.salaryType === "COMMISSION_ONLY"
                              ? "✂️ Bagi Hasil"
                              : "🏢 Bulanan Tetap"}
                          </span>
                        </td>

                        {/* 3. Base Salary & Dynamic Attendance */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {rec.salaryType === "DAILY" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={(data as any).isPeriodLocked}
                                  value={units}
                                  onChange={(e) =>
                                    handleWorkUnitChange(rec.staffId, Number(e.target.value) || 0)
                                  }
                                  className="w-12 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">Hari Masuk</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                @ Rp {rec.baseSalary.toLocaleString("id-ID")} ={" "}
                                <strong className="text-slate-900 dark:text-white">
                                  Rp {baseSalaryEarned.toLocaleString("id-ID")}
                                </strong>
                              </div>
                            </div>
                          ) : rec.salaryType === "PER_SHIFT" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={(data as any).isPeriodLocked}
                                  value={units}
                                  onChange={(e) =>
                                    handleWorkUnitChange(rec.staffId, Number(e.target.value) || 0)
                                  }
                                  className="w-12 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">Shift Kerja</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                @ Rp {rec.baseSalary.toLocaleString("id-ID")} ={" "}
                                <strong className="text-slate-900 dark:text-white">
                                  Rp {baseSalaryEarned.toLocaleString("id-ID")}
                                </strong>
                              </div>
                            </div>
                          ) : rec.salaryType === "COMMISSION_ONLY" ? (
                            <span className="text-indigo-600 font-bold text-[11px] font-sans">
                              Bagi Hasil Murni
                            </span>
                          ) : rec.isProrated && rec.salaryType === "MONTHLY" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold text-[9.5px] font-sans">
                                🌱 Prorata Karyawan Baru
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="26"
                                  disabled={(data as any).isPeriodLocked}
                                  value={units}
                                  onChange={(e) =>
                                    handleWorkUnitChange(rec.staffId, Number(e.target.value) || 0)
                                  }
                                  className="w-12 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">/ 26 Hari</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                ({units}/26) &times; Rp {rec.baseSalary.toLocaleString("id-ID")} ={" "}
                                <strong className="text-slate-900 dark:text-white">
                                  Rp {baseSalaryEarned.toLocaleString("id-ID")}
                                </strong>
                              </div>
                              {rec.prorateNote && (
                                <span className="text-[9px] text-slate-400 font-sans block italic">
                                  {rec.prorateNote}
                                </span>
                              )}
                            </div>
                          ) : rec.baseSalary > 0 ? (
                            <div className="font-bold text-slate-900 dark:text-white">
                              Rp {rec.baseSalary.toLocaleString("id-ID")}
                              <span className="text-[9.5px] text-slate-400 font-normal block font-sans">
                                (Bulanan Tetap)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-sans">-</span>
                          )}
                        </td>

                        {/* 4. Overtime Input & Calculation */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {rec.overtimeRate > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={(data as any).isPeriodLocked}
                                  value={otHours || ""}
                                  onChange={(e) =>
                                    handleOvertimeHoursChange(rec.staffId, Number(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="w-12 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-center"
                                />
                                <span className="text-[10px] text-slate-400 font-sans">Jam</span>
                              </div>
                              {otPay > 0 ? (
                                <div className="text-[10.5px] font-bold text-amber-600">
                                  + Rp {otPay.toLocaleString("id-ID")}
                                </div>
                              ) : (
                                <div className="text-[9.5px] text-slate-400">
                                  @ Rp {rec.overtimeRate.toLocaleString("id-ID")}/jam
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10.5px] italic font-sans">-</span>
                          )}
                        </td>

                        {/* 5. POS Bagi Hasil & Commissions */}
                        <td className="py-3.5 px-4 font-mono">
                          {rec.totalCommissions > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDetailStaff(rec)}
                              className="text-left group cursor-pointer focus:outline-none"
                              title="Klik untuk melihat rincian transaksi bagi hasil"
                            >
                              <span className="font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                                + Rp {rec.totalCommissions.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[10px] text-indigo-500 font-semibold group-hover:underline flex items-center gap-0.5 mt-0.5 font-sans">
                                ({rec.commissionCount} trx) &bull; Rincian &rarr;
                              </span>
                            </button>
                          ) : rec.isCommissionActive ? (
                            <span className="text-slate-400 text-[11px] italic">Rp 0</span>
                          ) : (
                            <span className="text-[9.5px] text-slate-400 font-sans">Pure Gaji</span>
                          )}
                        </td>

                        {/* 6. Fixed Allowances */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {rec.totalFixedAllowances > 0 ? (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                + Rp {rec.totalFixedAllowances.toLocaleString("id-ID")}
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-sans mt-0.5 space-y-0.5">
                                {rec.allowanceMeal > 0 && <div>Makan: Rp {rec.allowanceMeal.toLocaleString("id-ID")}</div>}
                                {rec.allowanceTransport > 0 && <div>Transport: Rp {rec.allowanceTransport.toLocaleString("id-ID")}</div>}
                                {rec.allowanceOther > 0 && <div>Jabatan: Rp {rec.allowanceOther.toLocaleString("id-ID")}</div>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-sans">-</span>
                          )}
                        </td>

                        {/* 7. Bonus & Penyesuaian Input */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-emerald-600 font-bold w-3.5">+</span>
                              <input
                                type="number"
                                min="0"
                                value={adj.allowances || ""}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    rec.staffId,
                                    "allowances",
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="Bonus (Rp)"
                                className="w-24 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-rose-600 font-bold w-3.5">-</span>
                              <input
                                type="number"
                                min="0"
                                value={adj.deductions || ""}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    rec.staffId,
                                    "deductions",
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="Denda (Rp)"
                                className="w-24 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                            </div>
                          </div>
                        </td>

                        {/* 8. Potongan Kasbon Auto-Deduct */}
                        <td className="py-3.5 px-4 font-mono">
                          {rec.activeAdvanceTotal > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-rose-600 font-bold">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={rec.activeAdvanceTotal}
                                  disabled={(data as any).isPeriodLocked}
                                  value={getStaffAdvanceDeduction(rec) || ""}
                                  onChange={(e) =>
                                    handleAdvanceDeductionChange(
                                      rec.staffId,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  placeholder="0"
                                  className="w-24 px-2 py-0.5 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-xs font-mono font-bold text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-sans">
                                Sisa Kasbon:{" "}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  Rp {rec.activeAdvanceTotal.toLocaleString("id-ID")}
                                </strong>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-sans">-</span>
                          )}
                        </td>

                        {/* 9. Take Home Pay */}
                        <td className="py-3.5 px-4 font-mono font-black text-sm text-emerald-600">
                          Rp {netSalary.toLocaleString("id-ID")}
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSlipStaff(rec)}
                              className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Lihat &amp; Cetak Slip Gaji"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Slip Gaji</span>
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(rec)}
                              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                              title="Kirim ke WhatsApp Karyawan"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cetak Slip Gaji Digital Lengkap */}
      {selectedSlipStaff && (() => {
        const staffBaseSalary = getStaffBaseSalary(selectedSlipStaff);
        const staffOtPay = getStaffOvertimePay(selectedSlipStaff);
        const staffOtHours = getStaffOvertimeHours(selectedSlipStaff);
        const staffUnits = getStaffWorkUnits(selectedSlipStaff);
        const staffNet = getStaffNetSalary(selectedSlipStaff);
        const adj = adjustments[selectedSlipStaff.staffId] || { allowances: 0, deductions: 0 };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Slip Gaji Resmi Karyawan
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlipStaff(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slip Paper Preview */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 space-y-4 font-mono text-xs shadow-inner">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="text-base font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                    {data.businessName}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">SLIP GAJI RESMI KARYAWAN</p>
                  <p className="text-[10.5px] text-indigo-600 font-bold mt-0.5">
                    Periode: {data.periodLabel}
                  </p>
                </div>

                {/* Staff Details */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Nama Karyawan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedSlipStaff.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Jabatan / Posisi:</span>
                    <span className="font-bold">{selectedSlipStaff.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Cabang Penempatan:</span>
                    <span>{selectedSlipStaff.outletName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Skema Gaji:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">
                      {selectedSlipStaff.salaryType === "DAILY"
                        ? "Harian (Daily Rate)"
                        : selectedSlipStaff.salaryType === "PER_SHIFT"
                        ? "Per Shift Kerja"
                        : selectedSlipStaff.salaryType === "COMMISSION_ONLY"
                        ? "Bagi Hasil Murni"
                        : "Bulanan Tetap"}
                    </span>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-sans block">
                    A. Rincian Pendapatan (Earnings):
                  </span>
                  
                  {/* Gaji Pokok Detail */}
                  <div className="flex justify-between">
                    <span>
                      Gaji Pokok{" "}
                      {selectedSlipStaff.salaryType === "DAILY"
                        ? `(${staffUnits} Hari @ Rp ${selectedSlipStaff.baseSalary.toLocaleString("id-ID")})`
                        : selectedSlipStaff.salaryType === "PER_SHIFT"
                        ? `(${staffUnits} Shift @ Rp ${selectedSlipStaff.baseSalary.toLocaleString("id-ID")})`
                        : selectedSlipStaff.salaryType === "COMMISSION_ONLY"
                        ? "(Bagi Hasil Murni)"
                        : selectedSlipStaff.isProrated
                        ? `(Prorata ${staffUnits}/26 Hari - Masuk ${selectedSlipStaff.joinDate ? new Date(selectedSlipStaff.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"})`
                        : "(Bulanan Tetap)"}
                      :
                    </span>
                    <span className="font-bold">Rp {staffBaseSalary.toLocaleString("id-ID")}</span>
                  </div>

                  {/* Lembur Detail */}
                  {staffOtPay > 0 ? (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Uang Lembur ({staffOtHours} Jam @ Rp {selectedSlipStaff.overtimeRate.toLocaleString("id-ID")}/jam):</span>
                      <span>+ Rp {staffOtPay.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}

                  {/* Bagi Hasil / Komisi Detail */}
                  {selectedSlipStaff.totalCommissions > 0 ? (
                    <div className="flex justify-between text-indigo-600 font-bold">
                      <span>Bagi Hasil / Komisi POS ({selectedSlipStaff.commissionCount} Transaksi):</span>
                      <span>+ Rp {selectedSlipStaff.totalCommissions.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}

                  {/* Tunjangan Makan */}
                  {selectedSlipStaff.allowanceMeal > 0 ? (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Tunjangan Uang Makan:</span>
                      <span>+ Rp {selectedSlipStaff.allowanceMeal.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}

                  {/* Tunjangan Transport */}
                  {selectedSlipStaff.allowanceTransport > 0 ? (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Tunjangan Transportasi:</span>
                      <span>+ Rp {selectedSlipStaff.allowanceTransport.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}

                  {/* Tunjangan Lain */}
                  {selectedSlipStaff.allowanceOther > 0 ? (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Tunjangan Jabatan / Keahlian:</span>
                      <span>+ Rp {selectedSlipStaff.allowanceOther.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}

                  {/* Bonus Ad-hoc */}
                  {adj.allowances ? (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Bonus / Tunjangan Tambahan:</span>
                      <span>+ Rp {adj.allowances.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}
                </div>

                {/* Deductions Breakdown */}
                {(adj.deductions > 0 || getStaffAdvanceDeduction(selectedSlipStaff) > 0) ? (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase text-rose-500 font-sans block">
                      B. Potongan (Deductions):
                    </span>
                    {adj.deductions > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Potongan / Denda / Keterlambatan:</span>
                        <span>- Rp {adj.deductions.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {getStaffAdvanceDeduction(selectedSlipStaff) > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Potongan Cicilan Kasbon Karyawan:</span>
                        <span>- Rp {getStaffAdvanceDeduction(selectedSlipStaff).toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {selectedSlipStaff.activeAdvanceTotal > 0 && (
                      <div className="text-[9.5px] text-slate-400 font-sans italic">
                        * Sisa pinjaman kasbon setelah periode ini: Rp {Math.max(0, selectedSlipStaff.activeAdvanceTotal - getStaffAdvanceDeduction(selectedSlipStaff)).toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Total Take Home Pay */}
                <div className="border-t-2 border-slate-900 dark:border-white pt-3 flex justify-between items-baseline font-sans">
                  <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                    TOTAL GAJI BERSIH (TAKE HOME PAY):
                  </span>
                  <span className="text-base font-black font-mono text-emerald-600">
                    Rp {staffNet.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(selectedSlipStaff)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Popup Rincian Transaksi Bagi Hasil / Komisi Staf */}
      {selectedDetailStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Percent className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Rincian Transaksi Bagi Hasil &amp; Komisi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Staf: <strong className="text-slate-800 dark:text-slate-200">{selectedDetailStaff.name}</strong> ({selectedDetailStaff.position}) &bull; Periode: {data.periodLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Summary Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                  Total Akumulasi Bagi Hasil Periode Ini
                </span>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                  Rp {selectedDetailStaff.totalCommissions.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs shadow-xs border border-indigo-100 dark:border-slate-700">
                {selectedDetailStaff.commissionCount} Transaksi
              </span>
            </div>

            {/* Table of Orders */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex-1 overflow-y-auto min-h-[200px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">No. Nota Kasir</th>
                    <th className="py-2.5 px-3">Layanan / Produk</th>
                    <th className="py-2.5 px-3 text-right">Nilai Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Skema Rate</th>
                    <th className="py-2.5 px-3 text-right font-black text-indigo-600">Bagi Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedDetailStaff.commissionBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                        Belum ada riwayat transaksi bagi hasil untuk staf ini pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    selectedDetailStaff.commissionBreakdown.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {item.formattedDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {item.transactionNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          <span className="text-slate-800 dark:text-slate-200 block">{item.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Qty: {item.qty}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {item.commissionType === "PERCENTAGE" ? `${item.rate}%` : `Rp ${item.rate.toLocaleString("id-ID")}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-600">
                          + Rp {item.amount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {/* ── MODAL: CATAT KASBON BARU ────────────────────────────────────────── */}
      {showAddAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  💸
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Catat Kasbon / Pinjaman Karyawan
                  </h3>
                  <p className="text-[11px] text-slate-500">Pinjaman baru akan aktif dan dipotong dari gaji</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdvanceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              {/* Pilih Karyawan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Pilih Karyawan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newAdvanceStaffId}
                  onChange={(e) => setNewAdvanceStaffId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">-- Pilih Staf Penerima Kasbon --</option>
                  {(advanceData?.staffList || data.records).map((s: any) => (
                    <option key={s.id || s.staffId} value={s.id || s.staffId}>
                      {s.name} ({s.position} &bull; {s.outlet?.name || s.outletName || "Cabang"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal Pinjaman */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nominal Kasbon (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={newAdvanceAmount}
                    onChange={(e) => setNewAdvanceAmount(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Skema Pemotongan Gaji */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Skema Pemotongan Gaji
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAdvanceScheme("FULL")}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newAdvanceScheme === "FULL"
                        ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">⚡ Potong Sekaligus</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Dipotong habis di gajian bulan berjalan</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdvanceScheme("INSTALLMENT")}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newAdvanceScheme === "INSTALLMENT"
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">🗓️ Cicilan Bulanan</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Dipotong bertahap tiap bulan</div>
                  </button>
                </div>
              </div>

              {/* Nominal Cicilan Bulanan (jika skema cicilan) */}
              {newAdvanceScheme === "INSTALLMENT" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="font-bold text-indigo-600 dark:text-indigo-400">
                    Nominal Potongan per Bulan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-indigo-400 font-mono">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="5000"
                      step="5000"
                      required
                      value={newAdvanceMonthly}
                      onChange={(e) => setNewAdvanceMonthly(e.target.value)}
                      placeholder="Contoh: 250000"
                      className="w-full pl-10 pr-3 py-2 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              )}

              {/* Catatan / Keperluan Pinjaman */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Keperluan / Catatan Kasbon
                </label>
                <textarea
                  rows={2}
                  value={newAdvanceNote}
                  onChange={(e) => setNewAdvanceNote(e.target.value)}
                  placeholder="Misal: Biaya berobat keluarga, kebutuhan mendesak..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdvanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdvance}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingAdvance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Kasbon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: BAYAR KASBON MANUAL ──────────────────────────────────────── */}
      {showRepayModal && selectedAdvanceForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  💵
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Pembayaran / Pelunasan Kasbon Manual
                  </h3>
                  <p className="text-[11px] text-slate-500">Staf membayar tunai / transfer di luar potongan gaji</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRepayModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Karyawan:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedAdvanceForRepay.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pinjaman Awal:</span>
                <span className="font-mono">Rp {selectedAdvanceForRepay.amount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Kasbon Saat Ini:</span>
                <span className="font-mono font-black text-amber-600 text-sm">
                  Rp {selectedAdvanceForRepay.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <form onSubmit={handleManualRepay} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualRepayAmount(selectedAdvanceForRepay.remainingAmount)}
                    className="text-[10.5px] text-emerald-600 hover:underline font-bold"
                  >
                    Bayar Lunas (Semua)
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    max={selectedAdvanceForRepay.remainingAmount}
                    step="1000"
                    required
                    value={manualRepayAmount}
                    onChange={(e) => setManualRepayAmount(e.target.value)}
                    placeholder="Contoh: 100000"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  value={manualRepayNote}
                  onChange={(e) => setManualRepayNote(e.target.value)}
                  placeholder="Misal: Dibayar tunai ke kasir / transfer bank"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdvance}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingAdvance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
