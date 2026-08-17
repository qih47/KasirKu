import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentShiftData } from "@/modules/transaction/shift-actions";
import { getProductsData } from "@/modules/product/actions";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const [shiftData, productsData] = await Promise.all([
    getCurrentShiftData(),
    getProductsData(),
  ]);

  return (
    <PosClient
      initialShiftData={shiftData}
      initialProducts={productsData.products}
      categories={productsData.categories}
    />
  );
}
