/**
 * Swal utility wrapper — terpusat di satu tempat agar mudah dikustomisasi.
 * Gunakan fungsi ini di seluruh aplikasi sebagai pengganti alert() & confirm() native browser.
 */
import Swal from "sweetalert2";

// ─── Tema dasar (dark mode, border radius, font sesuai proyek) ───────────────
const baseConfig = {
  customClass: {
    popup:
      "!rounded-3xl !font-sans !text-sm !shadow-2xl dark:!bg-slate-900 dark:!text-slate-100 dark:!border dark:!border-slate-700",
    title: "!text-base !font-bold dark:!text-white",
    htmlContainer: "!text-slate-600 dark:!text-slate-300",
    confirmButton:
      "!rounded-xl !px-5 !py-2 !text-xs !font-bold !bg-indigo-600 hover:!bg-indigo-700 !text-white !shadow-md !shadow-indigo-600/30",
    cancelButton:
      "!rounded-xl !px-5 !py-2 !text-xs !font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-700 dark:!bg-slate-800 dark:hover:!bg-slate-700 dark:!text-slate-200",
    denyButton:
      "!rounded-xl !px-5 !py-2 !text-xs !font-bold !bg-red-600 hover:!bg-red-700 !text-white",
    icon: "!text-4xl",
  },
  buttonsStyling: false,
  reverseButtons: true,
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
    confirmButtonText: "Oke",
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
      ...baseConfig.customClass,
      confirmButton: options?.isDanger
        ? "!rounded-xl !px-5 !py-2 !text-xs !font-bold !bg-red-600 hover:!bg-red-700 !text-white"
        : baseConfig.customClass.confirmButton,
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

/** Shortcut: tampilkan toast error */
export function toastError(message: string) {
  return swalToast.fire({ icon: "error", title: message });
}
