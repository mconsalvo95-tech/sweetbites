import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows under the limit", () => {
    expect(rateLimit("under", 3, 60_000)).toBe(true);
    expect(rateLimit("under", 3, 60_000)).toBe(true);
    expect(rateLimit("under", 3, 60_000)).toBe(true);
  });

  it("rejects over the limit", () => {
    expect(rateLimit("over", 2, 60_000)).toBe(true);
    expect(rateLimit("over", 2, 60_000)).toBe(true);
    expect(rateLimit("over", 2, 60_000)).toBe(false);
  });

  it("does not count timestamps outside the window", () => {
    expect(rateLimit("window", 1, 60_000)).toBe(true);
    vi.advanceTimersByTime(61_000);
    expect(rateLimit("window", 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip, else last x-forwarded-for hop", () => {
    const real = new Request("http://localhost", {
      headers: { "x-real-ip": " 203.0.113.1 ", "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(clientIp(real)).toBe("203.0.113.1");

    const forwarded = new Request("http://localhost", {
      headers: { "x-forwarded-for": "client, proxy, 198.51.100.9" },
    });
    expect(clientIp(forwarded)).toBe("198.51.100.9");

    expect(clientIp(new Request("http://localhost"))).toBe("local");
  });
});
