import { getBroadcastsData } from "@/modules/superadmin/broadcast-actions";
import { AdminBroadcastClient } from "./broadcast-client";

export default async function AdminBroadcastPage() {
  const messages = await getBroadcastsData();

  return <AdminBroadcastClient initialMessages={messages} />;
}
