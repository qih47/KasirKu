import { redirect } from "next/navigation";

export default function TenantThemesPage() {
  redirect("/dashboard/settings?tab=THEMES");
}
