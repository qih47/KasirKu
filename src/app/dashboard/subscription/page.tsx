import { getSubscriptionData } from "@/modules/subscription/actions";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
  const data = await getSubscriptionData();

  return <SubscriptionClient initialData={data} />;
}
