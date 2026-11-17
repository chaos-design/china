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
});
