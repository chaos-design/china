import { describe, expect, it } from "vitest";

import { getDynastyAtlas } from "./data";
import { buildOfficeTree, layoutOfficeTree } from "./office-tree-layout";

describe("buildOfficeTree", () => {
  it("flattens Qing hierarchy into a single rooted tree", () => {
    const qing = getDynastyAtlas("qing")!;
    const raws = buildOfficeTree(qing);

    expect(raws.filter((raw) => raw.parent === null)).toHaveLength(1);
    const root = raws.find((raw) => raw.parent === null)!;
    expect(root.title).toBe(qing.root.title);

    // 每个非根节点都有父节点，且父节点先于子节点出现。
    const position = new Map(raws.map((raw, index) => [raw.id, index]));
    for (const raw of raws) {
      if (raw.parent === null) {
        continue;
      }
      expect(position.get(raw.parent)!).toBeLessThan(position.get(raw.id)!);
    }
  });

  it("counts honorary groups under the root and branches under the root", () => {
    const qing = getDynastyAtlas("qing")!;
    const raws = buildOfficeTree(qing);
    const root = raws.find((raw) => raw.parent === null)!;

    const children = raws.filter((raw) => raw.parent === root.id);
    expect(children.filter((raw) => raw.kind === "honorary")).toHaveLength(qing.honorary.length);
    expect(children.filter((raw) => raw.kind === "branch")).toHaveLength(qing.branches.length);
  });
});

describe("layoutOfficeTree", () => {
  it("positions every node and emits one edge per non-root node", () => {
    const qing = getDynastyAtlas("qing")!;
    const layout = layoutOfficeTree(qing);

    expect(layout.nodes).toHaveLength(layout.edges.length + 1);
    expect(layout.root.title).toBe(qing.root.title);

    // 所有坐标有限且深度越大 y 越小（自上而下）。
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.y).toBeLessThanOrEqual(layout.root.y);
    }

    // 边两端都存在于节点集。
    const ids = new Set(layout.nodes.map((node) => node.id));
    for (const edge of layout.edges) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });

  it("computes finite bounds spanning the whole tree", () => {
    const qing = getDynastyAtlas("qing")!;
    const layout = layoutOfficeTree(qing);

    expect(layout.minX).toBeLessThan(layout.maxX);
    expect(layout.minY).toBeLessThan(layout.maxY);
    expect(layout.width).toBeCloseTo(layout.maxX - layout.minX);
  });
});
