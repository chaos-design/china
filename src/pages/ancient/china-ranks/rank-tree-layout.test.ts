import { describe, expect, it } from "vitest";

import { getRankDynasty, nextDynastyId, RANK_DYNASTIES } from "./rank-data";
import {
  compareColumnOffsets,
  fillLevelBands,
  findComparableTier,
  formatBandLabel,
  layoutRankTree,
  nodeRingRadius,
  OUT_OF_RANK_BAND,
  resolveDynastyBands,
  resolveLevelBand,
  SUPER_GRADE_BAND,
  TREE_GEOMETRY,
} from "./rank-tree-layout";
import type { RankDynastyId, RankLevel } from "./types";

function qin(): NonNullable<ReturnType<typeof getRankDynasty>> {
  return getRankDynasty("qin")!;
}

function levelOf(dynastyId: RankDynastyId, grade: string): RankLevel {
  const level = getRankDynasty(dynastyId)?.levels.find((candidate) => candidate.grade === grade);
  if (!level) {
    throw new Error(`missing level ${dynastyId}/${grade}`);
  }
  return level;
}

describe("rank tree bands", () => {
  it("reads 超品 / 流外 / 品 numbers and the qin-han approximate mapping", () => {
    expect(resolveLevelBand(levelOf("qing", "超品"))).toBe(SUPER_GRADE_BAND);
    expect(resolveLevelBand(levelOf("weijin", "流外"))).toBe(OUT_OF_RANK_BAND);
    expect(resolveLevelBand(levelOf("weijin", "二品 · 三品"))).toBe(2);
    expect(resolveLevelBand(levelOf("qing", "从一品"))).toBe(1.5);
    expect(resolveLevelBand(levelOf("ming", "八品 · 九品"))).toBe(8);
    expect(resolveLevelBand(levelOf("qin", "万石"))).toBe(1);
    expect(resolveLevelBand(levelOf("han", "比二千石"))).toBe(4);
    expect(resolveLevelBand(levelOf("yuan", "路府州县"))).toBeNull();
  });

  it("interpolates levels without a grade number and keeps bands strictly rising", () => {
    expect(fillLevelBands([1, null, 3])).toEqual([1, 2, 3]);
    expect(fillLevelBands([1, null, null, 4])).toEqual([1, 2, 3, 4]);
    expect(fillLevelBands([null, 3])).toEqual([2, 3]);
    expect(fillLevelBands([1, 2, null])).toEqual([1, 2, 3]);
    expect(fillLevelBands([1, 1, 3])).toEqual([1, 1.5, 3]);
    expect(fillLevelBands([null, null])).toEqual([0, 1]);
  });

  it("gives every dynasty a strictly top-down band sequence", () => {
    for (const dynasty of RANK_DYNASTIES) {
      const bands = resolveDynastyBands(dynasty);
      expect(bands).toHaveLength(dynasty.levels.length);
      bands.forEach((band, index) => {
        expect(Number.isInteger(band * 2)).toBe(true);
        expect(band).toBeGreaterThanOrEqual(0);
        expect(band).toBeLessThanOrEqual(OUT_OF_RANK_BAND);
        if (index > 0) {
          expect(band).toBeGreaterThan(bands[index - 1] ?? 0);
        }
      });
    }
  });

  it("places the yuan 路府州县 tier between 三品 and 七品", () => {
    const bands = resolveDynastyBands(getRankDynasty("yuan")!);
    expect(bands).toEqual([1, 2, 3, 5, 7]);
  });

  it("keeps 正 / 从 grades half a step apart", () => {
    expect(resolveDynastyBands(getRankDynasty("qing")!)).toEqual([0, 1, 1.5, 2, 3, 5, 7]);
  });

  it("formats the ruler labels", () => {
    expect(formatBandLabel(0)).toBe("超品");
    expect(formatBandLabel(1)).toBe("一品");
    expect(formatBandLabel(9)).toBe("九品");
    expect(formatBandLabel(1.5)).toBe("从一品");
    expect(formatBandLabel(10)).toBe("流外");
  });
});

