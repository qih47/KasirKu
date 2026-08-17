import { getThemesCatalog } from "@/modules/superadmin/theme-actions";
import { AdminThemesClient } from "./themes-client";

export default async function AdminThemesPage() {
  const themes = await getThemesCatalog();

  return <AdminThemesClient initialThemes={themes} />;
}
