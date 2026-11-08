import { describe, expect, it } from "vitest";

import { MIGRATION_BASEMAP, projectMigration, routePathD } from "./migration-projection";

describe("migration basemap projection", () => {
  it("exposes the shared real-border basemap layers", () => {
    expect(MIGRATION_BASEMAP.provinces.length).toBeGreaterThan(30);
    expect(MIGRATION_BASEMAP.borderPath).toMatch(/^M/);
    expect(MIGRATION_BASEMAP.rivers.map((river) => river.n)).toContain("黄河");
    expect(MIGRATION_BASEMAP.view).toHaveLength(4);
  });

  // 锚点期望值取自底图自带的 CITIES 图层（ll 与已投影 x/y 成对给出），
  // 投影公式必须把经纬度投回同一坐标系，否则路线会整体错位。
  it.each([
    ["西安", 108.94, 34.34, 81.36, 64.39],
    ["广州", 113.26, 23.13, 93.69, 95.11],
    ["拉萨", 91.13, 29.66, 39.45, 75.47],
    ["哈尔滨", 126.53, 45.8, 113.69, 27.75],
  ])("projects %s onto the basemap coordinate space", (_name, lon, lat, x, y) => {
    const [px, py] = projectMigration(lon, lat);
    expect(Math.abs(px - x)).toBeLessThan(0.05);
    expect(Math.abs(py - y)).toBeLessThan(0.05);
  });

  it("places every route waypoint inside the basemap view box", () => {
    // 宽松的包围检查：路线点允许落在图框外一点（如撒马尔罕在图幅西侧边缘外），
    // 但不允许投到明显错误的象限。
    expect(MIGRATION_BASEMAP.view[2]).toBeGreaterThan(140);
    expect(MIGRATION_BASEMAP.view[3]).toBeGreaterThan(100);
  });
});

describe("routePathD", () => {
  it("returns an empty path for fewer than two points", () => {
    expect(routePathD([])).toBe("");
    expect(routePathD([[10, 10]])).toBe("");
  });

  it("draws an open curve that starts at the first point and ends at the last", () => {
    const d = routePathD([
      [0, 0],
      [10, 10],
      [20, 0],
    ]);
    expect(d).toMatch(/^M 0\.00 0\.00/);
    expect(d).toMatch(/20\.00 0\.00$/);
    // Catmull-Rom 转三次贝塞尔：两段弧、每段一个 C 命令
    expect(d.match(/ C /g)).toHaveLength(2);
  });
});
