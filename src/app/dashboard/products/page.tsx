import { getProductsData } from "@/modules/product/actions";
import { ProductClient } from "./product-client";

export default async function ProductsPage() {
  const data = await getProductsData();

  return <ProductClient initialData={data} />;
}
