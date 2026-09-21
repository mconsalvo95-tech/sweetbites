export type Lang = "en" | "es";

export type Fulfillment = "pickup" | "delivery" | "ship";

export type Category = {
  id: string;
  nameEn: string;
  nameEs: string;
  slug: string;
  sort: number;
};

export type OptionValue = {
  id: string;
  nameEn: string;
  nameEs: string;
};

export type ProductOption = {
  id: string;
  nameEn: string;
  nameEs: string;
  required: boolean;
  maxSelect: number;
  values: OptionValue[];
};

export type Product = {
  id: string;
  categoryId: string;
  nameEn: string;
  nameEs: string;
  slug: string;
  descriptionEn: string;
  descriptionEs: string;
  priceCents: number;
  imageUrl: string;
  leadDays: number;
  shipWeightG: number;
  shipLCm: number;
  shipWCm: number;
  shipHCm: number;
  options: ProductOption[];
};

export type CartLine = {
  lineId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  qty: number;
  unitPriceCents: number;
  imageUrl: string;
  optionsJson: Record<string, string[]>;
};

export type ShippingService = {
  code: string;
  nameEn: string;
  nameEs: string;
  rateCents: number;
  etaEn: string;
  etaEs: string;
};

export type OrderResult = {
  id: string;
  source: "supabase" | "local";
  fulfillment: Fulfillment;
  totalCents: number;
  shippingCents: number;
  serviceCode?: string;
};

export type OrderRecord = {
  id: string;
  status: string;
  fulfillment: Fulfillment;
  lang: Lang;
  customerName: string;
  customerEmail: string;
  phone: string;
  shipStreet?: string;
  shipCity?: string;
  shipProvince?: string;
  shipPostal?: string;
  notes?: string;
  foodCents: number;
  shippingCents: number;
  totalCents: number;
  discountCents?: number;
  promoCode?: string;
  items: CartLine[];
  serviceCode?: string;
  serviceNameEn?: string;
  serviceNameEs?: string;
};

export function canCustomerCancel(status: string) {
  return status === "pending" || status === "ready";
}
