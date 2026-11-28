import { describe, expect, it } from "vitest";

import { resolveLabelOffsets } from "./sand-table-labels";

const label = (x: number, z: number, rank: number, halfWidth = 1) => ({ halfWidth, rank, x, z });
const MIN_DIST = 2 + 0.34;

describe("沙盘名牌避让", () => {
  it("互不相交的名牌原样保留", () => {
    const city = label(0, 0, 0);
    const unit = label(6, 6, 2);
    const offsets = resolveLabelOffsets([city, unit]);
    expect(offsets.get(city)).toEqual({ dx: 0, dz: 0 });
    expect(offsets.get(unit)).toEqual({ dx: 0, dz: 0 });
  });

  it("重叠时低优先级牌被推开，高优先级牌不动", () => {
    const city = label(0, 0, 0);
    const unit = label(0.4, 0.2, 2);
    const offsets = resolveLabelOffsets([city, unit]);
    expect(offsets.get(city)).toEqual({ dx: 0, dz: 0 });
    const moved = offsets.get(unit);
    expect(moved).toBeDefined();
    const x = 0.4 + (moved?.dx ?? 0);
    const z = 0.2 + (moved?.dz ?? 0);
    expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(MIN_DIST - 1e-9);
  });

  it("与多块牌冲突时逐个避让，最终与两者都拉开安全距", () => {
    const cityA = label(0, 0, 0);
    const cityB = label(0.2, 2.9, 0);
    const unit = label(0.5, 0.1, 2);
    const offsets = resolveLabelOffsets([cityB, unit, cityA]);
    const moved = offsets.get(unit);
    expect(moved).toBeDefined();
    const x = 0.5 + (moved?.dx ?? 0);
    const z = 0.1 + (moved?.dz ?? 0);
    expect(Math.hypot(x - cityA.x, z - cityA.z)).toBeGreaterThanOrEqual(MIN_DIST - 1e-9);
    expect(Math.hypot(x - cityB.x, z - cityB.z)).toBeGreaterThanOrEqual(MIN_DIST - 1e-9);
  });

  it("完全重合时朝 -z 推开，部队牌浮在营垒牌上方", () => {
    const city = label(0, 0, 0);
    const unit = label(0, 0, 2);
    const offsets = resolveLabelOffsets([unit, city]);
    const moved = offsets.get(unit);
    expect(moved?.dz).toBeLessThan(0);
    expect(moved?.dx).toBe(0);
  });

  it("输入顺序不影响布局：排序只看优先级与坐标", () => {
    const labels = [label(0, 0, 0), label(0.5, 0.1, 2), label(3, 3, 2), label(0.2, 2.9, 1)];
    const first = resolveLabelOffsets(labels);
    const second = resolveLabelOffsets([...labels].reverse());
    for (const item of labels) {
      expect(second.get(item)).toEqual(first.get(item));
    }
  });

  it("同优先级重叠按坐标次序避让，结果稳定", () => {
    const first = label(0, 0, 2);
    const second = label(0.3, 0.2, 2);
    const offsets = resolveLabelOffsets([second, first]);
    expect(offsets.get(first)).toEqual({ dx: 0, dz: 0 });
    const moved = offsets.get(second);
    expect(Math.hypot((moved?.dx ?? 0) + 0.3, (moved?.dz ?? 0) + 0.2)).toBeGreaterThanOrEqual(
      MIN_DIST - 1e-9,
    );
  });

  it("极端拥挤时位移封顶，名牌不飞离部队", () => {
    const unit = label(0, 0, 2);
    const ring = [
      label(0.5, 0.2, 0),
      label(-0.5, 0.2, 0),
      label(0.5, -0.2, 0),
      label(-0.5, -0.2, 0),
      label(0.2, 0.5, 0),
    ];
    const offsets = resolveLabelOffsets([unit, ...ring]);
    const moved = offsets.get(unit);
    expect(Math.hypot(moved?.dx ?? 0, moved?.dz ?? 0)).toBeLessThanOrEqual(2.4 + 1e-9);
  });
});
