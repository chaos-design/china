import { describe, expect, it } from "vitest";

import {
  countPosts,
  getOfficialsDynasty,
  OFFICIALS_DYNASTIES,
} from "../china-officials/officials-data";
import {
  compareColumnOffsets,
  findComparableGrade,
  formatBandLabel,
  layoutRankTree,
  nodeRingRadius,
  OUT_OF_RANK_BAND,
  SUPER_GRADE_BAND,
  TREE_GEOMETRY,
} from "./rank-tree-layout";

const qin = getOfficialsDynasty("qin")!;
const qing = getOfficialsDynasty("qing")!;

describe("立体品级树布局", () => {
  it("keeps every dynasty's grade orders strictly increasing (band mode precondition)", () => {
    for (const dynasty of OFFICIALS_DYNASTIES) {
      const orders = dynasty.grades.map((grade) => grade.order);
      for (let index = 1; index < orders.length; index += 1) {
        expect(orders[index], `${dynasty.id} 第 ${index} 级`).toBeGreaterThan(orders[index - 1]!);
      }
      expect(orders[0]).toBeGreaterThanOrEqual(SUPER_GRADE_BAND);
      expect(orders[orders.length - 1]).toBeLessThanOrEqual(OUT_OF_RANK_BAND);
    }
  });

  it("lays every grade tier on its own band and y in band span", () => {
    const layout = layoutRankTree(qin, { span: "band", split: "branch" });

    expect(layout.tiers).toHaveLength(qin.grades.length);
    layout.tiers.forEach((tier, index) => {
      expect(tier.band).toBe(qin.grades[index]?.order);
      expect(tier.y).toBe((OUT_OF_RANK_BAND - tier.band) * TREE_GEOMETRY.bandGap);
      expect(tier.gradeIndex).toBe(index);
    });
    // 同品对齐：秦与清的一品层 y 完全一致（清一品 order=1）。
    const qingLayout = layoutRankTree(qing, { span: "band", split: "branch" });
    const qinBand1 = layout.tiers.find((tier) => tier.band === 1);
    const qingBand1 = qingLayout.tiers.find((tier) => tier.band === 1);
    expect(qinBand1?.y).toBe(qingBand1?.y);
    // 超品只在清出现，且位于最高层。
    expect(qingLayout.tiers[0]?.band).toBe(SUPER_GRADE_BAND);
  });

  it("spreads tiers evenly in even span", () => {
    const layout = layoutRankTree(qin, { span: "even", split: "branch" });

    layout.tiers.forEach((tier, index) => {
      expect(tier.y).toBe((qin.grades.length - 1 - index) * TREE_GEOMETRY.evenGap);
    });
  });

  it("turns every roster post into a node keyed by dynasty + grade + title", () => {
    const layout = layoutRankTree(qin, { span: "band", split: "branch" });

    expect(layout.nodes).toHaveLength(countPosts(qin));
    for (const grade of qin.grades) {
      for (const post of grade.posts) {
        const node = layout.nodes.find((candidate) => candidate.post === post);
        expect(node, `${grade.id}:${post.title}`).toBeTruthy();
        expect(node?.id).toBe(`qin:${grade.id}:${post.title}`);
        expect(node?.band).toBe(grade.order);
        const tier = layout.tiers[node?.gradeIndex ?? -1];
        expect(tier?.grade).toBe(grade);
        expect(node?.y).toBe((tier?.y ?? 0) + TREE_GEOMETRY.officeLift);
        // 节点都在本级官职环上。
        const radial = Math.hypot(node?.x ?? 0, node?.z ?? 0);
        expect(radial).toBeCloseTo(tier?.radius ?? 0, 5);
      }
    }
  });

  it("hangs civil nodes on the left bough and military on the right in branch mode", () => {
    const layout = layoutRankTree(qin, { span: "band", split: "branch" });

    for (const node of layout.nodes) {
      if (node.post.branch === "civil") {
        expect(node.x).toBeLessThan(0);
      } else {
        expect(node.x).toBeGreaterThan(0);
      }
    }

    // 双枝：分叉点在皇权下方、最高层之上，锚点自顶向下、位于环内侧。
    expect(layout.civilBough[0]).toEqual(layout.fork);
    expect(layout.militaryBough[0]).toEqual(layout.fork);
    expect(layout.civilBough).toHaveLength(layout.tiers.length + 1);
    expect(layout.militaryBough).toHaveLength(layout.tiers.length + 1);
    expect(layout.fork.y).toBeLessThan(layout.root.y);
    expect(layout.fork.y).toBeGreaterThan(layout.topY);
    layout.civilBough.slice(1).forEach((anchor) => {
      expect(anchor.x).toBeLessThan(0);
    });
    layout.militaryBough.slice(1).forEach((anchor) => {
      expect(anchor.x).toBeGreaterThan(0);
    });
    for (const tier of layout.tiers) {
      expect(Math.abs(tier.civilAnchor.x)).toBeLessThanOrEqual(tier.radius);
      expect(Math.abs(tier.militaryAnchor.x)).toBeLessThanOrEqual(tier.radius);
      expect(tier.civilAnchor.y).toBe(tier.y + TREE_GEOMETRY.anchorLift);
    }
  });

  it("omits boughs in merged mode and still spreads nodes around the ring", () => {
    const layout = layoutRankTree(qin, { span: "band", split: "merged" });

    expect(layout.civilBough).toHaveLength(0);
    expect(layout.militaryBough).toHaveLength(0);
    const civilNodes = layout.nodes.filter((node) => node.post.branch === "civil");
    // 合列不再约束左右半环：至少有一个文官节点不在左侧。
    expect(civilNodes.some((node) => node.x >= 0)).toBe(true);
  });

  it("finds the comparable grade by exact band first, then nearest with higher grade winning ties", () => {
    const exact = findComparableGrade(qin, 5);
    expect(exact?.exact).toBe(true);
    expect(exact?.grade.label).toBe("千石 — 六百石");

    // 秦的级序是 1,2,3,5,8,9：band 4 距三品与五品各 1，取靠上（品高）的三品。
    const nearest = findComparableGrade(qin, 4);
    expect(nearest?.exact).toBe(false);
    expect(nearest?.band).toBe(3);

    const superGrade = findComparableGrade(qing, 0);
    expect(superGrade?.exact).toBe(true);
    expect(superGrade?.grade.label).toBe("超品");
  });

  it("offsets compare columns so canopies never overlap", () => {
    const main = layoutRankTree(qin, { span: "band", split: "branch" });
    const single = compareColumnOffsets(main, null);
    expect(single.main).toBe(0);
    expect(single.compare).toBe(0);

    const compare = layoutRankTree(qing, { span: "band", split: "branch" });
    const both = compareColumnOffsets(main, compare);
    expect(both.main).toBeLessThan(0);
    expect(both.compare).toBeGreaterThan(0);
    expect(both.compare - both.main).toBeGreaterThanOrEqual(
      main.maxRadius + compare.maxRadius + TREE_GEOMETRY.columnGap - 0.001,
    );
  });

  it("grows the node ring with office count and caps it", () => {
    expect(nodeRingRadius(0)).toBe(TREE_GEOMETRY.baseRadius);
    expect(nodeRingRadius(3)).toBeGreaterThan(nodeRingRadius(2));
    expect(nodeRingRadius(50)).toBe(TREE_GEOMETRY.maxNodeRadius);
  });

  it("formats band labels for the focus chip", () => {
    expect(formatBandLabel(0)).toBe("超品");
    expect(formatBandLabel(1)).toBe("一品");
    expect(formatBandLabel(1.5)).toBe("从一品");
    expect(formatBandLabel(9)).toBe("九品");
    expect(formatBandLabel(10)).toBe("流外");
  });
});
