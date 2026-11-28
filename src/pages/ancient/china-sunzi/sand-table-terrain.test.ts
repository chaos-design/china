import { describe, expect, it } from "vitest";

import {
  boardToWorld,
  contourSegmentsAt,
  facingAngle,
  pointInPolygon,
  sampleContourGrid,
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
    expect(surfaceHeight(4, -6)).toBeCloseTo(terrainHeight(4, -6) * 0.6 + 0.3);
    expect(surfaceHeight(0, 0)).toBeGreaterThan(-0.03);
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

describe("沙盘等高线", () => {
  it("山脊与谷地之间的高度能抽出等值线段，端点贴在采样网格上", () => {
    const grid = sampleContourGrid(64, 42);
    const segments = contourSegmentsAt(grid, surfaceHeight(0, 0));
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length % 4).toBe(0);
    const { dx, dz } = grid;
    for (let index = 0; index < segments.length; index += 4) {
      const x1 = segments[index];
      const z1 = segments[index + 1];
      const x2 = segments[index + 2];
      const z2 = segments[index + 3];
      expect(Math.abs(x1 - x2)).toBeLessThanOrEqual(dx + 1e-6);
      expect(Math.abs(z1 - z2)).toBeLessThanOrEqual(dz + 1e-6);
      expect(x1).toBeGreaterThanOrEqual(-21 - 1e-6);
      expect(x1).toBeLessThanOrEqual(21 + 1e-6);
    }
  });

  it("极高与极低高度抽不出任何线段，同输入两次结果一致", () => {
    const grid = sampleContourGrid(48, 32);
    expect(contourSegmentsAt(grid, 99)).toHaveLength(0);
    expect(contourSegmentsAt(grid, -99)).toHaveLength(0);
    const first = contourSegmentsAt(grid, 0.5);
    const second = contourSegmentsAt(grid, 0.5);
    expect(first).toEqual(second);
  });
});
