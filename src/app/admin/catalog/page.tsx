import { getCatalogPricingData } from "@/modules/superadmin/actions";
import { getSubscriptionDurationSettingsAction } from "@/modules/superadmin/duration-actions";
import { getTrialConfigurationAction } from "@/modules/superadmin/trial-actions";
import { getFeatureEntitlementsMatrix } from "@/modules/features/feature-actions";
import { CatalogClient } from "./catalog-client";
import { Tags } from "lucide-react";

export default async function AdminCatalogPage() {
  const [{ licenseTiers, plugins, themes }, durationSettings, trialConfig, featureEntitlements] = await Promise.all([
    getCatalogPricingData(),
    getSubscriptionDurationSettingsAction(),
    getTrialConfigurationAction(),
    getFeatureEntitlementsMatrix(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Tags className="w-3.5 h-3.5" />
          Katalog &amp; Manajemen Harga Platform
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Katalog Lisensi, Plugin, Tema &amp; Matriks Fitur
        </h1>
        <p className="text-xs text-slate-400">
          Ubah harga live, atur masa trial pendaftaran, kelola diskon durasi langganan (1B s/d 3T), dan kelola matriks hak akses fitur per tier lisensi secara dinamis.
        </p>
      </div>

      <CatalogClient
        initialLicenses={licenseTiers}
        initialPlugins={plugins}
        initialThemes={themes}
        initialDurationSettings={durationSettings}
        initialTrialConfig={trialConfig}
        initialFeatureEntitlements={featureEntitlements}
      />
    </div>
  );
}

