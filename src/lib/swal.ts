/**
 * Swal utility wrapper — terpusat di satu tempat agar mudah dikustomisasi.
 * Gunakan fungsi ini di seluruh aplikasi sebagai pengganti alert() & confirm() native browser.
 */
import Swal from "sweetalert2";

// ─── Tema dasar (dark mode, border radius, font sesuai proyek) ───────────────
const baseConfig = {
  reverseButtons: true,
  focusConfirm: false,
};

// ─── Alert sukses ─────────────────────────────────────────────────────────────
export async function swalSuccess(
  title: string,
  message?: string
): Promise<void> {
  await Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text: message,
    confirmButtonText: "Mengerti",
    timer: message ? undefined : 2000,
    timerProgressBar: !message,
  });
}

// ─── Alert error ──────────────────────────────────────────────────────────────
export async function swalError(
  title: string,
  message?: string
): Promise<void> {
  await Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text: message,
    confirmButtonText: "Tutup",
  });
}

// ─── Alert warning / info ─────────────────────────────────────────────────────
export async function swalWarning(
  title: string,
  message?: string
): Promise<void> {
  await Swal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text: message,
    confirmButtonText: "Mengerti",
  });
}

export async function swalInfo(
  title: string,
  message?: string
): Promise<void> {
  await Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text: message,
    confirmButtonText: "Oke",
  });
}

// ─── Konfirmasi (pengganti confirm()) ─────────────────────────────────────────
export async function swalConfirm(
  title: string,
  message?: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }
): Promise<boolean> {
  const result = await Swal.fire({
    ...baseConfig,
    icon: options?.isDanger ? "warning" : "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: options?.confirmText || "Ya, Lanjutkan",
    cancelButtonText: options?.cancelText || "Batal",
    customClass: {
      confirmButton: options?.isDanger ? "swal2-danger" : "",
    },
  });
  return result.isConfirmed;
}

// ─── Toast ringan (pojok kanan, auto-dismiss) ─────────────────────────────────
export const swalToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup:
      "!rounded-2xl !font-sans !text-xs !shadow-xl dark:!bg-slate-800 dark:!text-slate-100 dark:!border dark:!border-slate-700",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/** Shortcut: tampilkan toast sukses */
export function toastSuccess(message: string) {
  return swalToast.fire({ icon: "success", title: message });
}

/** Shortcut: tampilkan toast error (auto-prompt login jika sesi habis) */
export function toastError(message: string) {
  const isAuthError =
    message?.toLowerCase().includes("akses ditolak") ||
    message?.toLowerCase().includes("harus login") ||
    message?.toLowerCase().includes("sesi berakhir");

  if (isAuthError && typeof window !== "undefined") {
    Swal.fire({
      ...baseConfig,
      icon: "warning",
      title: "Sesi Login Berakhir",
      text: message || "Silakan login kembali untuk melanjutkan transaksi / manajemen Bisnis.",
      showCancelButton: true,
      confirmButtonText: "🔑 Login Sekarang",
      cancelButtonText: "Tutup",
      confirmButtonColor: "#4f46e5",
    }).then((res) => {
      if (res.isConfirmed) {
        window.location.href = "/login";
      }
    });
    return;
  }

  return swalToast.fire({ icon: "error", title: message });
}

