import { redirect } from "next/navigation";

export default function AdminThemesPage() {
  redirect("/admin/catalog?tab=THEMES");
}