describe("rank tree layout", () => {
  it("stacks even tiers and keeps every office as a node", () => {
    const layout = layoutRankTree(qin(), { span: "even", split: "merged" });

    expect(layout.tiers).toHaveLength(qin().levels.length);
    expect(layout.nodes).toHaveLength(10);
    expect(layout.topY).toBe((qin().levels.length - 1) * TREE_GEOMETRY.evenGap);
    expect(layout.bottomY).toBe(0);
    expect(layout.root.y).toBe(layout.topY + TREE_GEOMETRY.rootLift);
    expect(layout.trunk.top).toBe(layout.root.y);
    expect(new Set(layout.nodes.map((node) => node.id)).size).toBe(10);
  });

  it("aligns band tiers on a shared 品序 axis", () => {
    const layout = layoutRankTree(qin(), { span: "band", split: "merged" });
    const yOf = (band: number) => (OUT_OF_RANK_BAND - band) * TREE_GEOMETRY.bandGap;

    expect(layout.tiers.map((tier) => tier.band)).toEqual([1, 2, 3, 5, 8, 9]);
    expect(layout.tiers[0]?.y).toBe(yOf(1));
    expect(layout.tiers[3]?.y).toBe(yOf(5));
    expect(layout.tiers[5]?.y).toBe(yOf(9));

    const qing = getRankDynasty("qing")!;
    const qingLayout = layoutRankTree(qing, { span: "band", split: "merged" });
    expect(qingLayout.tiers[0]?.band).toBe(SUPER_GRADE_BAND);
    expect(qingLayout.tiers[0]?.y).toBe(yOf(0));

    // 两朝同一品必须落在同一高度
    const mingLayout = layoutRankTree(getRankDynasty("ming")!, { span: "band", split: "merged" });
    const qinOne = layout.tiers.find((tier) => tier.band === 1);
    const mingOne = mingLayout.tiers.find((tier) => tier.band === 1);
    expect(qinOne?.y).toBe(mingOne?.y);
  });

  it("widens a tier with more offices and caps the ring", () => {
    expect(nodeRingRadius(1)).toBeCloseTo(TREE_GEOMETRY.baseRadius + TREE_GEOMETRY.radiusPerOffice);
    expect(nodeRingRadius(4)).toBeGreaterThan(nodeRingRadius(1));
    expect(nodeRingRadius(20)).toBe(TREE_GEOMETRY.maxNodeRadius);
  });

  it("splits civil to the left half and military to the right half", () => {
    const layout = layoutRankTree(getRankDynasty("suitang")!, {
      span: "band",
      split: "branch",
    });

    for (const node of layout.nodes) {
      if (node.office.branch === "civil") {
        expect(node.x).toBeLessThan(0);
      } else {
        expect(node.x).toBeGreaterThan(0);
      }
      expect(Math.hypot(node.x, node.z)).toBeCloseTo(layout.tiers[node.levelIndex]?.radius ?? 0, 5);
    }
  });

  it("keeps merged nodes on the ring and clear of the trunk", () => {
    const layout = layoutRankTree(qin(), { span: "band", split: "merged" });
    for (const node of layout.nodes) {
      expect(node.x ** 2 + node.z ** 2).toBeGreaterThan(1);
    }
  });

  it("finds the same grade across dynasties and falls back to the nearest", () => {
    expect(findComparableTier(qin(), 1)).toMatchObject({ band: 1, exact: true, levelIndex: 0 });
    expect(findComparableTier(qin(), 4)).toMatchObject({ band: 3, exact: false });
    expect(findComparableTier(getRankDynasty("qing")!, 0)).toMatchObject({
      band: 0,
      exact: true,
    });
    expect(findComparableTier(getRankDynasty("yuan")!, 6)).toMatchObject({
      band: 5,
      exact: false,
    });
  });

  it("spreads two trees so their canopies never touch", () => {
    const main = layoutRankTree(qin(), { span: "band", split: "merged" });
    const compare = layoutRankTree(getRankDynasty("qing")!, { span: "band", split: "merged" });

    expect(compareColumnOffsets(main, null)).toEqual({ compare: 0, main: 0, width: main.width });

    const offsets = compareColumnOffsets(main, compare);
    expect(offsets.main).toBeLessThan(0);
    expect(offsets.compare).toBeGreaterThan(0);
    expect(offsets.compare - offsets.main).toBeCloseTo(
      main.maxRadius + compare.maxRadius + TREE_GEOMETRY.columnGap,
    );
    expect(offsets.width).toBeGreaterThan(0);
  });

  it("steps to the next dynasty and wraps around", () => {
    expect(nextDynastyId("qin")).toBe("han");
    expect(nextDynastyId("qing")).toBe("qin");
  });
});
