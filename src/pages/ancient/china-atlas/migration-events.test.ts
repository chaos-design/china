import { describe, expect, it } from "vitest";

import { ATLAS_DYNASTIES } from "./dynasties";
import { getMigrationEventsByDynasty, MIGRATION_EVENTS } from "./migration-events";
import type { AtlasDynastyId } from "./types";

describe("migration events", () => {
  it("offers two routes for each of the four skeleton dynasties", () => {
    expect(MIGRATION_EVENTS).toHaveLength(8);
    for (const dynasty of ATLAS_DYNASTIES) {
      const events = getMigrationEventsByDynasty(dynasty.id);
      expect(events, dynasty.id).toHaveLength(2);
      for (const event of events) {
        expect(event.dynastyId).toBe<AtlasDynastyId>(dynasty.id);
      }
    }
  });

  it("keeps event ids unique", () => {
    const ids = MIGRATION_EVENTS.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every route two or more waypoints with plausible lon/lat", () => {
    for (const event of MIGRATION_EVENTS) {
      expect(event.waypoints.length, event.id).toBeGreaterThanOrEqual(2);
      for (const waypoint of event.waypoints) {
        const [lon, lat] = waypoint.ll;
        // 底图覆盖东亚及周边；撒马尔罕（约 67°E）是合法的图幅外起点
        expect(lon, `${event.id} lon`).toBeGreaterThan(60);
        expect(lon, `${event.id} lon`).toBeLessThan(140);
        expect(lat, `${event.id} lat`).toBeGreaterThan(15);
        expect(lat, `${event.id} lat`).toBeLessThan(55);
      }
    }
  });

  it("labels the first and last waypoints and names the route ends", () => {
    for (const event of MIGRATION_EVENTS) {
      expect(event.waypoints[0]?.name, event.id).toBeTruthy();
      expect(event.waypoints[event.waypoints.length - 1]?.name, event.id).toBeTruthy();
      expect(event.from.length, event.id).toBeGreaterThan(0);
      expect(event.to.length, event.id).toBeGreaterThan(0);
      expect(event.group.length, event.id).toBeGreaterThan(0);
      expect(event.period, event.id).toMatch(/\d|世纪|宋/);
    }
  });

  it("carries descriptions that state the dispute or the caveat", () => {
    for (const event of MIGRATION_EVENTS) {
      expect(event.description.length, event.id).toBeGreaterThan(40);
    }
  });

  it("attaches at least one primary source to every route", () => {
    for (const event of MIGRATION_EVENTS) {
      expect(event.sources.length, event.id).toBeGreaterThan(0);
      for (const source of event.sources) {
        expect(source.length, `${event.id}: ${source}`).toBeGreaterThan(0);
      }
    }
  });
});
