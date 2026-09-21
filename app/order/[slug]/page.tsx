import { notFound } from "next/navigation";
import { getLiveProductBySlug } from "@/lib/catalog";
import { ProductDetail } from "./ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
