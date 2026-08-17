import { getTenantThemesMarketplaceData } from "@/modules/tenant/theme-actions";
import { TenantThemesClient } from "./themes-client";

export default async function TenantThemesPage() {
  const data = await getTenantThemesMarketplaceData();

  return <TenantThemesClient initialData={data} />;
}
