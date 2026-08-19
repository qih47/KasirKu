"use client";

import { useState, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  Trash2,
} from "lucide-react";
import {
  importProductsBatchAction,
  ParsedProductRow,
  DuplicateStrategy,
  ImportResult,
} from "@/modules/product/import-actions";
import {
  compressImage,
  CompressionResult,
  formatFileSize,
} from "@/lib/image-compressor";
import { swalSuccess, swalError, toastSuccess, toastError } from "@/lib/swal";

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportProductModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportProductModalProps) {
  const [activeTab, setActiveTab] = useState<"CSV" | "IMAGES">("CSV");

  // CSV Tab States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("UPDATE_EXISTING");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Images Tab States
  const [selectedImages, setSelectedImages] = useState<CompressionResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    uploaded: number;
    matched: number;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ─── 1. CSV HANDLERS ───────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const csvContent =
      "nama_produk,tipe,harga,kategori,stok,barcode,foto_produk\n" +
      "Kopi Susu Gula Aren,BARANG,22000,Minuman Kopi,50,8991001,kopi-susu.jpg\n" +
      "Iced Caramel Macchiato,BARANG,28000,Minuman Kopi,40,8991002,macchiato.jpg\n" +
      "Butter Croissant,BARANG,24000,Bakery,25,8991003,croissant.jpg\n" +
      "Potong Rambut Pria,JASA,50000,Hair Grooming,,,\n" +
      "Cuci & Styling Rambut,JASA,35000,Hair Treatment,,,\n" +
      "Cuci Kering Lipat per Kg,JASA,8000,Laundry Kiloan,,,\n" +
      "Minyak Goreng 2L,BARANG,34000,Sembako,100,8992001,minyak-goreng.jpg\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_Impor_Produk_Qassa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      setParseErrors(["File CSV kosong atau hanya berisi baris header."]);
      setParsedRows([]);
      return;
    }

    // Deteksi pemisah delimiter (koma atau titik koma)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(";") ? ";" : ",";
    const headers = headerLine
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

    const nameIdx = headers.findIndex(
      (h) => h.includes("nama") || h.includes("name") || h.includes("item")
    );
    const typeIdx = headers.findIndex(
      (h) => h.includes("tipe") || h.includes("type")
    );
    const priceIdx = headers.findIndex(
      (h) => h.includes("harga") || h.includes("price")
    );
    const catIdx = headers.findIndex(
      (h) => h.includes("kategori") || h.includes("cat")
    );
    const stockIdx = headers.findIndex(
      (h) => h.includes("stok") || h.includes("qty") || h.includes("stock")
    );
    const barcodeIdx = headers.findIndex(
      (h) => h.includes("barcode") || h.includes("sku")
    );
    const imgIdx = headers.findIndex(
      (h) => h.includes("foto") || h.includes("image") || h.includes("gambar")
    );

    if (nameIdx === -1 || priceIdx === -1) {
      setParseErrors([
        "Format header tidak valid. Wajib memiliki kolom 'nama_produk' dan 'harga'.",
      ]);
      setParsedRows([]);
      return;
    }

    const rows: ParsedProductRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex parsing untuk menangani nilai di dalam quotes
      const values = line
        .split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`))
        .map((v) => v.replace(/^["']|["']$/g, "").trim());

      const rawName = values[nameIdx] || "";
      const rawPrice = (values[priceIdx] || "").replace(/[^0-9.]/g, "");
      const rawType = (values[typeIdx] || "BARANG").toUpperCase();
      const rawCat = values[catIdx] || "Umum";
      const rawStock = (values[stockIdx] || "0").replace(/[^0-9]/g, "");
      const rawBarcode = values[barcodeIdx] || "";
      const rawImg = values[imgIdx] || "";

      if (!rawName) {
        errors.push(`Baris ${i + 1}: Nama produk kosong.`);
        continue;
      }
      if (!rawPrice || isNaN(Number(rawPrice))) {
        errors.push(`Baris ${i + 1}: Harga tidak valid untuk '${rawName}'.`);
        continue;
      }

      const itemType: "BARANG" | "JASA" =
        rawType === "JASA" ? "JASA" : "BARANG";

      rows.push({
        rowNumber: i + 1,
        name: rawName,
        type: itemType,
        price: Number(rawPrice),
        category: rawCat,
        stockQty: itemType === "JASA" ? null : Number(rawStock) || 0,
        barcode: rawBarcode || undefined,
        imageUrl: rawImg || undefined,
      });
    }

    setParseErrors(errors);
    setParsedRows(rows);
  };

  const handleFileSelect = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      toastError("Tidak ada data produk yang valid untuk diimpor.");
      return;
    }

    setIsImporting(true);
    try {
      const result: ImportResult = await importProductsBatchAction({
        rows: parsedRows,
        duplicateStrategy,
      });

      await swalSuccess(
        "Impor Produk Berhasil!",
        `Diproses: ${result.totalProcessed} item\n` +
          `• Berhasil Baru: ${result.totalImported}\n` +
          `• Diperbarui: ${result.totalUpdated}\n` +
          `• Dilewati: ${result.totalSkipped}\n` +
          (result.totalFailed > 0 ? `• Gagal: ${result.totalFailed}` : "")
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      swalError("Gagal Impor Produk", err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── 2. IMAGES HANDLERS ────────────────────────────────────────────────────

  const handleImagesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newCompressed: CompressionResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
          format: "image/webp",
        });
        newCompressed.push(compressed);
      } catch (err) {
        console.error(`Gagal kompresi ${file.name}:`, err);
      }
    }

    setSelectedImages((prev) => [...prev, ...newCompressed]);
    setIsCompressing(false);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadImages = async () => {
    if (selectedImages.length === 0) {
      toastError("Belum ada foto yang dipilih untuk diunggah.");
      return;
    }

    setIsUploadingImages(true);
    setUploadStats(null);

    try {
      const formData = new FormData();
      selectedImages.forEach((item) => {
        formData.append("files", item.file);
        formData.append("originalNames", item.fileName);
      });

      const res = await fetch("/api/uploads/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah gambar.");
      }

      setUploadStats({
        uploaded: data.totalUploaded,
        matched: data.totalMatched,
      });

      await swalSuccess(
        "Upload & Optimasi Selesai!",
        `Berhasil mengompres & mengunggah ${data.totalUploaded} foto.\n` +
          `Otomatis terpasang ke ${data.totalMatched} produk yang cocok di database.`
      );

      setSelectedImages([]);
      onSuccess();
    } catch (err: any) {
      swalError("Upload Gagal", err.message || "Terjadi kesalahan.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-4xl rounded-3xl p-6 sm:p-7 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
        }}
      >
        {/* Header Modal */}
        <div
          className="flex items-start justify-between border-b pb-4"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3
                className="font-black text-lg"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                Impor Massal Produk &amp; Galeri Foto
              </h3>
              <p
                className="text-xs"
                style={{ color: "var(--theme-text-secondary, #64748b)" }}
              >
                Unggah ribuan katalog produk dan foto beresolusi tinggi secara instan.
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

        {/* Tab Navigation Switcher */}
        <div
          className="flex items-center gap-2 py-3 border-b"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <button
            onClick={() => setActiveTab("CSV")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CSV"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Impor Data Produk (CSV / Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab("IMAGES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "IMAGES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Galeri Upload Foto Massal (Auto-Compress)</span>
            {selectedImages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold">
                {selectedImages.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {/* ════════════════════ TAB 1: CSV DATA IMPORT ════════════════════ */}
          {activeTab === "CSV" && (
            <div className="space-y-4">
              {/* Step 1: Download Template */}
              <div
                className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                }}
              >
                <div>
                  <h4
                    className="font-bold text-xs"
                    style={{ color: "var(--theme-text-primary, #0f172a)" }}
                  >
                    Langkah 1: Unduh Format Template CSV
                  </h4>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--theme-text-secondary, #64748b)" }}
                  >
                    Gunakan template resmi kami agar kolom Nama, Harga, Tipe
                    (BARANG/JASA), dan Stok terisi dengan benar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center gap-2"
                style={{ borderColor: "var(--theme-card-border, #cbd5e1)" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p
                    className="font-bold text-xs"
                    style={{ color: "var(--theme-text-primary, #0f172a)" }}
                  >
                    {csvFile ? csvFile.name : "Klik atau seret file CSV ke sini"}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--theme-text-secondary, #64748b)" }}
                  >
                    Mendukung file .CSV standar (format koma atau titik koma)
                  </p>
                </div>
              </div>

              {/* Step 3: Duplicate Strategy Option */}
              {parsedRows.length > 0 && (
                <div
                  className="p-4 rounded-2xl border space-y-2"
                  style={{
                    backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                  }}
                >
                  <label
                    className="font-bold text-xs block"
                    style={{ color: "var(--theme-text-primary, #0f172a)" }}
                  >
                    Pilihan Jika Produk / Barcode Sudah Ada di Database:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="duplicateStrategy"
                        value="UPDATE_EXISTING"
                        checked={duplicateStrategy === "UPDATE_EXISTING"}
                        onChange={() => setDuplicateStrategy("UPDATE_EXISTING")}
                        className="text-indigo-600"
                      />
                      <span>Perbarui Data &amp; Tambah Stok</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="duplicateStrategy"
                        value="SKIP_EXISTING"
                        checked={duplicateStrategy === "SKIP_EXISTING"}
                        onChange={() => setDuplicateStrategy("SKIP_EXISTING")}
                        className="text-indigo-600"
                      />
                      <span>Lewati (Hanya Tambah Baru)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="duplicateStrategy"
                        value="CREATE_NEW"
                        checked={duplicateStrategy === "CREATE_NEW"}
                        onChange={() => setDuplicateStrategy("CREATE_NEW")}
                        className="text-indigo-600"
                      />
                      <span>Buat Sebagai Item Baru</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Live Data Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Pratinjau Data ({parsedRows.length} item siap diimpor)
                    </span>
                    {parseErrors.length > 0 && (
                      <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {parseErrors.length} baris tidak valid dilewati
                      </span>
                    )}
                  </div>

                  <div className="border rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Nama Produk / Jasa</th>
                          <th className="p-2">Tipe</th>
                          <th className="p-2">Harga Jual</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Stok Awal</th>
                          <th className="p-2">Barcode</th>
                          <th className="p-2">Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedRows.slice(0, 50).map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900"
                          >
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold">{row.name}</td>
                            <td className="p-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  row.type === "BARANG"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {row.type}
                              </span>
                            </td>
                            <td className="p-2 text-emerald-600 font-bold">
                              Rp {row.price.toLocaleString("id-ID")}
                            </td>
                            <td className="p-2 text-slate-500">
                              {row.category}
                            </td>
                            <td className="p-2">
                              {row.type === "JASA" ? (
                                <span className="text-slate-400 italic">
                                  - (Jasa)
                                </span>
                              ) : (
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {row.stockQty}
                                </strong>
                              )}
                            </td>
                            <td className="p-2 text-slate-400 font-mono">
                              {row.barcode || "-"}
                            </td>
                            <td className="p-2 text-slate-400 truncate max-w-[120px]">
                              {row.imageUrl || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 50 && (
                    <p className="text-[10px] text-slate-400 text-right">
                      *Menampilkan 50 baris pertama dari total {parsedRows.length}{" "}
                      item.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════ TAB 2: BULK IMAGE GALLERY ════════════════════ */}
          {activeTab === "IMAGES" && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-2xl border flex items-start gap-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                }}
              >
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4
                    className="font-bold text-xs"
                    style={{ color: "var(--theme-text-primary, #0f172a)" }}
                  >
                    Auto-Compress &amp; WebP Optimizer Engine
                  </h4>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: "var(--theme-text-secondary, #64748b)" }}
                  >
                    Pilih puluhan foto produk sekaligus dari galeri Anda. Foto
                    kamera berukuran 3 MB – 10 MB akan otomatis dikompres menjadi{" "}
                    <strong>~80–120 KB</strong> dalam format WebP dengan tetap
                    mempertahankan ketajaman visual. Sistem akan otomatis
                    memasangkannya ke produk yang memiliki nama file yang cocok.
                  </p>
                </div>
              </div>

              {/* Image Dropzone */}
              <div
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    handleImagesSelect(e.dataTransfer.files);
                  }
                }}
                className="border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center gap-2"
                style={{ borderColor: "var(--theme-card-border, #cbd5e1)" }}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImagesSelect(e.target.files)}
                />
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p
                    className="font-bold text-xs"
                    style={{ color: "var(--theme-text-primary, #0f172a)" }}
                  >
                    Klik atau Seret Kumpulan Foto Produk ke Sini
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--theme-text-secondary, #64748b)" }}
                  >
                    Bisa memilih banyak foto sekaligus (.JPG, .PNG, .WEBP)
                  </p>
                </div>
              </div>

              {isCompressing && (
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengompres &amp; mengoptimasi resolusi gambar...</span>
                </div>
              )}

              {/* Selected Images Grid Preview */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      {selectedImages.length} Foto Siap Diunggah
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedImages([])}
                      className="text-xs text-rose-500 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Pilihan
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
                    {selectedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group border rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 p-2 space-y-1.5"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 relative">
                          <img
                            src={img.previewUrl}
                            alt={img.fileName}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/70 text-white hover:bg-rose-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold truncate text-slate-800 dark:text-slate-200">
                            {img.fileName}
                          </p>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="line-through text-slate-400">
                              {formatFileSize(img.originalSize)}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {formatFileSize(img.compressedSize)}
                            </span>
                          </div>
                          <div className="text-[8px] font-extrabold text-indigo-600">
                            Hemat {img.reductionPercentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="border-t pt-4 flex items-center justify-between gap-3"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold hover:bg-slate-100 transition"
            style={{ color: "var(--theme-text-primary, #0f172a)" }}
          >
            Tutup
          </button>

          {activeTab === "CSV" ? (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || parsedRows.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Impor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Impor Sekarang ({parsedRows.length} Produk &amp; Jasa)
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUploadImages}
              disabled={isUploadingImages || selectedImages.length === 0}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isUploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah &amp; Memasangkan...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    Unggah {selectedImages.length} Foto &amp; Pasang ke Produk
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
