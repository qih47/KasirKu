import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReceiptDesignerData } from "@/modules/receipt-designer/actions";
import { ReceiptDesignerClient } from "./receipt-designer-client";

export default async function ReceiptDesignerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role !== "OWNER" && role !== "SUPER_ADMIN") redirect("/dashboard");


  const data = await getReceiptDesignerData();

  return <ReceiptDesignerClient initialData={data} />;
}
