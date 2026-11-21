import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchSilverPriceCnyPerGram,
  salaryToTaels,
  silverTaelsToCny,
  TROY_OUNCE_GRAMS,
} from "./silver-value";

function fakeResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

describe("silver-value", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("combines the free XAG quote and USD/CNY rate into a per-gram price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("gold-api")
          ? fakeResponse({ price: TROY_OUNCE_GRAMS, updatedAt: "2026-11-21T05:00:00Z" })
          : fakeResponse({ rates: { CNY: 7 } }),
      ),
    );

    const result = await fetchSilverPriceCnyPerGram();
    expect(result?.cnyPerGram).toBe(7);
    expect(result?.usdCnyRate).toBe(7);
    expect(result?.updatedAt).toBe("2026-11-21T05:00:00Z");
  });

  it("falls back to null when the live quote is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("offline");
      }),
    );
    expect(await fetchSilverPriceCnyPerGram()).toBeNull();
  });

  it("uses explicit taels when present and scales other dynasties by rank index", () => {
    expect(salaryToTaels(100, "180 两")).toEqual({ taels: 180, exact: true });
    expect(salaryToTaels(82)).toEqual({ taels: 147.6, exact: false });
    expect(silverTaelsToCny(180, 9.25)).toBe(62106);
  });
});
