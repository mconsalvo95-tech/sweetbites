import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendOrderEmails = vi.fn().mockResolvedValue(true);
const fetchSquareOrderState = vi.fn();

const orderRow = {
  id: "ord-1",
  payment_status: "unpaid",
  total_cents: 5000,
  square_order_id: "sq-1",
  square_payment_id: null,
  lang: "en",
  fulfillment: "pickup",
  customer_name: "Test",
  customer_email: "test@example.com",
  phone: "+1 416 555 0100",
  ship_street: null,
  ship_city: null,
  ship_province: null,
  ship_postal: null,
  notes: "Pickup date: 2026-10-10",
  food_cents: 5000,
  shipping_cents: 0,
  discount_cents: 0,
  promo_code: null,
};

let paid = false;

function chain(table: string) {
  const api = {
    select() {
      return api;
    },
    eq() {
      return api;
    },
    maybeSingle: async () => {
      if (table !== "orders") return { data: null, error: null };
      return { data: { ...orderRow, payment_status: paid ? "paid" : "unpaid" }, error: null };
    },
    update() {
      return {
        eq(col: string, val: unknown) {
          if (col === "payment_status" && val === "unpaid" && paid) {
            return { select: async () => ({ data: [], error: null }) };
          }
          if (col === "id") {
            return {
              eq(col2: string, val2: unknown) {
                if (col2 === "payment_status" && val2 === "unpaid") {
                  return {
                    select: async () => {
                      if (paid) return { data: [], error: null };
                      paid = true;
                      return { data: [{ id: orderRow.id }], error: null };
                    },
                  };
                }
                return { select: async () => ({ data: [], error: null }) };
              },
            };
          }
          return { select: async () => ({ data: [], error: null }) };
        },
      };
    },
  };
  return api;
}

vi.mock("./supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      if (table === "order_items") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return chain(table);
    },
  }),
}));

vi.mock("./square", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./square")>();
  return {
    ...actual,
    fetchSquareOrderState,
  };
});

vi.mock("./mail", () => ({
  sendOrderEmails,
}));

describe("markOrderPaid", () => {
  const prevSquareEnv = process.env.SQUARE_ENV;
  const prevServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    paid = false;
    sendOrderEmails.mockClear();
    fetchSquareOrderState.mockResolvedValue({
      squareOrderId: "sq-1",
      paid: true,
      amountCents: 5000,
    });
    process.env.SQUARE_ENV = "production";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    process.env.SQUARE_ENV = prevSquareEnv;
    process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceKey;
  });

  it("sends order emails once when paid concurrently", async () => {
    const { markOrderPaid } = await import("./orders");
    const [a, b] = await Promise.all([markOrderPaid("ord-1"), markOrderPaid("ord-1")]);
    expect(sendOrderEmails).toHaveBeenCalledTimes(1);
    expect([a.newlyPaid, b.newlyPaid].filter(Boolean)).toHaveLength(1);
    expect(a.isPaid && b.isPaid).toBe(true);
  });
});
