import { describe, expect, it } from "vitest";

import { ATLAS_DYNASTIES } from "./dynasties";
import { FRONTIER_POLICIES, getFrontierPoliciesByDynasty } from "./frontier-policies";
import type { AtlasDynastyId } from "./types";

describe("frontier policies", () => {
  it("offers two institutions for each of the four skeleton dynasties", () => {
    expect(FRONTIER_POLICIES).toHaveLength(8);
    for (const dynasty of ATLAS_DYNASTIES) {
      const policies = getFrontierPoliciesByDynasty(dynasty.id);
      expect(policies, dynasty.id).toHaveLength(2);
      for (const policy of policies) {
        expect(policy.dynastyId).toBe<AtlasDynastyId>(dynasty.id);
      }
    }
  });

  it("keeps policy ids unique", () => {
    const ids = FRONTIER_POLICIES.map((policy) => policy.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("anchors every institution at a plausible seat", () => {
    for (const policy of FRONTIER_POLICIES) {
      const [lon, lat] = policy.seat.ll;
      expect(lon, `${policy.id} lon`).toBeGreaterThan(60);
      expect(lon, `${policy.id} lon`).toBeLessThan(140);
      expect(lat, `${policy.id} lat`).toBeGreaterThan(15);
      expect(lat, `${policy.id} lat`).toBeLessThan(55);
      expect(policy.seat.name.length, policy.id).toBeGreaterThan(0);
    }
  });

  it("states regions, period and carries primary sources", () => {
    for (const policy of FRONTIER_POLICIES) {
      expect(policy.regions.length, policy.id).toBeGreaterThan(0);
      expect(policy.period, policy.id).toMatch(/\d|世纪|汉|唐|宋|元/);
      expect(policy.description.length, policy.id).toBeGreaterThan(40);
      expect(policy.sources.length, policy.id).toBeGreaterThan(0);
    }
  });
});
