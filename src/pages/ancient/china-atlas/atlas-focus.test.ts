import { describe, expect, it } from "vitest";
import { atlasTransform, getAtlasFocus, ZOOM_MAX, ZOOM_MIN } from "./atlas-focus";
import { ATLAS_ITEMS, ATLAS_VIEW } from "./atlas-items";

const item = (id: string) => {
  const found = ATLAS_ITEMS.find((entry) => entry.id === id);
  if (!found) throw new Error(`缺少条目 ${id}`);
  return found;
};

describe("atlas-focus 局部放大", () => {
  it("全览是单位变换，不改变任何坐标", () => {
    expect(getAtlasFocus(null)).toEqual({ k: 1, tx: 0, ty: 0 });
    expect(atlasTransform(getAtlasFocus(null))).toBe("translate(0px, 0px) scale(1)");
  });

  it("单点条目放到最大倍率，并且把锚点推到视野中心", () => {
    const frontier = item("frontier:han-xiyu-duhu");
    const focus = getAtlasFocus(frontier);
    expect(focus.k).toBe(ZOOM_MAX);
    const cx = frontier.primary[0];
    const cy = frontier.primary[1];
    const viewCx = ATLAS_VIEW.x + ATLAS_VIEW.width / 2;
    const viewCy = ATLAS_VIEW.y + ATLAS_VIEW.height / 2;
    expect(focus.tx + focus.k * cx).toBeCloseTo(viewCx, 1);
    expect(focus.ty + focus.k * cy).toBeCloseTo(viewCy, 1);
    expect(atlasTransform(focus)).toBe(`translate(${focus.tx}px, ${focus.ty}px) scale(${focus.k})`);
  });

  it("跨度很大的条目至少保持最小倍率，不会被缩到比全览还小", () => {
    const tang = item("territory:tang-jisheng");
    const focus = getAtlasFocus(tang);
    expect(focus.k).toBeGreaterThanOrEqual(ZOOM_MIN);
    expect(focus.k).toBeLessThanOrEqual(ZOOM_MAX);
  });

  it("视野参数可注入，倍率与平移跟着变", () => {
    const frontier = item("frontier:han-xiyu-duhu");
    const small = { ...ATLAS_VIEW, height: 50, width: 60 };
    expect(getAtlasFocus(frontier, small).k).toBe(ZOOM_MAX);
    expect(getAtlasFocus(frontier, small).tx).not.toBe(getAtlasFocus(frontier).tx);
  });
});
