import { getCatalogPricingData } from "@/modules/superadmin/actions";
import { CatalogClient } from "./catalog-client";
import { Tags } from "lucide-react";

export default async function AdminCatalogPage() {
  const { licenseTiers, plugins, themes } = await getCatalogPricingData();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Tags className="w-3.5 h-3.5" />
          Katalog Produk & Harga Platform
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Pengaturan Harga Lisensi & Plugin
        </h1>
        <p className="text-xs text-slate-400">
          Ubah harga bulanan/tahunan secara live tanpa perlu melakukan deploy ulang kode.
        </p>
      </div>

      <CatalogClient
        initialLicenses={licenseTiers}
        initialPlugins={plugins}
        initialThemes={themes}
      />
    </div>
  );
}
