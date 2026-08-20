import { redirect } from "next/navigation";

export default function VouchersPage() {
  redirect("/dashboard/products?tab=VOUCHERS");
}
