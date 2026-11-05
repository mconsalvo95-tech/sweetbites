import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit";

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
