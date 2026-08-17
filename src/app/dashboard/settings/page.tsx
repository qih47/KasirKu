import { getTenantSettingsData } from "@/modules/tenant/settings-actions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const data = await getTenantSettingsData();

  return <SettingsClient initialData={data} />;
}
