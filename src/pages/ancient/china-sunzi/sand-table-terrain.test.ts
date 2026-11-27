import { describe, expect, it } from "vitest";

import {
  boardToWorld,
  facingAngle,
  pointInPolygon,
  sideFacingAngle,
  surfaceHeight,
  terrainHeight,
  terrainInk,
} from "./sand-table-terrain";

describe("沙盘地形数学", () => {
  it("棋盘中心映射到世界原点，四周对称", () => {
    expect(boardToWorld([500, 320])).toEqual({ x: 0, z: 0 });
    expect(boardToWorld([1000, 320]).x).toBeCloseTo(20);
    expect(boardToWorld([0, 320]).x).toBeCloseTo(-20);
  });

  it("高度场有山脊与谷地的层次，且铺到网格后不穿透控区", () => {
    expect(terrainHeight(0, -6.4)).toBeGreaterThan(terrainHeight(0, 0));
    expect(terrainHeight(0, 0)).toBeLessThan(terrainHeight(0, 8.2));
    expect(surfaceHeight(4, -6)).toBeCloseTo(terrainHeight(4, -6) * 0.48 + 0.34);
    expect(terrainInk(-1)).toBeGreaterThanOrEqual(0);
    expect(terrainInk(9)).toBeLessThanOrEqual(1);
  });

  it("射线法判定控区内外", () => {
    // 查询点是世界坐标，多边形顶点是棋盘坐标（棋盘中心 500,320）。
    const square = [
      [400, 280],
      [600, 280],
      [600, 360],
      [400, 360],
    ] as const;
    expect(pointInPolygon(0, 0, square)).toBe(true);
    expect(pointInPolygon(5, 0, square)).toBe(false);
    expect(pointInPolygon(0, 2, square)).toBe(false);
  });

  it("朝向取目标方向，缺省按阵营面向对手", () => {
    expect(facingAngle([0, 0], [0, 10])).toBeCloseTo(0);
    expect(facingAngle([0, 0], [10, 0])).toBeCloseTo(Math.PI / 2);
    expect(sideFacingAngle("a")).toBeCloseTo(Math.PI / 2);
    expect(sideFacingAngle("b")).toBeCloseTo(-Math.PI / 2);
  });
});
