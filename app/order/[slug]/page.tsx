import { notFound } from "next/navigation";
import { fetchCatalog, getLiveProductBySlug } from "@/lib/catalog";
import { ProductDetail } from "./ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) notFound();
  const { products } = await fetchCatalog();
  const others = products.filter((item) => item.id !== product.id);
  const sameCategory = others.filter((item) => item.categoryId === product.categoryId);
  const more = (sameCategory.length ? sameCategory : others).slice(0, 4);
  return <ProductDetail product={product} more={more} />;
}
