import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HOME_ENTRANCE_STORAGE_KEY,
  HOME_ENTRANCE_TTL_MS,
  hasFreshHomeEntranceMark,
  markHomeEntranceShown,
} from "./home-entrance-storage";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("home entrance storage", () => {
  it("reports no fresh mark when nothing was stored", () => {
    expect(hasFreshHomeEntranceMark()).toBe(false);
  });

  it("treats a mark inside the 7-day window as fresh", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, String(now - HOME_ENTRANCE_TTL_MS + 1000));

    expect(hasFreshHomeEntranceMark()).toBe(true);
  });

  it("treats a mark at exactly the 7-day boundary as stale", () => {
    const now = Date.now();
    localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, String(now - HOME_ENTRANCE_TTL_MS));

    expect(hasFreshHomeEntranceMark(now)).toBe(false);
  });

  it("treats a stale mark older than 7 days as expired", () => {
    const now = Date.now();
    localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, String(now - HOME_ENTRANCE_TTL_MS - 60_000));

    expect(hasFreshHomeEntranceMark(now)).toBe(false);
  });

  it("treats a future timestamp as not yet shown", () => {
    const now = Date.now();
    localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, String(now + 60_000));

    expect(hasFreshHomeEntranceMark(now)).toBe(false);
  });

  it("treats malformed values as expired", () => {
    localStorage.setItem(HOME_ENTRANCE_STORAGE_KEY, "true");

    expect(hasFreshHomeEntranceMark()).toBe(false);
  });

  it("writes a millisecond timestamp when marked", () => {
    const before = Date.now();
    markHomeEntranceShown();
    const stored = Number(localStorage.getItem(HOME_ENTRANCE_STORAGE_KEY));

    expect(stored).toBeGreaterThanOrEqual(before);
    expect(stored).toBeLessThanOrEqual(Date.now());
    expect(hasFreshHomeEntranceMark()).toBe(true);
  });
});
