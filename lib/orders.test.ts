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

const flavorOption = {
  id: "opt-flavors",
  nameEn: "Pick your flavors",
  nameEs: "Elige tus sabores",
  required: true,
  maxSelect: 4,
  values: [
    { id: "fv-choc", nameEn: "Dark chocolate", nameEs: "Chocolate oscuro" },
    { id: "fv-salted", nameEn: "Salted caramel", nameEs: "Caramelo salado" },
  ],
};

const catalogProduct: OrderCatalogProduct = {
  id: "prod-choc-chip",
  priceCents: 350,
  nameEn: "Brown butter chocolate chip",
  nameEs: "Chip",
  leadDays: 0,
  options: [],
};

const boxProduct: OrderCatalogProduct = {
  id: "prod-cookie-box",
  priceCents: 1400,
  nameEn: "Cookie box of 4",
  nameEs: "Caja de 4 galletas",
  leadDays: 1,
  options: [flavorOption],
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

  it("rejects unknown option keys and invalid values", () => {
    const boxMap = new Map([[boxProduct.id, boxProduct]]);
    expect(() =>
      resolveOrderLines([line({ productId: boxProduct.id, unitPriceCents: 1400, optionsJson: { Size: ["Large"] } })], boxMap),
    ).toThrow(OrderInputError);
    expect(() =>
      resolveOrderLines(
        [
          line({
            productId: boxProduct.id,
            unitPriceCents: 1400,
            optionsJson: { "Pick your flavors": ["Not a flavor"] },
          }),
        ],
        boxMap,
      ),
    ).toThrow(OrderInputError);
  });

  it("requires required options and enforces maxSelect and duplicates", () => {
    const boxMap = new Map([[boxProduct.id, boxProduct]]);
    expect(() =>
      resolveOrderLines([line({ productId: boxProduct.id, unitPriceCents: 1400, optionsJson: {} })], boxMap),
    ).toThrow(OrderInputError);
    expect(() =>
      resolveOrderLines(
        [
          line({
            productId: boxProduct.id,
            unitPriceCents: 1400,
            optionsJson: {
              "Pick your flavors": ["Dark chocolate", "Dark chocolate"],
            },
          }),
        ],
        boxMap,
      ),
    ).toThrow(OrderInputError);
    expect(() =>
      resolveOrderLines(
        [
          line({
            productId: boxProduct.id,
            unitPriceCents: 1400,
            optionsJson: {
              "Pick your flavors": ["Dark chocolate", "Salted caramel", "Dark chocolate", "Salted caramel", "Dark chocolate"],
            },
          }),
        ],
        boxMap,
      ),
    ).toThrow(OrderInputError);
    const ok = resolveOrderLines(
      [
        line({
          productId: boxProduct.id,
          unitPriceCents: 1400,
          optionsJson: { "Pick your flavors": ["Dark chocolate", "Salted caramel"] },
        }),
      ],
      boxMap,
    );
    expect(ok.foodCents).toBe(1400);
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
    const fixedToday = new Date("2026-10-01T18:00:00Z");
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
