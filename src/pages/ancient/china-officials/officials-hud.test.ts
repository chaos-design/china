import { describe, expect, it } from "vitest";

import { getOfficialsDynasty } from "./officials-data";
import type { GradeProjection } from "./officials-hud";
import { layoutHudRows, postsByBranch, visiblePosts } from "./officials-hud";

const projections: GradeProjection[] = [
  { id: "top", x: 300, y: 100 },
  { id: "middle", x: 305, y: 140 },
  { id: "bottom", x: 310, y: 640 },
];

describe("layoutHudRows", () => {
  it("returns an empty list when there are no grades", () => {
    expect(layoutHudRows([], { minGap: 100, minY: 80, maxY: 700 })).toEqual([]);
  });

  it("clamps a single row into the visible band", () => {
    const [row] = layoutHudRows([{ id: "a", x: 20, y: -50 }], {
      minGap: 100,
      minY: 80,
      maxY: 700,
    });
    expect(row?.rowY).toBe(80);
  });

  it("keeps the projection order and pushes crowded rows apart", () => {
    const rows = layoutHudRows(projections, { minGap: 100, minY: 80, maxY: 700 });
    expect(rows.map((row) => row.id)).toEqual(["top", "middle", "bottom"]);
    expect(rows[1]!.rowY - rows[0]!.rowY).toBeGreaterThanOrEqual(100);
    expect(rows[2]!.rowY - rows[1]!.rowY).toBeGreaterThanOrEqual(100);
    for (const row of rows) {
      expect(row.rowY).toBeGreaterThanOrEqual(80);
      expect(row.rowY).toBeLessThanOrEqual(700);
    }
  });

  it("reduces the gap when the viewport is shorter than the grade stack", () => {
    const rows = layoutHudRows(projections, { minGap: 200, minY: 60, maxY: 260 });
    expect(rows[2]!.rowY).toBeLessThanOrEqual(260);
    expect(rows[0]!.rowY).toBeGreaterThanOrEqual(60);
    expect(rows[1]!.rowY - rows[0]!.rowY).toBeCloseTo(100);
  });

  it("never places a row outside the clamped band after shifting", () => {
    const rows = layoutHudRows(
      [
        { id: "a", x: 0, y: 690 },
        { id: "b", x: 0, y: 695 },
        { id: "c", x: 0, y: 699 },
      ],
      { minGap: 120, minY: 80, maxY: 700 },
    );
    for (const row of rows) {
      expect(row.rowY).toBeGreaterThanOrEqual(80);
      expect(row.rowY).toBeLessThanOrEqual(700);
    }
    expect(rows[2]!.rowY - rows[0]!.rowY).toBeGreaterThanOrEqual(120);
  });
});

describe("名录分组", () => {
  const qin = getOfficialsDynasty("qin")!;
  const firstGrade = qin.grades[0]!;

  it("shows every post with the 全部 filter", () => {
    expect(visiblePosts(firstGrade, "all")).toHaveLength(firstGrade.posts.length);
  });

  it("splits the roster into 文官 / 武官", () => {
    const grouped = postsByBranch(firstGrade, "all");
    expect(grouped.civil.map((post) => post.title)).toEqual(["丞相", "御史大夫"]);
    expect(grouped.military.map((post) => post.title)).toEqual(["太尉", "国尉"]);
    expect(postsByBranch(firstGrade, "military").civil).toHaveLength(0);
    expect(postsByBranch(firstGrade, "civil").military).toHaveLength(0);
  });
});
