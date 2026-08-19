"use client";

import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/swal";
import {
  WeeklyOperatingSchedule,
  DayKey,
  DAY_LABELS,
  DEFAULT_WEEKLY_SCHEDULE,
  DEFAULT_DAY_HOURS,
} from "@/types/operating-hours";
import { updateOutletOperatingHoursAction } from "@/modules/tenant/outlet-actions";
import {
  Clock,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Sparkles,
} from "lucide-react";

interface OperatingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
  initialSchedule?: WeeklyOperatingSchedule | null;
  onSuccess?: () => void;
}

export function OperatingHoursModal({
  isOpen,
  onClose,
  outletId,
  outletName,
  initialSchedule,
  onSuccess,
}: OperatingHoursModalProps) {
  const [schedule, setSchedule] = useState<WeeklyOperatingSchedule>(
    initialSchedule || DEFAULT_WEEKLY_SCHEDULE
  );
  const [loading, setLoading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  const days: DayKey[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const handleDayChange = (day: DayKey, field: string, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // 1-Click Copy Monday's hours to all other days
  const handleCopyMondayToAll = () => {
    const mondayConfig = schedule.monday;
    const updated: any = {};
    days.forEach((d) => {
      updated[d] = { ...mondayConfig };
    });
    setSchedule(updated);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateOutletOperatingHoursAction({
        outletId,
        operatingHours: schedule,
      });
      toastSuccess("Jadwal jam operasional berhasil disimpan!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan jadwal jam operasional.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                Atur Jam Operasional Mingguan
              </h3>
              <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                Cabang: <span className="font-bold text-indigo-600">{outletName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
          <p className="text-[11px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Atur jam buka, tutup, dan status libur per hari (Senin s/d Minggu).
          </p>
          <button
            type="button"
            onClick={handleCopyMondayToAll}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/60 transition flex items-center gap-1.5"
          >
            <Copy className="w-3 h-3" />
            <span>Salin Jam Senin ke Semua Hari</span>
          </button>
        </div>

        {copiedMsg && (
          <div className="my-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            Jadwal hari Senin berhasil disalin ke semua hari.
          </div>
        )}

        {/* Form Body - 7 Days List */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {days.map((day) => {
            const config = schedule[day] || DEFAULT_DAY_HOURS;
            const label = DAY_LABELS[day];

            return (
              <div
                key={day}
                className={`p-3.5 rounded-2xl border transition ${
                  config.isOpen
                    ? "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    : "bg-red-50/30 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30 opacity-70"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Day Title & Open/Close Toggle */}
                  <div className="flex items-center gap-3 min-w-[130px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isOpen}
                        onChange={(e) =>
                          handleDayChange(day, "isOpen", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <div>
                      <span className="font-extrabold text-xs block" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                        {label}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          config.isOpen ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {config.isOpen ? "Buka" : "Libur / Tutup"}
                      </span>
                    </div>
                  </div>

                  {/* Hours Config if Open */}
                  {config.isOpen ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={config.is24Hours}
                          onChange={(e) =>
                            handleDayChange(day, "is24Hours", e.target.checked)
                          }
                          className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                          24 Jam
                        </span>
                      </label>

                      {!config.is24Hours && (
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Buka
                            </span>
                            <input
                              type="time"
                              value={config.openTime || "08:00"}
                              onChange={(e) =>
                                handleDayChange(day, "openTime", e.target.value)
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <span className="text-slate-400 font-bold mt-3">-</span>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Tutup
                            </span>
                            <input
                              type="time"
                              value={config.closeTime || "22:00"}
                              onChange={(e) =>
                                handleDayChange(day, "closeTime", e.target.value)
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-red-500 font-medium italic">
                      Tidak menerima transaksi operasional pada hari ini.
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Jadwal Jam Kerja</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
