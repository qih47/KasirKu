"use client";

import React from "react";
import { UserCheck, UserPlus, Search, Loader2, AlertCircle, Check, X } from "lucide-react";

interface CustomerCrmModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreatingCustomer: boolean;
  setIsCreatingCustomer: (creating: boolean) => void;
  customerSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  customerSearchResults: any[];
  customerSearchLoading: boolean;
  onSelectCustomer: (customer: any) => void;
  newCustomerForm: {
    name: string;
    phone: string;
    notes: string;
    address: string;
  };
  setNewCustomerForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      phone: string;
      notes: string;
      address: string;
    }>
  >;
  newCustomerLoading: boolean;
  newCustomerError: string | null;
  onCreateCustomer: (e: React.FormEvent) => Promise<void>;
  themeStyles: {
    cardBg: string;
    cardBorder: string;
    innerBoxBg: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    radius: string;
  };
}

export function CustomerCrmModal({
  isOpen,
  onClose,
  isCreatingCustomer,
  setIsCreatingCustomer,
  customerSearchQuery,
  onSearchQueryChange,
  customerSearchResults,
  customerSearchLoading,
  onSelectCustomer,
  newCustomerForm,
  setNewCustomerForm,
  newCustomerLoading,
  newCustomerError,
  onCreateCustomer,
  themeStyles,
}: CustomerCrmModalProps) {
  if (!isOpen) return null;

  const { cardBg, cardBorder, innerBoxBg, inputBg, textPrimary, textSecondary, radius } = themeStyles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 border transition-all animate-in zoom-in-95"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          color: textPrimary,
          borderRadius: radius,
        }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black" style={{ color: textPrimary }}>
                {isCreatingCustomer ? "Daftarkan Pelanggan Baru" : "Pilih Pelanggan (CRM)"}
              </h3>
              <p className="text-[11px]" style={{ color: textSecondary }}>
                {isCreatingCustomer
                  ? "Input data pelanggan baru langsung dari kasir"
                  : "Cari data pelanggan tersimpan untuk transaksi ini"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setIsCreatingCustomer(false);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 1: Search Existing Customers */}
        {!isCreatingCustomer ? (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik nama atau no WhatsApp..."
                value={customerSearchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  backgroundColor: inputBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
              />
              {customerSearchLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />
              )}
            </div>

            {/* Results List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {customerSearchResults.length > 0 ? (
                customerSearchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => onSelectCustomer(cust)}
                    className="w-full p-2.5 rounded-xl border text-left flex items-center justify-between hover:border-indigo-500 hover:bg-indigo-50/30 transition group cursor-pointer"
                    style={{
                      backgroundColor: innerBoxBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate group-hover:text-indigo-600">
                        {cust.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                        {cust.phone && <span>{cust.phone}</span>}
                        {cust.notes && <span className="italic text-amber-600 truncate max-w-[120px]">({cust.notes})</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {cust.visits || 0}x hadir
                      </span>
                    </div>
                  </button>
                ))
              ) : customerSearchQuery.trim() !== "" && !customerSearchLoading ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Pelanggan &quot;{customerSearchQuery}&quot; belum terdaftar.
                </div>
              ) : (
                <div className="text-center py-6 text-[11px] text-slate-400">
                  Ketik nama atau nomor kontak pelanggan untuk mencari.
                </div>
              )}
            </div>

            {/* Switch to Create New Customer */}
            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: cardBorder }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustomer(true);
                  setNewCustomerForm({
                    name: customerSearchQuery,
                    phone: "",
                    notes: "",
                    address: "",
                  });
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Daftarkan &quot;{customerSearchQuery || "Pelanggan Baru"}&quot;</span>
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Register New Customer Form */
          <form onSubmit={onCreateCustomer} className="space-y-3">
            {newCustomerError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{newCustomerError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                Nama Pelanggan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Nama lengkap / panggilan"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                No. WhatsApp / HP
              </label>
              <input
                type="tel"
                placeholder="08123456789"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                Catatan / Preferensi Khusus (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Alergi susu, Fade tipis, Parfum lavender"
                value={newCustomerForm.notes}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
              <button
                type="button"
                onClick={() => setIsCreatingCustomer(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-bold transition cursor-pointer"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={newCustomerLoading}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {newCustomerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Simpan &amp; Pilih</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
