import { describe, expect, it } from "vitest";

import { computeStepGlyph, STEP_GLYPH_VIEWBOX } from "./rank-step-glyph";

type Point = readonly [number, number];

function parsePoints(points: string): readonly Point[] {
  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return [x, y] as const;
  });
}

describe("computeStepGlyph", () => {
  const glyph = computeStepGlyph();

  it("keeps every vertex inside the viewBox and free of NaN", () => {
    for (const points of [glyph.front, glyph.tread, glyph.side]) {
      for (const [x, y] of parsePoints(points)) {
        expect(Number.isNaN(x)).toBe(false);
        expect(Number.isNaN(y)).toBe(false);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(STEP_GLYPH_VIEWBOX.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(STEP_GLYPH_VIEWBOX.height);
      }
    }
  });

  it("stacks the three faces so the step reads as a solid: tread above, front below", () => {
    const tread = parsePoints(glyph.tread).map((point) => point[1]);
    const front = parsePoints(glyph.front).map((point) => point[1]);
    expect(Math.min(...tread)).toBeLessThan(Math.min(...front));
    expect(Math.max(...front)).toBeGreaterThan(Math.min(...front));
  });
});
