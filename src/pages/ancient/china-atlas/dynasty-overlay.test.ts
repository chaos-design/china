import { describe, expect, it } from "vitest";
import { ATLAS_ITEMS, ATLAS_VIEW } from "./atlas-items";
import {
  convexHull,
  dynastyCitySummary,
  getDynastyOutline,
  type MapPoint,
  placeDynastyCityLabels,
  projectDynastyCities,
} from "./dynasty-overlay";
import { DYNASTY_TERRITORIES, getDynastyTerritory } from "./dynasty-territories";
import type { AtlasDynastyId } from "./types";

describe("dynasty-territories 朝代断面数据", () => {
  it("汉唐宋元四朝各有一座都城、代表性城市与史料出处", () => {
    expect(DYNASTY_TERRITORIES.map((entry) => entry.id)).toEqual(["han", "tang", "song", "yuan"]);
    for (const entry of DYNASTY_TERRITORIES) {
      expect(entry.sources.length).toBeGreaterThan(0);
      expect(entry.note).toContain("不是边界");
      expect(entry.cities.filter((city) => city.role === "capital")).toHaveLength(1);
      expect(entry.cities.find((city) => city.role === "capital")?.name).toBe(entry.capital);
      expect(dynastyCitySummary(entry)).toContain(entry.capital);
      for (const city of entry.cities) {
        expect(city.ll[0]).toBeGreaterThan(70);
        expect(city.ll[1]).toBeGreaterThan(10);
      }
    }
  });

  it("按 id 取断面，未知 id 直接抛错", () => {
    expect(getDynastyTerritory("tang").capital).toBe("长安");
    expect(() => getDynastyTerritory("qing" as AtlasDynastyId)).toThrow(/未知的朝代断面/);
  });
});

describe("dynasty-overlay 几何与标注", () => {
  it("凸包去掉重复点与共线点，边界按 x 有序", () => {
    const points: MapPoint[] = [
      [0, 0],
      [1, 1],
      [2, 2],
      [2, 0],
      [0, 2],
      [1, 1],
    ];
    const hull = convexHull(points);
    expect(hull).toHaveLength(4);
    expect(hull).toEqual(
      expect.arrayContaining([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ]),
    );
    expect(new Set(hull.map((point) => point.join(","))).size).toBe(hull.length);
    expect(convexHull([[1, 1]])).toEqual([[1, 1]]);
    expect(convexHull([])).toEqual([]);
  });

  it("示意范围是平滑闭合的手绘曲线，边界包住全部城市锚点", () => {
    for (const territory of DYNASTY_TERRITORIES) {
      const outline = getDynastyOutline(territory);
      expect(outline.d.startsWith("M ")).toBe(true);
      expect(outline.d).toContain(" C ");
      expect(outline.d.endsWith(" Z")).toBe(true);
      expect(outline.points.length).toBeGreaterThan(2);
      for (const city of projectDynastyCities(territory)) {
        expect(city.point[0]).toBeGreaterThanOrEqual(outline.bounds.x0 - 0.01);
        expect(city.point[0]).toBeLessThanOrEqual(outline.bounds.x1 + 0.01);
        expect(city.point[1]).toBeGreaterThanOrEqual(outline.bounds.y0 - 0.01);
        expect(city.point[1]).toBeLessThanOrEqual(outline.bounds.y1 + 0.01);
      }
    }
  });

  it("同一朝代的示意边界完全确定：两次计算逐字节相同", () => {
    for (const territory of DYNASTY_TERRITORIES) {
      const first = getDynastyOutline(territory);
      const second = getDynastyOutline(territory);
      expect(second.d).toBe(first.d);
      expect(second.bounds).toEqual(first.bounds);
    }
  });

  it("城市名一城一标、都城单列、彼此不重叠且不越出图幅", () => {
    for (const territory of DYNASTY_TERRITORIES) {
      const labels = placeDynastyCityLabels(
        territory,
        ATLAS_ITEMS.map((item) => item.id),
      );
      expect(labels).toHaveLength(territory.cities.length);
      expect(labels.filter((label) => label.role === "capital")).toHaveLength(1);
      expect(labels.find((label) => label.role === "capital")?.text).toContain("都城");

      for (const label of labels) {
        expect(label.x - label.width / 2).toBeGreaterThanOrEqual(ATLAS_VIEW.x - 12);
        expect(label.x + label.width / 2).toBeLessThanOrEqual(ATLAS_VIEW.x + ATLAS_VIEW.width + 12);
        expect(label.leader.x1).toBeTypeOf("number");
        expect(label.leader.y2).toBeTypeOf("number");
      }
      for (let first = 0; first < labels.length; first += 1) {
        for (let second = first + 1; second < labels.length; second += 1) {
          const a = labels[first]!;
          const b = labels[second]!;
          const overlapX =
            Math.min(a.x + a.width / 2, b.x + b.width / 2) -
            Math.max(a.x - a.width / 2, b.x - b.width / 2);
          const overlapY =
            Math.min(a.y + a.height / 2, b.y + b.height / 2) -
            Math.max(a.y - a.height / 2, b.y - b.height / 2);
          expect(overlapX <= 0 || overlapY <= 0).toBe(true);
        }
      }
    }
  });

  it("没有可见条目时也能排布（不依赖条目标签避让）", () => {
    const labels = placeDynastyCityLabels(getDynastyTerritory("song"), []);
    expect(labels).toHaveLength(getDynastyTerritory("song").cities.length);
  });
});
