import { getProductsData } from "@/modules/product/actions";
import { getVouchersData } from "@/modules/voucher/actions";
import { ProductClient } from "./product-client";

export default async function ProductsPage() {
  const [productsData, vouchersData] = await Promise.all([
    getProductsData(),
    getVouchersData(),
  ]);

  return <ProductClient initialData={productsData} vouchersData={vouchersData} />;
}
