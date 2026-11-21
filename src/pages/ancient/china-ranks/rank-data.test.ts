import { describe, expect, it } from "vitest";

import { getRankDynasty, RANK_DYNASTIES, RANK_TRACKS } from "./rank-data";
import type { RankBand, RankLevel, RankOffice } from "./types";

const EXPECTED_ORDER: readonly string[] = [
  "qin",
  "han",
  "weijin",
  "suitang",
  "song",
  "yuan",
  "ming",
  "qing",
];

function resolvableBand(level: RankLevel, office: RankOffice): RankBand | null {
  if (office.band !== undefined) {
    return office.band;
  }
  if (level.outOfRank === true) {
    return null;
  }
  return level.approxGrade ?? null;
}

function levelMinBand(level: RankLevel): RankBand | null {
  const bands = level.offices
    .map((office) => resolvableBand(level, office))
    .filter((band): band is RankBand => band !== null);
  if (bands.length > 0) {
    return Math.min(...bands) as RankBand;
  }
  return level.outOfRank === true ? null : (level.approxGrade ?? null);
}

describe("rank ladder data", () => {
  it("keeps the eight dynasties in the agreed historical order", () => {
    expect(RANK_DYNASTIES.map((dynasty) => dynasty.id)).toEqual(EXPECTED_ORDER);
  });

  it("gives every dynasty a period, system note and source", () => {
    for (const dynasty of RANK_DYNASTIES) {
      expect(dynasty.period).toMatch(/前\d+|\d{3,4}/);
      expect(dynasty.systemNote.length).toBeGreaterThan(12);
      expect(dynasty.system.length).toBeGreaterThan(2);
      expect(dynasty.source.length).toBeGreaterThan(4);
      expect(dynasty.levels.length).toBeGreaterThanOrEqual(5);
      expect(dynasty.levels.length).toBeLessThanOrEqual(8);
    }
  });

  it("resolves a rank band for every office outside 流外 levels", () => {
    for (const dynasty of RANK_DYNASTIES) {
      for (const level of dynasty.levels) {
        for (const office of level.offices) {
          if (level.outOfRank === true) {
            continue;
          }
          expect(resolvableBand(level, office)).not.toBeNull();
        }
      }
    }
  });

  it("orders levels from the highest band down", () => {
    for (const dynasty of RANK_DYNASTIES) {
      const bands = dynasty.levels
        .map((level) => levelMinBand(level))
        .filter((band): band is RankBand => band !== null);
      for (let index = 1; index < bands.length; index += 1) {
        expect(bands[index]).toBeGreaterThanOrEqual(bands[index - 1]);
      }
    }
  });

  it("keeps offices compact and fully described", () => {
    for (const dynasty of RANK_DYNASTIES) {
      for (const level of dynasty.levels) {
        expect(level.grade.length).toBeGreaterThan(0);
        expect(level.offices.length).toBeGreaterThanOrEqual(1);
        expect(level.offices.length).toBeLessThanOrEqual(4);
        if (level.outOfRank === true) {
          expect(level.approxGrade).toBeUndefined();
        }

        for (const office of level.offices) {
          expect(office.title.length).toBeGreaterThan(0);
          expect(office.duty.length).toBeGreaterThan(8);
          expect(office.rank.length).toBeGreaterThan(0);
          expect(["civil", "military"]).toContain(office.branch);
          if (office.band !== undefined) {
            expect(office.band).toBeGreaterThanOrEqual(1);
            expect(office.band).toBeLessThanOrEqual(9);
          }
          if (office.salary !== undefined) {
            expect(office.salary.length).toBeGreaterThan(4);
          }
          if (office.note !== undefined) {
            expect(office.note.length).toBeGreaterThan(4);
          }
          if (office.modern !== undefined) {
            expect(office.modern.length).toBeGreaterThan(4);
          }
        }
      }
    }
  });

  it("uses the approximate mapping only where 品 did not exist yet", () => {
    for (const dynasty of RANK_DYNASTIES) {
      for (const level of dynasty.levels) {
        if (level.approxGrade !== undefined) {
          expect(["qin", "han"]).toContain(dynasty.id);
        }
      }
    }
  });

  it("looks dynasties up by id", () => {
    expect(getRankDynasty("ming")?.name).toBe("明");
    expect(getRankDynasty("xia")).toBeUndefined();
  });
});

describe("office tracks", () => {
  it("runs six tracks with unique ids", () => {
    expect(RANK_TRACKS).toHaveLength(6);
    const ids = RANK_TRACKS.map((track) => track.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("aligns every track stop with the dynasty order", () => {
    for (const track of RANK_TRACKS) {
      expect(track.name.length).toBeGreaterThan(2);
      expect(track.blurb.length).toBeGreaterThan(6);
      expect(track.stops).toHaveLength(RANK_DYNASTIES.length);

      track.stops.forEach((stop, index) => {
        expect(stop.dynastyId).toBe(RANK_DYNASTIES[index]?.id);
        expect(stop.title.length).toBeGreaterThan(0);
        expect(stop.rank.length).toBeGreaterThan(0);
        expect(stop.power.length).toBeGreaterThan(8);
      });
    }
  });
});
