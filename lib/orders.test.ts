import { describe, expect, it } from "vitest";
import type { CartLine } from "./types";
import {
  isValidOrderQty,
  minWantedOnForLeadDays,
  orderStatusToken,
  orderStatusTokenMatches,
  OrderInputError,
  resolveOrderLines,
  type OrderCatalogProduct,
} from "./orders";

const catalogProduct: OrderCatalogProduct = {
  id: "prod-choc-chip",
  priceCents: 350,
  nameEn: "Brown butter chocolate chip",
  nameEs: "Chip",
  leadDays: 0,
};

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    lineId: "1",
    productId: "prod-choc-chip",
    slug: "brown-butter-chocolate-chip",
    nameEn: "Brown butter chocolate chip",
    nameEs: "Chip",
    qty: 1,
    unitPriceCents: 350,
    imageUrl: "",
    optionsJson: {},
    ...overrides,
  };
}

describe("resolveOrderLines", () => {
  const map = new Map([[catalogProduct.id, catalogProduct]]);

  it("rejects client price mismatch", () => {
    expect(() => resolveOrderLines([line({ unitPriceCents: 1 })], map)).toThrow(OrderInputError);
    try {
      resolveOrderLines([line({ unitPriceCents: 1 })], map);
    } catch (err) {
      expect(err).toBeInstanceOf(OrderInputError);
      expect((err as OrderInputError).status).toBe(400);
    }
  });

  it("totals food from catalog price × qty", () => {
    const { foodCents } = resolveOrderLines([line({ qty: 2, unitPriceCents: 350 })], map);
    expect(foodCents).toBe(700);
  });

  it("rejects invalid quantities", () => {
    for (const qty of [0, -1, 100, 1.5]) {
      expect(() => resolveOrderLines([line({ qty })], map)).toThrow(OrderInputError);
    }
  });

  it("uses catalog names instead of client names", () => {
    const { lines } = resolveOrderLines([line({ nameEn: "Hacked", nameEs: "Hackeado" })], map);
    expect(lines[0].nameEn).toBe(catalogProduct.nameEn);
    expect(lines[0].nameEs).toBe(catalogProduct.nameEs);
  });
});

describe("isValidOrderQty", () => {
  it("allows 1..99 integers only", () => {
    expect(isValidOrderQty(1)).toBe(true);
    expect(isValidOrderQty(99)).toBe(true);
    expect(isValidOrderQty(0)).toBe(false);
  });
});

describe("minWantedOnForLeadDays", () => {
  it("requires wantedOn on or after today + max lead", () => {
    const fixedToday = new Date(2026, 9, 1);
    const leadMin = minWantedOnForLeadDays(3, fixedToday);
    expect(leadMin).toBe("2026-10-04");
    expect("2026-10-03" < leadMin).toBe(true);
    expect("2026-10-04" < leadMin).toBe(false);
  });
});

describe("orderStatusToken", () => {
  it("matches only the order id it was signed for", () => {
    const a = "11111111-1111-1111-1111-111111111111";
    const b = "22222222-2222-2222-2222-222222222222";
    const tokenA = orderStatusToken(a);
    expect(orderStatusTokenMatches(a, tokenA)).toBe(true);
    expect(orderStatusTokenMatches(b, tokenA)).toBe(false);
    expect(orderStatusTokenMatches(a, "deadbeef")).toBe(false);
  });
});
