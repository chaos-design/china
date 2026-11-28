import { describe, expect, it } from "vitest";

import { centroid, polygonPath, routePath, smoothPath } from "./board-geometry";

describe("sand table geometry", () => {
  it("draws a closed polygon and returns nothing for an empty region", () => {
    expect(polygonPath([])).toBe("");
    expect(polygonPath([[10, 20]])).toBe("M10 20 Z");
    expect(
      polygonPath([
        [0, 0],
        [100, 0],
        [100, 60],
      ]),
    ).toBe("M0 0 L100 0 L100 60 Z");
  });

  it("bows a route perpendicular to the segment", () => {
    expect(routePath([100, 100], [300, 100])).toBe("M100 100 Q200.0 132.0 300 100");
    expect(routePath([100, 100], [100, 300], 0)).toBe("M100 100 Q100.0 200.0 100 300");
  });

  it("smooths rivers through midpoint quadratics", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([[5, 6]])).toBe("M5 6");
    expect(
      smoothPath([
        [0, 0],
        [10, 10],
      ]),
    ).toBe("M0 0 L10 10");
    expect(
      smoothPath([
        [0, 0],
        [10, 10],
        [20, 0],
        [30, 5],
      ]),
    ).toBe("M0 0 Q10 10 15 5 Q20 0 25 2.5 L30 5");
  });

  it("centres a label inside the region", () => {
    expect(centroid([])).toEqual([0, 0]);
    expect(
      centroid([
        [0, 0],
        [100, 0],
        [100, 60],
        [0, 60],
      ]),
    ).toEqual([50, 30]);
  });
});
