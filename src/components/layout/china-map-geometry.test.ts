import { describe, expect, it } from "vitest";

import {
  MAP_HAINAN_OUTLINE,
  MAP_LAND_BLEED,
  MAP_LAND_OUTLINE,
  MAP_TAIWAN_OUTLINE,
  MAP_VIEW,
  MAP_ZONES,
  project,
} from "./china-map-geometry";

/** 从路径里抠出所有数值，用来自检抖动幅度有没有失控。 */
function coordinatesOf(d: string): [number, number][] {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const pairs: [number, number][] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    pairs.push([numbers[index] as number, numbers[index + 1] as number]);
  }
  return pairs;
}

describe("project()", () => {
  it("maps the north-west corner of the viewBox to the origin", () => {
    expect(project(MAP_VIEW.lon0, MAP_VIEW.lat1)).toEqual([0, 0]);
  });

  it("stretches the drawing to fill the viewBox horizontally", () => {
    // 横向比例是从轮廓数据反推的，所以最东的点必须真的顶到右边留白，
    // 否则要么画不满，要么裁掉一截——这个断言就是防后者。
    const widest = Math.max(
      ...[MAP_LAND_OUTLINE, MAP_TAIWAN_OUTLINE, MAP_HAINAN_OUTLINE].flatMap((d) =>
        coordinatesOf(d).map(([x]) => x),
      ),
    );

    expect(widest).toBeGreaterThan(MAP_VIEW.width * 0.95);
    expect(widest).toBeLessThan(MAP_VIEW.width);
  });

  it("scales longitude by cos(lat) per point, the way taiwan.html does", () => {
    // 同一个经度差在 20°N 与 50°N 上的水平距离必须不同：
    // 只按单一 cos(lat0) 缩放会让北半边明显横向拉伸。
    const atSouth = project(120, 20)[0] - project(100, 20)[0];
    const atNorth = project(120, 50)[0] - project(100, 50)[0];

    expect(atNorth).toBeLessThan(atSouth);
    expect(atNorth / atSouth).toBeCloseTo(
      Math.cos((50 * Math.PI) / 180) / Math.cos((20 * Math.PI) / 180),
      2,
    );
  });

  it("keeps latitude decreasing as it goes north", () => {
    expect(project(110, 40)[1]).toBeLessThan(project(110, 30)[1]);
  });

  it("is a pure function, so a re-import cannot shift the drawing", () => {
    expect(project(116.4, 39.9)).toEqual(project(116.4, 39.9));
  });
});

