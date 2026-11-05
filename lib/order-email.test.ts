import { describe, expect, it } from "vitest";
import {
  customerOrderCancelledEmail,
  customerOrderShippedEmail,
} from "./order-email";

const base = {
  id: "abcdef12-3456-7890-abcd-ef1234567890",
  siteUrl: "https://sweetbites.shop",
  statusToken: "abc123",
  customerName: "Alex",
};

describe("customerOrderCancelledEmail", () => {
  it("English subject", () => {
    const { subject } = customerOrderCancelledEmail({ ...base, lang: "en" });
    expect(subject).toBe("Sweetbites — order #abcdef12 cancelled");
  });

  it("Spanish subject", () => {
    const { subject } = customerOrderCancelledEmail({ ...base, lang: "es" });
    expect(subject).toBe("Sweetbites — pedido #abcdef12 cancelado");
  });
});

describe("customerOrderShippedEmail", () => {
  it("English subject", () => {
    const { subject } = customerOrderShippedEmail({ ...base, lang: "en" });
    expect(subject).toBe("Sweetbites — order #abcdef12 shipped");
  });

  it("Spanish subject", () => {
    const { subject } = customerOrderShippedEmail({ ...base, lang: "es" });
    expect(subject).toBe("Sweetbites — pedido #abcdef12 enviado");
  });

  it("includes status link in body", () => {
    const { text } = customerOrderShippedEmail({ ...base, lang: "en" });
    expect(text).toContain(
      "https://sweetbites.shop/order-status/abcdef12-3456-7890-abcd-ef1234567890?t=abc123",
    );
  });
});
