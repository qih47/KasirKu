/**
 * Client-Side Smart Image Compressor
 * Mengompres foto resolusi tinggi (3MB–10MB) menjadi WebP tajam (~80KB–150KB)
 * Menggunakan HTML5 Canvas dengan Bicubic Smoothing.
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
  reductionPercentage: number;
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "image/webp" | "image/jpeg";
  } = {}
): Promise<CompressionResult> {
  const maxWidth = options.maxWidth || 1200;
  const maxHeight = options.maxHeight || 1200;
  const quality = options.quality !== undefined ? options.quality : 0.85;
  const format = options.format || "image/webp";

  return new Promise((resolve, reject) => {
    // Check if not an image
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File bukan merupakan format gambar yang valid."));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala aspect ratio proporsional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Gagal menginisialisasi Canvas Context."));
        }

        // Aktifkan high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Gagal mengompres gambar."));
            }

            // Ganti ekstensi file menjadi .webp jika dikonversi ke webp
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newExtension = format === "image/webp" ? "webp" : "jpg";
            const newFileName = `${baseName}.${newExtension}`;

            const compressedFile = new File([blob], newFileName, {
              type: format,
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const reduction = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: compressedFile,
              previewUrl,
              originalSize,
              compressedSize,
              fileName: file.name,
              reductionPercentage: reduction,
            });
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Gagal memuat file gambar untuk dikompresi."));
      };
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file gambar."));
    };
  });
}

/**
 * Format bytes ke ukuran yang mudah dibaca (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
