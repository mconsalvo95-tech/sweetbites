import { describe, expect, it } from "vitest";
import { squarePaymentMatches } from "./square";

describe("squarePaymentMatches", () => {
  const stored = { storedSquareOrderId: "sq-1", totalCents: 5000 };

  it("passes when paid and ids and amounts match", () => {
    expect(
      squarePaymentMatches(stored, { squareOrderId: "sq-1", paid: true, amountCents: 5000 }),
    ).toBe(true);
  });

  it("fails when square order id differs", () => {
    expect(
      squarePaymentMatches(stored, { squareOrderId: "sq-2", paid: true, amountCents: 5000 }),
    ).toBe(false);
  });

  it("fails when amount mismatches", () => {
    expect(
      squarePaymentMatches(stored, { squareOrderId: "sq-1", paid: true, amountCents: 4999 }),
    ).toBe(false);
  });

  it("fails when unpaid", () => {
    expect(
      squarePaymentMatches(stored, { squareOrderId: "sq-1", paid: false, amountCents: 5000 }),
    ).toBe(false);
  });

  it("skips square checks for zero-total orders", () => {
    expect(
      squarePaymentMatches(
        { storedSquareOrderId: null, totalCents: 0 },
        { squareOrderId: "sq-x", paid: false, amountCents: 0 },
      ),
    ).toBe(true);
  });
});
