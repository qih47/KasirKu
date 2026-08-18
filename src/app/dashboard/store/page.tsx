import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStoreData } from "@/modules/store/actions";
import { StoreClient } from "./store-client";

export default async function StorePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "OWNER") redirect("/dashboard");

  const data = await getStoreData();

  return <StoreClient initialData={data} />;
}
