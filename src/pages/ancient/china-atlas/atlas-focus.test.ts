import { describe, expect, it } from "vitest";
import { getAtlasFocus, regionOfPoints, ZOOM_MAX } from "./atlas-focus";
import { ATLAS_ITEMS, ATLAS_VIEW } from "./atlas-items";

const item = (id: string) => {
  const found = ATLAS_ITEMS.find((entry) => entry.id === id);
  if (!found) throw new Error(`缺少条目 ${id}`);
  return found;
};

const parseBox = (box: string) => box.split(" ").map(Number);

describe("regionOfPoints", () => {
  it("空点集返回 null，普通点集给出四至", () => {
    expect(regionOfPoints([])).toBeNull();
    expect(
      regionOfPoints([
        [4, 9],
        [-2, 1],
        [7, 3],
      ]),
    ).toEqual({ x0: -2, x1: 7, y0: 1, y1: 9 });
  });
});

describe("getAtlasFocus 局部放大", () => {
  it("全览是 ATLAS_VIEW 对应的视野，倍率为 1", () => {
    const focus = getAtlasFocus();
    expect(focus.focused).toBe(false);
    expect(focus.zoom).toBe(1);
    expect(focus.box).toBe(ATLAS_VIEW.box);
    expect(focus.cx).toBeCloseTo(ATLAS_VIEW.x + ATLAS_VIEW.width / 2, 1);
    expect(focus.cy).toBeCloseTo(ATLAS_VIEW.y + ATLAS_VIEW.height / 2, 1);
  });

  it("焦点中心恒等于 viewBox 中心（也就是可视区中心）", () => {
    const frontier = item("frontier:han-xiyu-duhu");
    const region = regionOfPoints(frontier.points.map((point) => point.point));
    for (const ratio of [1.32, 2.2, 2.8]) {
      const focus = getAtlasFocus({ maxZoom: 2.2, ratio, region });
      const [x, y, width, height] = parseBox(focus.box);
      expect(focus.cx).toBeCloseTo(x + width! / 2, 1);
      expect(focus.cy).toBeCloseTo(y + height! / 2, 1);
      expect(focus.focused).toBe(true);
      expect(focus.zoom).toBeGreaterThan(1);
      expect(focus.zoom).toBeLessThanOrEqual(ZOOM_MAX);
      // 视野宽高比必须等于容器比例，xMidYMid 才不会留下大片空白
      expect(width! / height!).toBeCloseTo(ratio, 2);
      // 焦点区域必须完整落在视野内
      expect(focus.x).toBeLessThanOrEqual(region!.x0);
      expect(focus.x + focus.width).toBeGreaterThanOrEqual(region!.x1);
      expect(focus.y).toBeLessThanOrEqual(region!.y0);
      expect(focus.y + focus.height).toBeGreaterThanOrEqual(region!.y1);
    }
  });

  it("跨度极大的区域不会被强行放大到裁掉两端", () => {
    const tang = item("territory:tang-jisheng");
    const region = regionOfPoints(tang.points.map((point) => point.point));
    const focus = getAtlasFocus({ maxZoom: 1.8, ratio: 2.4, region });
    expect(focus.zoom).toBeLessThanOrEqual(1.8);
    expect(focus.x).toBeLessThanOrEqual(region!.x0);
    expect(focus.x + focus.width).toBeGreaterThanOrEqual(region!.x1);
  });

  it("非法容器比例退回底图比例，不会产出 NaN", () => {
    const focus = getAtlasFocus({ ratio: 0, region: { x0: 60, x1: 90, y0: 40, y1: 70 } });
    expect(focus.box).not.toContain("NaN");
    expect(focus.zoom).toBeGreaterThan(1);
  });
});
