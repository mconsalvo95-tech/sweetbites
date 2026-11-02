import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORDER_CALENDAR,
  formatBlockedRangeSummary,
  groupBlockedDatesIntoRanges,
  isoDatesInRange,
  isBlockedOrderDate,
  mergeBlockedDates,
  normalizeOrderCalendarBody,
} from "./order-calendar";

describe("normalizeOrderCalendarBody", () => {
  it("returns empty list for null, non-objects, and non-array blocked_dates", () => {
    expect(normalizeOrderCalendarBody(null)).toEqual(DEFAULT_ORDER_CALENDAR);
    expect(normalizeOrderCalendarBody("x")).toEqual(DEFAULT_ORDER_CALENDAR);
    expect(normalizeOrderCalendarBody({ blocked_dates: "nope" })).toEqual(DEFAULT_ORDER_CALENDAR);
  });

  it("keeps YYYY-MM-DD strings, drops junk, sorts, and dedupes", () => {
    expect(
      normalizeOrderCalendarBody({
        blocked_dates: ["2026-12-24", "bad", "2026-12-24", "2026-12-01"],
      }),
    ).toEqual({ blocked_dates: ["2026-12-01", "2026-12-24"] });
  });
});

describe("isoDatesInRange", () => {
  it("is inclusive and crosses a month boundary", () => {
    expect(isoDatesInRange("2026-01-30", "2026-02-02")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });

  it("returns empty when reversed or malformed", () => {
    expect(isoDatesInRange("2026-02-02", "2026-01-30")).toEqual([]);
    expect(isoDatesInRange("2026-13-01", "2026-02-01")).toEqual([]);
  });

  it("stops at 366 days on a longer span", () => {
    expect(isoDatesInRange("2024-01-01", "2025-01-01")).toHaveLength(366);
  });
});

describe("mergeBlockedDates", () => {
  it("unions, sorts, dedupes, and drops invalid additions only", () => {
    expect(mergeBlockedDates(["2026-12-24", "not-a-date"], ["2026-12-26", "2026-12-24", "nope"])).toEqual([
      "2026-12-24",
      "2026-12-26",
      "not-a-date",
    ]);
  });
});

describe("groupBlockedDatesIntoRanges", () => {
  it("merges consecutive days and splits on a gap", () => {
    const ranges = groupBlockedDatesIntoRanges(["2026-11-05", "2026-11-06", "2026-11-08"]);
    expect(ranges).toHaveLength(2);
    expect(ranges[0]).toEqual({
      from: "2026-11-05",
      to: "2026-11-06",
      dates: ["2026-11-05", "2026-11-06"],
    });
    expect(ranges[1].from).toBe("2026-11-08");
  });

  it("treats a month-boundary pair as one range and ignores dupes", () => {
    const ranges = groupBlockedDatesIntoRanges(["2026-01-31", "2026-01-31", "2026-02-01"]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].dates).toEqual(["2026-01-31", "2026-02-01"]);
  });
});

describe("isBlockedOrderDate", () => {
  it("is true only for an exact listed day", () => {
    const blocked = ["2026-12-24"];
    expect(isBlockedOrderDate("2026-12-24", blocked)).toBe(true);
    expect(isBlockedOrderDate("2026-12-25", blocked)).toBe(false);
  });
});

describe("formatBlockedRangeSummary", () => {
  it("uses a single formatted date for one day", () => {
    const one = formatBlockedRangeSummary({ from: "2026-12-24", to: "2026-12-24", dates: ["2026-12-24"] }, "en");
    expect(one).not.toContain(" – ");
    expect(one).toMatch(/2026/);
  });

  it("joins multi-day ranges with an en dash and differs by locale", () => {
    const range = { from: "2026-12-26", to: "2026-12-27", dates: ["2026-12-26", "2026-12-27"] };
    const en = formatBlockedRangeSummary(range, "en");
    const es = formatBlockedRangeSummary(range, "es");
    expect(en).toContain(" – ");
    expect(es).toContain(" – ");
    expect(en).not.toBe(es);
  });
});
