import { describe, expect, it } from "vitest";
import { addShopDays, isAllowedWantedOn, minWantedOnIso, nextAllowedWantedOn } from "./shop";

const fixedToday = new Date("2026-10-01T18:00:00Z"); // 1 Oct 2026 in America/Edmonton

describe("minWantedOnIso", () => {
  it("is shop date plus two calendar days including month rollover", () => {
    expect(minWantedOnIso(fixedToday)).toBe("2026-10-03");
    expect(minWantedOnIso(new Date("2026-01-30T18:00:00Z"))).toBe("2026-02-01");
    expect(minWantedOnIso(new Date("2025-12-31T18:00:00Z"))).toBe("2026-01-02");
  });

  it("uses Edmonton shop day near UTC midnight", () => {
    expect(minWantedOnIso(new Date("2026-11-06T01:00:00Z"))).toBe("2026-11-07");
  });
});

describe("isAllowedWantedOn", () => {
  it("rejects non-ISO, same day, next day, and blocked dates", () => {
    expect(isAllowedWantedOn("soon", fixedToday)).toBe(false);
    expect(isAllowedWantedOn("2026-10-01", fixedToday)).toBe(false);
    expect(isAllowedWantedOn("2026-10-02", fixedToday)).toBe(false);
    expect(isAllowedWantedOn("2026-10-03", fixedToday, ["2026-10-03"])).toBe(false);
  });

  it("accepts the minimum date when it is not blocked", () => {
    expect(isAllowedWantedOn("2026-10-03", fixedToday)).toBe(true);
  });
});

describe("nextAllowedWantedOn", () => {
  it("clamps early or invalid start to minimum and skips blocked days", () => {
    expect(nextAllowedWantedOn("2026-10-01", ["2026-10-03", "2026-10-04"], fixedToday)).toBe("2026-10-05");
    expect(nextAllowedWantedOn("bad", [], fixedToday)).toBe("2026-10-03");
  });

  it("returns minimum when every day in the scan is blocked", () => {
    const min = minWantedOnIso(fixedToday);
    const allBlocked: string[] = [];
    for (let i = 0; i < 366; i++) {
      allBlocked.push(addShopDays(min, i));
    }
    expect(nextAllowedWantedOn(min, allBlocked, fixedToday)).toBe(min);
  });
});
