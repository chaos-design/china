import { describe, expect, it } from "vitest";

import {
  DEFAULT_DYNASTY_ID,
  DYNASTY_ATLASES,
  getDynastyAtlas,
  resolveDynastyAtlas,
} from "./registry";
import type { AtlasOfficeNode } from "./types";

function collectIds(nodes: readonly AtlasOfficeNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...(node.children ? collectIds(node.children) : [])]);
}

describe("官制图谱数据层", () => {
  it("registers exactly the eight dynasties in canonical order", () => {
    expect(DYNASTY_ATLASES.map((atlas) => atlas.id)).toEqual([
      "qin",
      "han",
      "weijin",
      "suitang",
      "song",
      "yuan",
      "ming",
      "qing",
    ]);
    expect(new Set(DYNASTY_ATLASES.map((atlas) => atlas.id)).size).toBe(8);
  });

  it("resolves every dynasty by id and falls back safely", () => {
    for (const atlas of DYNASTY_ATLASES) {
      expect(getDynastyAtlas(atlas.id)).toBe(atlas);
      expect(resolveDynastyAtlas(atlas.id)).toBe(atlas);
    }
    expect(getDynastyAtlas("unknown")).toBeUndefined();
    expect(resolveDynastyAtlas("unknown").id).toBe(DEFAULT_DYNASTY_ID);
    expect(resolveDynastyAtlas(null).id).toBe(DEFAULT_DYNASTY_ID);
  });

  it.each(
    DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas] as const),
  )("%s has coherent hierarchy and rank data", (_id, atlas) => {
    expect(atlas.name.length).toBeGreaterThan(0);
    expect(atlas.period).toMatch(/—/);
    expect(atlas.root.title).toBe("皇帝");
    expect(atlas.honorary.length).toBeGreaterThan(0);
    expect(atlas.branches.length).toBeGreaterThanOrEqual(3);

    const ids = [
      ...atlas.honorary.flatMap((group) => [group.id, ...collectIds(group.children ?? [])]),
      ...atlas.branches.flatMap((entry) => [entry.id, ...collectIds(entry.nodes)]),
    ];
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);

    expect(atlas.levels.length).toBeGreaterThanOrEqual(6);
    expect(atlas.levels.every((item) => item.label && item.offices && item.salary > 0)).toBe(true);
    const orders = atlas.levels.map((item) => item.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(atlas.ladderGroups.length).toBeGreaterThanOrEqual(4);

    // 阶梯分组必须覆盖每一级（含正/从筛选），不允许出现阶梯上看不到的品级。
    for (const item of atlas.levels) {
      expect(
        atlas.ladderGroups.some(
          (group) =>
            group.orders.includes(item.order) && (!group.grade || group.grade === item.grade),
        ),
      ).toBe(true);
    }

    expect(atlas.notes.ritual.length).toBeGreaterThan(0);
    expect(atlas.ritual.text.length).toBeGreaterThan(0);
    expect(atlas.footnote.length).toBeGreaterThan(0);
    expect(atlas.badgesAvailable ? atlas.civilBadges.length : atlas.civilBadges.length).toBe(
      atlas.badgesAvailable ? 9 : 0,
    );
    expect(atlas.militaryBadges.length).toBe(atlas.civilBadges.length);
  });

  it("keeps the image-derived Qing content intact", () => {
    const qing = getDynastyAtlas("qing")!;
    expect(qing.branches.map((entry) => entry.title)).toEqual([
      "中枢部",
      "佐理部",
      "帝室部",
      "行省",
      "藩部",
      "府州县",
    ]);
    expect(qing.levels).toHaveLength(18);
    expect(qing.civilBadges.map((badge) => badge.animal)).toContain("仙鹤");
    expect(qing.militaryBadges.map((badge) => badge.animal)).toContain("海马");
  });

  it("carries the image-derived Qing rank details (岁俸实数、顶戴朝服校订)", () => {
    const qing = getDynastyAtlas("qing")!;

    // 岁俸实数：正从同品同俸，每级都标银两数。
    for (const item of qing.levels) {
      expect(item.salaryLabel).toMatch(/^\d+ 两$/);
      expect(item.salaryLabel).toBe(
        qing.levels.find((peer) => peer.order === item.order)!.salaryLabel,
      );
    }

    // 朝服七档：一至二品绣金、三至四品绣银、五品青色、六品蓝色、七至九品依次变浅。
    const robes = qing.levels.map((item) => item.robe);
    expect(new Set(robes).size).toBe(7);
    expect(robes[0]).toBe("石青色绣金");
    expect(robes[4]).toBe("石青色绣银");
    expect(robes[8]).toBe("青色");
    expect(robes[10]).toBe("蓝色");

    // 顶戴校订：八品阴纹镂花素金顶；一至五品珊瑚朝珠、六品起素珠朝珠。
    for (const item of qing.levels.filter((entry) => entry.order === 8)) {
      expect(item.hat).toBe("阴纹镂花素金顶");
    }
    expect(qing.levels.find((entry) => entry.order === 6)!.hatBeads).toBe("素珠朝珠");
    expect(qing.levels.find((entry) => entry.order === 5)!.hatBeads).toBe("珊瑚朝珠");

    // 阶梯正从分行：每一级恰好出现在一行里，不再重复。
    const rowCounts = new Map<string, number>();
    for (const group of qing.ladderGroups) {
      for (const item of qing.levels.filter(
        (entry) =>
          group.orders.includes(entry.order) && (!group.grade || group.grade === entry.grade),
      )) {
        rowCounts.set(item.label, (rowCounts.get(item.label) ?? 0) + 1);
      }
    }
    expect([...rowCounts.values()].every((count) => count === 1)).toBe(true);
    expect(qing.ladderGroups[0]!.grade).toBe("正");
    expect(qing.ladderGroups[1]!.grade).toBe("从");
  });
});
