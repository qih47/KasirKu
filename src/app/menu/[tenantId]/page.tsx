import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CustomerMenuClient } from "./menu-client";

export default async function CustomerMenuPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
  });

  if (!tenant) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { tenantId: params.tenantId, isActive: true },
    orderBy: { category: "asc" },
  });

  return <CustomerMenuClient tenant={tenant} products={products} />;
}
