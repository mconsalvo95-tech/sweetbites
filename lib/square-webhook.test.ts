import { describe, expect, it } from "vitest";
import { POST } from "../app/api/square/webhook/route";

describe("square webhook POST", () => {
  it("returns 401 when signature key is missing", async () => {
    const prev = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    try {
      const body = JSON.stringify({
        type: "payment.updated",
        data: {
          object: {
            payment: { status: "COMPLETED", note: "11111111-1111-1111-1111-111111111111", id: "pay_1" },
          },
        },
      });
      const req = new Request("http://localhost/api/square/webhook", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req as Parameters<typeof POST>[0]);
      expect(res.status).toBe(401);
    } finally {
      if (prev !== undefined) process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = prev;
      else delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    }
  });
});
