import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const user = session.user as any;

  if (user.role === "KASIR") {
    redirect("/pos");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      outlets: { take: 1 },
      subscriptions: {
        where: { isActive: true },
        include: { plugins: { include: { plugin: true } } },
        take: 1,
      },
    },
  });

  const activePlugin = tenant?.subscriptions?.[0]?.plugins?.[0]?.plugin?.code || "retail";

  return (
    <OnboardingClient
      initialData={{
        businessName: tenant?.businessName || "",
        outletName: tenant?.outlets?.[0]?.name || "Cabang Utama",
        address: tenant?.outlets?.[0]?.address || "",
        activeVertical: activePlugin.toUpperCase(),
      }}
    />
  );
}
