"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Store,
  Coffee,
  Scissors,
  Shirt,
  ShoppingBag,
  X,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface OpenPosButtonProps {
  outlets?: Array<{ id: string; name: string; operatingHours?: any }>;
  activePlugins?: Array<{ code: string; name: string }>;
  currentOutletId?: string;
  className?: string;
  primaryColor?: string;
  buttonText?: string;
  variant?: "primary" | "secondary" | "minimal";
}

export function OpenPosButton({
  outlets = [],
  activePlugins = [],
  currentOutletId,
  className = "",
  primaryColor = "#4f46e5",
  buttonText = "Buka Kasir POS",
  variant = "primary",
}: OpenPosButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState(
    currentOutletId || outlets[0]?.id || ""
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // List of active business verticals from plugins
  const isCafeActive = activePlugins.some((p) => p.code === "cafe");
  const isBarberActive = activePlugins.some((p) => p.code === "barbershop");
  const isLaundryActive = activePlugins.some((p) => p.code === "laundry");
  const isRetailActive = activePlugins.some((p) => p.code === "retail") || (!isCafeActive && !isBarberActive && !isLaundryActive);

  const activeCount = [isCafeActive, isBarberActive, isLaundryActive, isRetailActive].filter(Boolean).length;
  const isMultiVertical = activeCount > 1 || outlets.length > 1;

  // Selected outlet active verticals restriction (if outlet configured specific verticals)
  const currentSelectedOutlet = outlets.find((o) => o.id === selectedOutletId);
  const outletActiveVerticals: string[] | undefined = (currentSelectedOutlet?.operatingHours as any)?.activeVerticals;

  const canShowVertical = (code: string) => {
    if (!outletActiveVerticals || outletActiveVerticals.length === 0) return true;
    return outletActiveVerticals.includes(code);
  };

  const handleButtonClick = () => {
    if (!isMultiVertical) {
      // If single vertical and single outlet, go straight to POS
      const defaultVert = isCafeActive
        ? "CAFE"
        : isBarberActive
        ? "BARBERSHOP"
        : isLaundryActive
        ? "LAUNDRY"
        : "RETAIL";
      const outletParam = selectedOutletId ? `&outletId=${selectedOutletId}` : "";
      router.push(`/pos?vertical=${defaultVert}${outletParam}`);
      return;
    }
    // Open Station Selector Modal
    setIsOpen(true);
  };

  const handleLaunchStation = (vertical: "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL") => {
    setIsOpen(false);
    const outletParam = selectedOutletId ? `&outletId=${selectedOutletId}` : "";
    router.push(`/pos?vertical=${vertical}${outletParam}`);
  };

  const modalContent = isOpen && mounted ? (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-800 mb-1.5">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Terminal Kasir Multi-Vertikal
            </span>
            <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              Pilih Stasiun Kasir yang Ingin Dibuka
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tentukan cabang dan mode kasir sesuai operasional yang ingin Anda jalankan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pilihan Cabang (Jika Lebih dari 1 Cabang) */}
        {outlets.length > 1 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              1. Pilih Cabang Operasional:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outlets.map((o) => {
                const isSelected = o.id === selectedOutletId;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOutletId(o.id)}
                    className={`p-3 rounded-2xl border text-left font-bold text-xs transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{o.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pilihan Stasiun Kerja Vertikal */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {outlets.length > 1 ? "2. " : ""}Pilih Mode Kasir &amp; Unit Bisnis:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Cafe & Resto Card */}
            {isCafeActive && canShowVertical("cafe") && (
              <button
                type="button"
                onClick={() => handleLaunchStation("CAFE")}
                className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700 transition space-y-2.5 text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Buka POS <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Kasir Kafe &amp; Restoran
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Dilengkapi denah meja makan, KOT tiket dapur, pesanan per meja &amp; open bill.
                  </p>
                </div>
              </button>
            )}

            {/* 2. Barbershop Card */}
            {isBarberActive && canShowVertical("barbershop") && (
              <button
                type="button"
                onClick={() => handleLaunchStation("BARBERSHOP")}
                className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-700 transition space-y-2.5 text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Buka POS <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Kasir Barbershop &amp; Salon
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Antrean kursi kapster, pemilihan stylist/barber, &amp; komisi jasa potong otomatis.
                  </p>
                </div>
              </button>
            )}

            {/* 3. Laundry Card */}
            {isLaundryActive && canShowVertical("laundry") && (
              <button
                type="button"
                onClick={() => handleLaunchStation("LAUNDRY")}
                className="p-4 rounded-2xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/60 dark:hover:bg-cyan-900/40 hover:border-cyan-400 dark:hover:border-cyan-700 transition space-y-2.5 text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Buka POS <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Kasir Laundry Kiloan
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Input timbangan Kg, pilihan aroma parfum wangi, nomor rak simpan &amp; nota cuci.
                  </p>
                </div>
              </button>
            )}

            {/* 4. Retail & Mart Card */}
            {isRetailActive && canShowVertical("retail") && (
              <button
                type="button"
                onClick={() => handleLaunchStation("RETAIL")}
                className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-700 transition space-y-2.5 text-left group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Buka POS <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Kasir Retail &amp; Minimart
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Auto-scan barcode barcode SKU cepat, numpad kuantiti cepat &amp; harga grosir.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className={
          className ||
          `px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer`
        }
        style={{ backgroundColor: primaryColor }}
        title="Buka Mesin Kasir POS"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>{buttonText}</span>
      </button>

      {mounted && typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
