"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Coffee,
  Layers,
  Sliders,
  Maximize2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toastSuccess, toastError } from "@/lib/swal";

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  areaZone?: string | null;
  status: string;
}

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableItem[];
  tenantId: string;
  businessName: string;
  outletId?: string;
  outletName?: string;
  selectedTableId?: string | null;
}

export function TableQrModal({
  isOpen,
  onClose,
  tables,
  tenantId,
  businessName,
  outletId,
  outletName,
  selectedTableId,
}: TableQrModalProps) {
  const [activeTab, setActiveTab] = useState<"SINGLE" | "BATCH">("SINGLE");
  const [selectedId, setSelectedId] = useState<string>(
    selectedTableId || tables[0]?.id || ""
  );
  const [templateSize, setTemplateSize] = useState<"ACRYLIC_A6" | "STICKER_SQUARE" | "A4_GRID">(
    "ACRYLIC_A6"
  );
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(
    tables.map((t) => t.id)
  );

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const outletParam = outletId ? `&outlet=${encodeURIComponent(outletId)}` : "";

  // Generate QR Code data URLs for all tables
  useEffect(() => {
    if (!isOpen || tables.length === 0) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const results: Record<string, string> = {};
      for (const t of tables) {
        const fullUrl = `${baseUrl}/menu/${tenantId}?table=${encodeURIComponent(t.tableNumber)}${outletParam}`;
        try {
          const dataUrl = await QRCode.toDataURL(fullUrl, {
            width: 600,
            margin: 1,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });
          results[t.id] = dataUrl;
        } catch (err) {
          console.error("QR Generate error:", err);
        }
      }
      if (isMounted) {
        setQrMap(results);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tables, tenantId, outletParam, baseUrl]);

  // Set default selected table when modal opens with specific ID
  useEffect(() => {
    if (selectedTableId) {
      setSelectedId(selectedTableId);
      setActiveTab("SINGLE");
    }
  }, [selectedTableId]);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === selectedId) || tables[0];
  const currentQr = currentTable ? qrMap[currentTable.id] : "";
  const currentTableUrl = currentTable
    ? `${baseUrl}/menu/${tenantId}?table=${encodeURIComponent(currentTable.tableNumber)}${outletParam}`
    : `${baseUrl}/menu/${tenantId}${outletParam ? `?${outletParam.slice(1)}` : ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentTableUrl);
    setCopiedLink(true);
    toastSuccess("Link menu meja berhasil disalin!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPng = (table: TableItem) => {
    const dataUrl = qrMap[table.id];
    if (!dataUrl) return;

    const safeOutlet = (outletName || "").replace(/[^a-zA-Z0-9]/g, "-");
    const link = document.createElement("a");
    link.download = `QR-Menu-${businessName.replace(/\s+/g, "-")}-${safeOutlet}-${table.tableNumber.replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
    toastSuccess(`QR Code ${table.tableNumber} (PNG) berhasil diunduh!`);
  };

  const handleDownloadSvg = async (table: TableItem) => {
    const fullUrl = `${baseUrl}/menu/${tenantId}?table=${encodeURIComponent(table.tableNumber)}${outletParam}`;
    try {
      const svgString = await QRCode.toString(fullUrl, {
        type: "svg",
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      const safeOutlet = (outletName || "").replace(/[^a-zA-Z0-9]/g, "-");
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `QR-Vector-${businessName.replace(/\s+/g, "-")}-${safeOutlet}-${table.tableNumber.replace(/\s+/g, "-")}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toastSuccess(`Vektor SVG ${table.tableNumber} (Corel/Photoshop) berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      toastError("Gagal mengunduh file SVG.");
    }
  };

  const handleBatchDownloadPng = () => {
    const selectedTables = tables.filter((t) => selectedBatchIds.includes(t.id));
    if (selectedTables.length === 0) return;

    selectedTables.forEach((t, index) => {
      setTimeout(() => {
        handleDownloadPng(t);
      }, index * 250);
    });
    toastSuccess(`Mengunduh ${selectedTables.length} file QR Code...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleBatchSelect = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllBatch = () => {
    setSelectedBatchIds(tables.map((t) => t.id));
  };

  const deselectAllBatch = () => {
    setSelectedBatchIds([]);
  };

  return (
    <>
      {/* ─── PRINT ONLY CSS (A4 Standee & Sticker Print Rules) ─── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-qr-area,
              #printable-qr-area * {
                visibility: visible;
              }
              #printable-qr-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
            }
          `,
        }}
      />

      {/* ─── MODAL BACKDROP & DIALOG (Screen UI) ─── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn no-print">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Manajemen &amp; Cetak QR Meja Digital
                </h2>
                <p className="text-[11px] text-slate-500">
                  {businessName} • Standee Meja QR Self-Order
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tab Mode Switcher */}
          <div className="px-5 pt-3 pb-0 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("SINGLE")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "SINGLE"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Preview Per Meja</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("BATCH")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "BATCH"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Semua Meja (Batch Standee)</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
            {activeTab === "SINGLE" ? (
              /* ─── TAB 1: SINGLE TABLE PREVIEW ─── */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: Interactive Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilih Meja:
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tableNumber} (Kapasitas: {t.capacity} orang)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direct Link Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Link Pemesanan Meja Langsung:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={currentTableUrl}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-300 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
                        title="Salin Link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={currentTableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                        title="Buka Menu Digital"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Saat pelanggan scan QR ini, sistem otomatis mengunci posisi order ke{" "}
                      <strong className="text-slate-800 dark:text-slate-200">{currentTable?.tableNumber}</strong>.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Standee {currentTable?.tableNumber}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => currentTable && handleDownloadPng(currentTable)}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        title="Unduh format gambar raster PNG 600px"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PNG (600px)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => currentTable && handleDownloadSvg(currentTable)}
                        className="py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        title="Format Vektor SVG Lossless untuk CorelDraw, Illustrator, Photoshop"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Vektor SVG (Corel)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Table Tent Standee Preview Card */}
                <div className="flex justify-center">
                  <div className="w-64 p-5 rounded-3xl bg-white border-2 border-slate-800 shadow-xl text-slate-900 text-center space-y-3 relative">
                    {/* Header Store */}
                    <div className="border-b-2 border-dashed border-slate-200 pb-2">
                      <div className="flex items-center justify-center gap-1.5 text-indigo-600">
                        <Coffee className="w-4 h-4" />
                        <span className="font-black text-xs tracking-wider uppercase">
                          {businessName}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {outletName || "Self-Order Digital Menu"}
                      </div>
                    </div>

                    {/* Table Number Title */}
                    <div className="py-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        NOMOR MEJA
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentTable?.tableNumber}
                      </div>
                    </div>

                    {/* QR Code Frame */}
                    <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-800 inline-block shadow-sm">
                      {currentQr ? (
                        <img
                          src={currentQr}
                          alt={currentTable?.tableNumber}
                          className="w-36 h-36 mx-auto rounded-lg"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>

                    {/* Footer Guide */}
                    <div className="space-y-0.5 pt-1">
                      <div className="text-[11px] font-black text-slate-800">
                        📱 Scan Kamera HP Anda
                      </div>
                      <div className="text-[9px] text-slate-500 leading-tight">
                        Lihat menu &amp; pesan mandiri langsung tanpa antre
                      </div>
                    </div>

                    <div className="text-[8px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      Powered by Qassa POS
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── TAB 2: BATCH ALL TABLES PRINT ─── */
              <div className="space-y-5">
                {/* Options & Template Picker */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Format Ukuran Cetak:
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setTemplateSize("ACRYLIC_A6")}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          templateSize === "ACRYLIC_A6"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Standee Akrilik Meja (A6)
                      </button>

                      <button
                        type="button"
                        onClick={() => setTemplateSize("STICKER_SQUARE")}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          templateSize === "STICKER_SQUARE"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Stiker Meja Kotak (7x7 cm)
                      </button>

                      <button
                        type="button"
                        onClick={() => setTemplateSize("A4_GRID")}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          templateSize === "A4_GRID"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Grid A4 (4 Meja per Lembar)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllBatch}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Pilih Semua ({tables.length})
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllBatch}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Checklist Meja */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Meja yang Ingin Dicetak ({selectedBatchIds.length} terpilih):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {tables.map((t) => {
                      const isSelected = selectedBatchIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBatchSelect(t.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{t.tableNumber}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Print & Download Trigger Buttons */}
                <div className="pt-2 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={selectedBatchIds.length === 0}
                      className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak {selectedBatchIds.length} Kartu Standee</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBatchDownloadPng}
                      disabled={selectedBatchIds.length === 0}
                      className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Semua QR (PNG)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-400">
                    💡 Tips: Pilih orientasi <strong>Portrait</strong> dan centang <strong>Background Graphics</strong> di dialog print browser untuk hasil cetak tajam maksimal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRINTABLE SHEET (RENDERED ONLY WHEN PRINTING) ─── */}
      <div id="printable-qr-area" className="hidden print:block p-8 bg-white text-slate-900 font-sans">
        {activeTab === "SINGLE" && currentTable ? (
          /* Single Table Print Card */
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-[320px] p-6 rounded-3xl border-4 border-slate-900 text-center space-y-4 mx-auto bg-white">
              {/* Header Store */}
              <div className="border-b-2 border-dashed border-slate-300 pb-3">
                <div className="font-black text-sm tracking-wider uppercase text-slate-900">
                  {businessName}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {outletName || "Self-Order Digital Menu"}
                </div>
              </div>

              {/* Table Number Title */}
              <div className="py-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  NOMOR MEJA
                </span>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {currentTable.tableNumber}
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="p-3 bg-white rounded-2xl border-4 border-slate-900 inline-block">
                {currentQr && (
                  <img
                    src={currentQr}
                    alt={currentTable.tableNumber}
                    className="w-48 h-48 mx-auto"
                  />
                )}
              </div>

              {/* Footer Guide */}
              <div className="space-y-1 pt-1">
                <div className="text-xs font-black text-slate-900">
                  📱 Scan Kamera HP Anda
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">
                  Lihat menu &amp; pesan mandiri langsung dari meja Anda
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-200">
                Powered by Qassa POS
              </div>
            </div>
          </div>
        ) : (
          /* Batch Tables Print Grid */
          <div
            className={
              templateSize === "A4_GRID"
                ? "grid grid-cols-2 gap-8"
                : templateSize === "STICKER_SQUARE"
                ? "grid grid-cols-3 gap-6"
                : "grid grid-cols-2 gap-10"
            }
          >
            {tables
              .filter((t) => selectedBatchIds.includes(t.id))
              .map((table, index) => {
                const qr = qrMap[table.id];

                if (templateSize === "STICKER_SQUARE") {
                  /* Sticker Format 7x7 cm */
                  return (
                    <div
                      key={table.id}
                      className="p-3 rounded-2xl border-2 border-slate-900 text-center space-y-1.5 bg-white break-inside-avoid"
                    >
                      <div className="font-black text-[10px] uppercase truncate">
                        {businessName}
                      </div>
                      <div className="text-lg font-black">{table.tableNumber}</div>
                      {qr && (
                        <img
                          src={qr}
                          alt={table.tableNumber}
                          className="w-28 h-28 mx-auto border border-slate-900 rounded-lg p-1"
                        />
                      )}
                      <div className="text-[8px] font-bold text-slate-700 leading-tight">
                        Scan untuk Pesan Meja
                      </div>
                    </div>
                  );
                }

                /* Standard Table Tent Standee Format (A6 / Grid) */
                return (
                  <div
                    key={table.id}
                    className="p-6 rounded-3xl border-4 border-slate-900 text-center space-y-3 bg-white break-inside-avoid shadow-none"
                  >
                    {/* Header Store */}
                    <div className="border-b-2 border-dashed border-slate-300 pb-2">
                      <div className="font-black text-xs tracking-wider uppercase text-slate-900">
                        {businessName}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                        {outletName || "Self-Order Digital Menu"}
                      </div>
                    </div>

                    {/* Table Number Title */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        NOMOR MEJA
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">
                        {table.tableNumber}
                      </div>
                    </div>

                    {/* QR Code Frame */}
                    <div className="p-2 bg-white rounded-2xl border-2 border-slate-900 inline-block">
                      {qr && (
                        <img
                          src={qr}
                          alt={table.tableNumber}
                          className="w-36 h-36 mx-auto"
                        />
                      )}
                    </div>

                    {/* Footer Guide */}
                    <div className="space-y-0.5 pt-1">
                      <div className="text-[11px] font-black text-slate-900">
                        📱 Scan Kamera HP Anda
                      </div>
                      <div className="text-[9px] text-slate-600 leading-tight">
                        Lihat menu &amp; pesan mandiri langsung dari meja Anda
                      </div>
                    </div>

                    <div className="text-[8px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                      Powered by Qassa POS
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}
