import { getCatalogPricingData } from "@/modules/superadmin/actions";
import { getSubscriptionDurationSettingsAction } from "@/modules/superadmin/duration-actions";
import { CatalogClient } from "./catalog-client";
import { Tags } from "lucide-react";

export default async function AdminCatalogPage() {
  const [{ licenseTiers, plugins, themes }, durationSettings] = await Promise.all([
    getCatalogPricingData(),
    getSubscriptionDurationSettingsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Tags className="w-3.5 h-3.5" />
          Katalog &amp; Manajemen Harga Platform
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Katalog Lisensi, Plugin, Tema &amp; Struk
        </h1>
        <p className="text-xs text-slate-400">
          Ubah harga live, terbitkan preset tema UI baru, serta kelola diskon durasi langganan (1 Bulan s/d 3 Tahun).
        </p>
      </div>

      <CatalogClient
        initialLicenses={licenseTiers}
        initialPlugins={plugins}
        initialThemes={themes}
        initialDurationSettings={durationSettings}
      />
    </div>
  );
}