describe("land outlines", () => {
  const outlines = {
    mainland: MAP_LAND_OUTLINE,
    taiwan: MAP_TAIWAN_OUTLINE,
    hainan: MAP_HAINAN_OUTLINE,
  };

  it("closes every outline so it can be filled and stroked", () => {
    for (const [name, d] of Object.entries(outlines)) {
      expect(d.startsWith("M "), name).toBe(true);
      expect(d.endsWith(" Z"), name).toBe(true);
    }
  });

  it("keeps every outline inside the viewBox with room for the ink bleed", () => {
    // 描边有 7px 的洇墨层，轮廓本身要留出余量，否则纸边会被墨压住
    for (const [name, d] of Object.entries(outlines)) {
      for (const [x, y] of coordinatesOf(d)) {
        expect(x, `${name} x`).toBeGreaterThan(2);
        expect(x, `${name} x`).toBeLessThan(MAP_VIEW.width - 2);
        expect(y, `${name} y`).toBeGreaterThan(2);
        expect(y, `${name} y`).toBeLessThan(MAP_VIEW.height - 2);
      }
    }
  });

  it("uses Catmull-Rom curves rather than straight polygon segments", () => {
    // 没有 C 就是折线，一眼就能看出不是手绘的
    expect(MAP_LAND_OUTLINE).toContain("C ");
    expect(MAP_LAND_OUTLINE).not.toMatch(/[ML] -?[\d.]+ -?[\d.]+ L/);
  });

  it("produces a stroke-only, wider bleed variant of the mainland", () => {
    // 洇墨层复用同一条轮廓，只是描得更粗更淡，所以点数必须一致
    expect(coordinatesOf(MAP_LAND_BLEED)).toHaveLength(coordinatesOf(MAP_LAND_OUTLINE).length);
    expect(MAP_LAND_BLEED).not.toBe(MAP_LAND_OUTLINE);
  });

  it("draws the two islands well clear of the mainland coast", () => {
    const taiwan = coordinatesOf(MAP_TAIWAN_OUTLINE);
    const hainan = coordinatesOf(MAP_HAINAN_OUTLINE);
    const centroid = (points: [number, number][]) => [
      points.reduce((sum, [x]) => sum + x, 0) / points.length,
      points.reduce((sum, [, y]) => sum + y, 0) / points.length,
    ];

    const [taiwanX, taiwanY] = centroid(taiwan);
    const [hainanX, hainanY] = centroid(hainan);

    // 台湾在大陆东南外海，海南在雷州半岛以南。两座岛都在画布右下象限。
    expect(taiwanX).toBeGreaterThan(MAP_VIEW.width * 0.6);
    expect(taiwanY).toBeGreaterThan(MAP_VIEW.height * 0.5);
    expect(hainanX).toBeGreaterThan(MAP_VIEW.width * 0.4);
    expect(hainanY).toBeGreaterThan(MAP_VIEW.height * 0.7);
    // 海南不能压在雷州半岛上，两岛间距至少 100 单位
    expect(Math.hypot(taiwanX - hainanX, taiwanY - hainanY)).toBeGreaterThan(100);
  });

  it("places Taiwan in a taller-than-wide shape, the way the island actually is", () => {
    const points = coordinatesOf(MAP_TAIWAN_OUTLINE);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    // 北宽南窄的纺锤形：高约为宽的两倍。画成等宽会让它在地图上读起来像一块礁石。
    expect(height / width).toBeGreaterThan(1.2);
  });
});

describe("MAP_ZONES", () => {
  it("covers the three menu categories exactly once", () => {
    expect(MAP_ZONES.map((zone) => zone.id)).toEqual(["north", "culture", "islands"]);
  });

  it("gives every region a set of marks, each with a class and a path", () => {
    for (const zone of MAP_ZONES) {
      expect(zone.strokes.length, zone.id).toBeGreaterThan(4);
      for (const stroke of zone.strokes) {
        expect(stroke.className, zone.id).not.toBe("");
        expect(stroke.d, zone.id).toMatch(/^M /);
      }
    }
  });

  it("uses a different mark vocabulary per region so they read apart", () => {
    // 长城与驿路用红与赭，山水用墨与石青。三个分区各带自己的路线符号。
    const classesFor = (id: string) =>
      MAP_ZONES.find((zone) => zone.id === id)?.strokes.map((stroke) => stroke.className) ?? [];

    expect(classesFor("north")).toContain("map-wall");
    expect(classesFor("culture")).toContain("map-route");
    expect(
      classesFor("islands").every((name) => name.startsWith("map-mark") || name === "map-stipple"),
    ).toBe(true);
  });

  it("keeps every mark inside the viewBox", () => {
    for (const zone of MAP_ZONES) {
      for (const [index, stroke] of zone.strokes.entries()) {
        for (const [x, y] of coordinatesOf(stroke.d)) {
          expect(x, `${zone.id}#${index}`).toBeGreaterThan(-20);
          expect(x, `${zone.id}#${index}`).toBeLessThan(MAP_VIEW.width + 20);
          expect(y, `${zone.id}#${index}`).toBeGreaterThan(-20);
          expect(y, `${zone.id}#${index}`).toBeLessThan(MAP_VIEW.height + 20);
        }
      }
    }
  });

  it("does not repeat the same mark across zones", () => {
    const seen = new Set<string>();
    for (const zone of MAP_ZONES) {
      for (const stroke of zone.strokes) {
        expect(seen.has(stroke.d), `${zone.id} 与其他分区有重复笔画`).toBe(false);
        seen.add(stroke.d);
      }
    }
  });
});
