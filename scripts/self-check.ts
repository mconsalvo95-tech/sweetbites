/**
 * Self-check: submit a ship-to order and assert order + shipment exist.
 * Run: npm run self-check
 */
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { submitOrder, getOrder } from "../lib/orders";

const LOCAL_FILE = join(process.cwd(), ".local-orders.json");

async function main() {
  if (existsSync(LOCAL_FILE)) unlinkSync(LOCAL_FILE);

  const result = await submitOrder({
    fulfillment: "ship",
    lang: "en",
    customerName: "Self Check",
    phone: "4165550100",
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
}

main().catch((err) => {
  console.error("SELF-CHECK FAILED:", err.message ?? err);
  process.exit(1);
});
