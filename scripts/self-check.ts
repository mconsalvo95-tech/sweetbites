/**
 * Self-check: submit a ship-to order and assert order + shipment exist.
 * Run: npm run self-check
 */
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { submitOrder, getOrder } from "../lib/orders";
import { quotePromo } from "../lib/promos";
import { customerOrderEmail, ownerOrderEmail } from "../lib/order-email";
import { canCustomerCancel } from "../lib/types";
import { expectedSquareSignature, verifySquareSignature } from "../lib/square";
import { parsePriceQuotes } from "../lib/shipping";
import {
  parseProductImages,
  primaryProductImage,
  serializeProductImages,
} from "../lib/product-images";
import { addressFromPhoton, provinceCode } from "../lib/address-search";
import { isAllowedWantedOn, localDateIso, minWantedOnIso, wantedNote, wantedOnFromNotes } from "../lib/shop";

const LOCAL_FILE = join(process.cwd(), ".local-orders.json");

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const okDate = minWantedOnIso();
  assert(isAllowedWantedOn(okDate), "min wanted date should be allowed");
  assert(!isAllowedWantedOn(localDateIso()), "today should not be allowed for orders");

  const fixedToday = new Date(2026, 9, 1);
  assert(minWantedOnIso(fixedToday) === "2026-10-03", "Oct 1 + 2 days is Oct 3 earliest");
  assert(!isAllowedWantedOn("2026-10-01", fixedToday), "same-day order date should fail");
  assert(!isAllowedWantedOn("2026-10-02", fixedToday), "next-day order date should fail");
  assert(isAllowedWantedOn("2026-10-03", fixedToday), "earliest allowed date should pass");
  assert(!isAllowedWantedOn("soon", fixedToday), "non-ISO date string should fail");

  assert(provinceCode("Alberta") === "AB", "Alberta should map to AB");
  assert(provinceCode("Québec") === "QC", "Québec should map to QC");
  const redDeer = addressFromPhoton({
    housenumber: "12",
    street: "Gaetz Ave",
    city: "Red Deer",
    state: "Alberta",
    postcode: "T4N 3P2",
    countrycode: "CA",
  });
  assert(
    redDeer?.street === "12 Gaetz Ave" && redDeer.city === "Red Deer" && redDeer.province === "AB" && redDeer.postal === "T4N 3P2",
    "Photon hit should fill street, city, province, and postal",
  );
  assert(addressFromPhoton({ street: "Main", city: "Seattle", state: "Washington", countrycode: "US" }) === null, "non-Canada hit should be dropped");
  assert(addressFromPhoton({ name: "Red Deer", city: "Red Deer", state: "Alberta", countrycode: "CA", type: "city" }) === null, "city-only hit should be dropped");

  const plainImg = "https://a.test/1.jpg";
  assert(
    parseProductImages(plainImg).length === 1 && parseProductImages(plainImg)[0] === plainImg,
    "plain URL should parse as one image",
  );
  assert(
    serializeProductImages(["https://a.test/1.jpg"]) === "https://a.test/1.jpg",
    "single image should stay plain URL",
  );
  assert(
    parseProductImages('["https://a.test/1.jpg","https://a.test/2.jpg"]').length === 2,
    "JSON array images should parse",
  );
  const twoUrls = ["https://a.test/1.jpg", "https://a.test/2.jpg"];
  assert(
    serializeProductImages(twoUrls) === JSON.stringify(twoUrls),
    "two images should serialize as JSON array",
  );
  assert(parseProductImages("[not valid json").length === 1, "garbage JSON array should not throw");
  assert(parseProductImages("[not valid json")[0] === "[not valid json", "garbage JSON should fall back to raw string");
  assert(parseProductImages("[]").length === 0, "empty JSON array should parse to no images");
  assert(
    primaryProductImage('["https://a.test/first.jpg","https://a.test/second.jpg"]') ===
      "https://a.test/first.jpg",
    "primary image should be the first parsed URL",
  );

  const parsed = parsePriceQuotes([
    {
      serviceCode: "DOM.RP",
      serviceName: "Regular Parcel",
      priceDetails: { due: 12.45 },
      serviceStandard: { expectedTransitTime: 4 },
    },
    { serviceCode: "INT.XP", priceDetails: { due: 40 } },
  ]);
  assert(parsed.length === 1 && parsed[0].code === "DOM.RP", "Should keep domestic quotes only");
  assert(parsed[0].rateCents === 1245, "due 12.45 dollars is 1245 cents");
  assert(parsed[0].etaEn.includes("4"), "ETA should use transit days");

  const sweet10 = quotePromo(
    { code: "SWEET10", kind: "percent", value: 10, minFoodCents: 0, active: true, expiresAt: null },
    1890,
  );
  assert(sweet10.ok && sweet10.discountCents === 189, "SWEET10 should be 10% of 1890");

  const biteLow = quotePromo(
    { code: "BITE5", kind: "fixed", value: 500, minFoodCents: 2500, active: true, expiresAt: null },
    1890,
  );
  assert(!biteLow.ok && biteLow.error === "min_order", "BITE5 should require $25 food");

  const biteOk = quotePromo(
    { code: "BITE5", kind: "fixed", value: 500, minFoodCents: 2500, active: true, expiresAt: null },
    2500,
  );
  assert(biteOk.ok && biteOk.discountCents === 500, "BITE5 should take $5 off $25");

  assert(!quotePromo(null, 2000).ok, "Missing code should be invalid");

  const sample = {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    lang: "en" as const,
    fulfillment: "pickup" as const,
    customerName: "Maya",
    customerEmail: "maya@example.com",
    phone: "4165550100",
    foodCents: 700,
    shippingCents: 0,
    discountCents: 70,
    totalCents: 630,
    promoCode: "SWEET10",
    wantedOn: okDate,
    items: [
      {
        lineId: "1",
        productId: "prod-choc-chip",
        slug: "brown-butter-chocolate-chip",
        nameEn: "Brown butter chocolate chip",
        nameEs: "Chip de chocolate",
        qty: 2,
        unitPriceCents: 350,
        imageUrl: "",
        optionsJson: {},
      },
    ],
    siteUrl: "http://localhost:3000",
  };
  const buyer = customerOrderEmail(sample);
  assert(buyer.text.includes("Maya") && buyer.text.includes("$6.30"), "buyer email should name + total");
  assert(
    buyer.text.includes("Pickup") && buyer.text.includes("195 Lougheed Close"),
    "pickup confirmation should include kitchen address",
  );
  assert(buyer.text.includes(`Pickup date: ${okDate}`), "pickup confirmation should include requested date");
  assert(buyer.html.includes("Review order") && buyer.html.includes("Order #aaaaaaaa"), "receipt should have order number and review button");
  assert(buyer.html.includes("Need to change order date?"), "receipt should offer a date change instead of cancel");
  assert(!buyer.html.includes("Cancel order"), "receipt should not offer cancellation");
  assert(buyer.html.includes("https://sweetbites.shop/logos/receipt-wordmark.png"), "receipt header should use production wordmark");
  assert(buyer.html.includes("https://sweetbites.shop/logos/receipt-mark.png"), "receipt should use production watermark img");
  assert(buyer.html.includes("<img"), "receipt should use img tags for branding");
  assert(buyer.html.includes("Maya") && buyer.html.includes("$6.30"), "receipt should use this customer's total");
  assert(buyer.html.includes("195 Lougheed Close"), "receipt should include the pickup address");
  assert(!buyer.html.includes("Postable"), "receipt should be Sweetbites, not the sample brand");
  const shopMail = ownerOrderEmail(sample);
  assert(shopMail.text.includes("195 Lougheed Close"), "owner email should include pickup address");
  assert(shopMail.text.includes(`Pickup date: ${okDate}`), "owner email should include requested date");
  assert(shopMail.text.includes("maya@example.com") && shopMail.text.includes("Open:"), "owner email should include contact + link");
  const merged = wantedNote("pickup", okDate, "nut-free", "en");
  assert(merged.startsWith(`Pickup date: ${okDate}`), "wanted note should lead with date");
  assert(wantedOnFromNotes(merged) === okDate, "should parse wanted date from notes");

  if (existsSync(LOCAL_FILE)) unlinkSync(LOCAL_FILE);

  try {
    await submitOrder({
      fulfillment: "pickup",
      lang: "en",
      customerName: "Self Check",
      customerEmail: "self-check@example.com",
      phone: "4165550100",
      foodCents: 700,
      shippingCents: 0,
      totalCents: 700,
      items: [
        {
          lineId: "missing-date",
          productId: "prod-choc-chip",
          slug: "brown-butter-chocolate-chip",
          nameEn: "Brown butter chocolate chip",
          nameEs: "Chip de chocolate",
          qty: 1,
          unitPriceCents: 700,
          imageUrl: "",
          optionsJson: {},
        },
      ],
    });
    throw new Error("Expected submit without date to fail");
  } catch (err) {
    assert(err instanceof Error && err.message === "Select a date", "missing date should fail");
  }

  try {
    await submitOrder({
      fulfillment: "pickup",
      lang: "en",
      customerName: "Self Check",
      customerEmail: "self-check@example.com",
      phone: "4165550100",
      wantedOn: localDateIso(),
      foodCents: 700,
      shippingCents: 0,
      totalCents: 700,
      items: [
        {
          lineId: "too-soon",
          productId: "prod-choc-chip",
          slug: "brown-butter-chocolate-chip",
          nameEn: "Brown butter chocolate chip",
          nameEs: "Chip de chocolate",
          qty: 1,
          unitPriceCents: 700,
          imageUrl: "",
          optionsJson: {},
        },
      ],
    });
    throw new Error("Expected submit with today to fail");
  } catch (err) {
    assert(err instanceof Error && err.message === "Order date too soon", "today should fail server validation");
  }

  const result = await submitOrder({
    fulfillment: "ship",
    lang: "en",
    customerName: "Self Check",
    customerEmail: "self-check@example.com",
    phone: "4165550100",
    wantedOn: okDate,
    shipStreet: "100 Main St",
    shipCity: "Vancouver",
    shipProvince: "BC",
    shipPostal: "V6B 1A1",
    foodCents: 1890,
    shippingCents: 1499,
    totalCents: 3389,
    serviceCode: "regular",
    serviceNameEn: "Regular Parcel",
    serviceNameEs: "Paquete regular",
    items: [
      {
        lineId: "test-line",
        productId: "prod-brownie-box",
        slug: "brownie-box-of-4",
        nameEn: "Brownie box of 4",
        nameEs: "Caja de 4 brownies",
        qty: 1,
        unitPriceCents: 1890,
        imageUrl: "",
        optionsJson: { "Pick your flavors": ["Dark chocolate", "Salted caramel", "Raspberry jam", "Toasted hazelnut"] },
      },
    ],
  });

  const order = await getOrder(result.id);
  if (!order) throw new Error("Order not found after submit");
  if (order.fulfillment !== "ship") throw new Error("Expected ship fulfillment");
  if (order.items.length !== 1) throw new Error("Expected 1 order item");
  if (order.serviceCode !== "regular" && result.source === "local") {
    if (!order.serviceCode) throw new Error("Expected shipment stub on local order");
  }

  if (result.source === "local") {
    if (!order.serviceCode) throw new Error("Local ship order missing serviceCode");
  }

  console.log(`OK: order ${result.id} (${result.source}) with ${order.items.length} item(s)`);
  if (order.fulfillment === "ship") {
    console.log(`OK: shipment stub service=${order.serviceCode} rate=${order.shippingCents}c`);
  }

  const promoResult = await submitOrder({
    fulfillment: "pickup",
    lang: "en",
    customerName: "Self Check",
    customerEmail: "self-check@example.com",
    phone: "4165550100",
    foodCents: 1890,
    shippingCents: 0,
    totalCents: 1890,
    wantedOn: okDate,
    promoCode: "sweet10",
    items: [
      {
        lineId: "test-line-promo",
        productId: "prod-brownie-box",
        slug: "brownie-box-of-4",
        nameEn: "Brownie box of 4",
        nameEs: "Caja de 4 brownies",
        qty: 1,
        unitPriceCents: 1890,
        imageUrl: "",
        optionsJson: {},
      },
    ],
  });
  const promoOrder = await getOrder(promoResult.id);
  if (!promoOrder) throw new Error("Promo order not found");
  if (promoOrder.promoCode !== "SWEET10") throw new Error("Expected SWEET10 on order");
  if (promoOrder.discountCents !== 189) throw new Error(`Expected 189c off, got ${promoOrder.discountCents}`);
  if (promoOrder.totalCents !== 1701) throw new Error(`Expected 1701c total, got ${promoOrder.totalCents}`);
  console.log(`OK: promo ${promoOrder.promoCode} discount=${promoOrder.discountCents}c total=${promoOrder.totalCents}c`);

  assert(canCustomerCancel("pending"), "Customer can cancel pending");
  assert(!canCustomerCancel("ready"), "Ready is not a status");
  assert(!canCustomerCancel("completed") && !canCustomerCancel("sent"), "Customer cannot cancel finished orders");
  assert(!canCustomerCancel("cancelled"), "Already cancelled is not cancellable");

  const sqBody = '{"type":"payment.updated"}';
  const sqUrl = "https://sweetbites.shop/api/square/webhook";
  const sqSig = expectedSquareSignature(sqUrl, sqBody, "square-test-key");
  assert(verifySquareSignature(sqUrl, sqBody, sqSig, "square-test-key"), "Square signature should verify");
  assert(!verifySquareSignature(sqUrl, sqBody, "nope", "square-test-key"), "Bad Square signature should fail");
}

main().catch((err) => {
  console.error("SELF-CHECK FAILED:", err.message ?? err);
  process.exit(1);
});
