import { describe, expect, it } from "vitest";

import { ATLAS_VIEW } from "./atlas-items";
import {
  easeInOutCubic,
  interpolateView,
  MAP_ZOOM_MAX,
  makeView,
  pannedView,
  zoomedView,
} from "./map-view";

describe("map-view 视野几何", () => {
  it("easeInOutCubic 走 0→0.5→1，端点精确", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(-0.2)).toBe(0);
    expect(easeInOutCubic(1.4)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });

  it("makeView 的 zoom 相对全览高度，focused 跟随 zoom 阈值", () => {
    const overview = makeView(ATLAS_VIEW.x, ATLAS_VIEW.y, ATLAS_VIEW.width, ATLAS_VIEW.height);
    expect(overview.zoom).toBe(1);
    expect(overview.focused).toBe(false);
    expect(overview.box).toBe(
      `${ATLAS_VIEW.x} ${ATLAS_VIEW.y} ${ATLAS_VIEW.width} ${ATLAS_VIEW.height}`,
    );

    const focused = makeView(0, 0, ATLAS_VIEW.width / 4, ATLAS_VIEW.height / 4);
    expect(focused.zoom).toBe(4);
    expect(focused.focused).toBe(true);
    expect(focused.cx).toBeCloseTo(ATLAS_VIEW.width / 8, 2);
  });

  it("interpolateView 在端点与中点处符合线性插值", () => {
    const from = makeView(10, 20, 60, 40);
    const to = makeView(30, 10, 30, 20);
    expect(interpolateView(from, to, 0).box).toBe(from.box);
    expect(interpolateView(from, to, 1).box).toBe(to.box);
    const middle = interpolateView(from, to, 0.5);
    expect(middle.x).toBeCloseTo(20, 5);
    expect(middle.width).toBeCloseTo(45, 5);
    expect(middle.height).toBeCloseTo(30, 5);
  });

  it("zoomedView 以锚点为支点：锚点对应的用户坐标不动", () => {
    const base = makeView(10, 20, 60, ATLAS_VIEW.height / 2);
    const fx = 0.25;
    const fy = 0.75;
    const anchorUser = [base.x + fx * base.width, base.y + fy * base.height];
    const next = zoomedView(base, 2, fx, fy);
    expect(next.height).toBeCloseTo(base.height / 2, 5);
    expect(next.width).toBeCloseTo(base.width / 2, 5);
    expect(next.x + fx * next.width).toBeCloseTo(anchorUser[0]!, 5);
    expect(next.y + fy * next.height).toBeCloseTo(anchorUser[1]!, 5);
  });

  it("zoomedView 夹住缩放上下限：缩小到全览对齐，放大到 MAP_ZOOM_MAX", () => {
    const base = makeView(30, 30, ATLAS_VIEW.width / 3, ATLAS_VIEW.height / 3);
    const zoomedOut = zoomedView(base, 0.001, 0.5, 0.5);
    expect(zoomedOut.zoom).toBe(1);
    expect(zoomedOut.focused).toBe(false);
    expect(zoomedOut.x).toBeCloseTo(ATLAS_VIEW.x, 5);
    expect(zoomedOut.y).toBeCloseTo(ATLAS_VIEW.y, 5);

    const zoomedIn = zoomedView(base, 40, 0.5, 0.5);
    expect(zoomedIn.zoom).toBe(MAP_ZOOM_MAX);
    expect(zoomedIn.height).toBeCloseTo(ATLAS_VIEW.height / MAP_ZOOM_MAX, 5);
  });

  it("pannedView 平移视野并夹住越界：中心不出全览外扩圈", () => {
    const base = makeView(40, 40, ATLAS_VIEW.width / 3, ATLAS_VIEW.height / 3);
    const moved = pannedView(base, 0.1, -0.1);
    expect(moved.x).toBeCloseTo(base.x + 0.1 * base.width, 5);
    expect(moved.y).toBeCloseTo(base.y - 0.1 * base.height, 5);

    const flung = pannedView(base, 50, -50);
    const fullWidth = ATLAS_VIEW.height * (base.width / base.height);
    expect(flung.cx).toBeLessThanOrEqual(ATLAS_VIEW.x + fullWidth);
    expect(flung.cy).toBeGreaterThanOrEqual(ATLAS_VIEW.y);
    // 拖回全览之外是不可能的三连：视野仍覆盖底图附近区域
    expect(flung.width).toBeCloseTo(base.width, 5);
  });
});
