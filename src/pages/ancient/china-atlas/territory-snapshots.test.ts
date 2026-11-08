import { describe, expect, it } from "vitest";

import { ATLAS_DYNASTIES } from "./dynasties";
import {
  getTerritorySnapshotsByDynasty,
  TERRITORY_SNAPSHOTS,
  TERRITORY_YEAR_RANGE,
} from "./territory-snapshots";
import type { AtlasDynastyId } from "./types";

describe("territory snapshots", () => {
  it("spreads at least one snapshot over each of the four skeleton dynasties", () => {
    expect(TERRITORY_SNAPSHOTS.length).toBeGreaterThanOrEqual(5);
    for (const dynasty of ATLAS_DYNASTIES) {
      const snapshots = getTerritorySnapshotsByDynasty(dynasty.id);
      expect(snapshots.length, dynasty.id).toBeGreaterThan(0);
      for (const snapshot of snapshots) {
        expect(snapshot.dynastyId).toBe<AtlasDynastyId>(dynasty.id);
      }
    }
  });

  it("keeps snapshot ids unique and years within the timeline range", () => {
    const ids = TERRITORY_SNAPSHOTS.map((snapshot) => snapshot.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const snapshot of TERRITORY_SNAPSHOTS) {
      expect(snapshot.year).toBeGreaterThanOrEqual(TERRITORY_YEAR_RANGE.min);
      expect(snapshot.year).toBeLessThanOrEqual(TERRITORY_YEAR_RANGE.max);
    }
  });

  it("anchors every snapshot at plausible places with a named capital", () => {
    for (const snapshot of TERRITORY_SNAPSHOTS) {
      expect(snapshot.anchors.length, snapshot.id).toBeGreaterThan(0);
      expect(snapshot.capital.name.length, snapshot.id).toBeGreaterThan(0);
      for (const place of [snapshot.capital, ...snapshot.anchors]) {
        const [lon, lat] = place.ll;
        expect(lon, `${snapshot.id} lon`).toBeGreaterThan(60);
        expect(lon, `${snapshot.id} lon`).toBeLessThan(140);
        expect(lat, `${snapshot.id} lat`).toBeGreaterThan(10);
        expect(lat, `${snapshot.id} lat`).toBeLessThan(55);
        expect(place.name.length, `${snapshot.id}: ${place.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("states the caveat in descriptions and keeps area figures as ranges", () => {
    for (const snapshot of TERRITORY_SNAPSHOTS) {
      expect(snapshot.description.length, snapshot.id).toBeGreaterThan(40);
      expect(snapshot.sources.length, snapshot.id).toBeGreaterThan(0);
      // 面积诸家估算不一：页面渲染时统一加「约」字前缀，允许区间或单值
      if (snapshot.areaWanKm2) {
        expect(snapshot.areaWanKm2).toMatch(/^\d/);
      }
    }
  });
});
