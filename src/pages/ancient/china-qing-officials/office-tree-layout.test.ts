import { describe, expect, it } from "vitest";

import { getDynastyAtlas } from "./data";
import {
  branchRankSpans,
  buildOfficeTree,
  filterOfficeTreeLayout,
  layoutOfficeTree,
  visibleNodeIds,
} from "./office-tree-layout";

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

describe("visibleNodeIds + filterOfficeTreeLayout", () => {
  it("defaults to the branch-collapsed view: 皇帝 + 荣衔组 + 分区，共 11 节点", () => {
    const qing = getDynastyAtlas("qing")!;
    const full = layoutOfficeTree(qing);
    const collapsed = filterOfficeTreeLayout(full, visibleNodeIds(full, new Set()));

    expect(collapsed.nodes).toHaveLength(11);
    expect(collapsed.nodes.some((node) => node.id === "qing-board-0")).toBe(false);
    expect(collapsed.nodes.some((node) => node.id === "grand-preceptor")).toBe(false);
    // 坐标取自全量布局：折叠视图的分区位置与其展开后完全一致（不重排）。
    const branch = collapsed.nodes.find((node) => node.id === "assistant")!;
    expect(branch.x).toBe(full.nodes.find((node) => node.id === "assistant")!.x);
  });

  it("expands a branch with an inner office, or an honorary group", () => {
    const qing = getDynastyAtlas("qing")!;
    const full = layoutOfficeTree(qing);

    // 先展开分区（佐理部出现 8 个衙署），再展开其中的六部（6 个部）。
    const withBoards = filterOfficeTreeLayout(
      full,
      visibleNodeIds(full, new Set(["assistant", "six-boards"])),
    );
    expect(withBoards.nodes).toHaveLength(25);
    expect(
      withBoards.edges.some((edge) => edge.from === "assistant" && edge.to === "censorate"),
    ).toBe(true);

    const withDukes = filterOfficeTreeLayout(full, visibleNodeIds(full, new Set(["three-dukes"])));
    expect(withDukes.nodes).toHaveLength(14);
    expect(withDukes.nodes.some((node) => node.id === "grand-preceptor")).toBe(true);
  });

  it("yields the full tree when every parent is expanded, with bounds from visible nodes", () => {
    const qing = getDynastyAtlas("qing")!;
    const full = layoutOfficeTree(qing);
    const expanded = buildOfficeTree(qing)
      .filter((raw) => raw.children.length > 0)
      .map((raw) => raw.id);
    const visible = filterOfficeTreeLayout(full, visibleNodeIds(full, new Set(expanded)));

    expect(visible.nodes).toHaveLength(full.nodes.length);
    expect(visible.minX).toBeCloseTo(full.minX);
    expect(visible.maxX).toBeCloseTo(full.maxX);
  });
});

describe("branchRankSpans", () => {
  it("derives a grade span for every branch and the honorary cluster", () => {
    const qing = getDynastyAtlas("qing")!;
    const spans = branchRankSpans(qing);

    expect(spans.get("honorary")).toBe("正一品—正二品");
    expect(spans.get("central")).toBe("正一品—正五品");
    // 佐理部按行进顺序先遇到六部的「尚书 从一品」，同序并列时取先出现的一枚。
    expect(spans.get("assistant")).toBe("从一品—正五品");
    expect(spans.get("household")).toBe("正二品—正五品");
    expect(spans.get("province")).toBe("正二品—从七品");
    expect(spans.get("frontier")).toBe("从一品—正六品");
    expect(spans.get("local")).toBe("从四品—未入流");
  });

  it("falls back to 无定品 when a subtree carries no grade annotation", () => {
    const qing = getDynastyAtlas("qing")!;
    type OfficeNodeFixture = (typeof qing.branches)[number]["nodes"][number];
    const stripNode = (node: OfficeNodeFixture): OfficeNodeFixture => ({
      ...node,
      rank: undefined,
      children: node.children?.map((child) => stripNode(child)),
    });
    const stripped: typeof qing = {
      ...qing,
      branches: qing.branches.map((entry) => ({
        ...entry,
        nodes: entry.nodes.map((node) => stripNode(node)),
      })),
      honorary: qing.honorary.map((group) => ({ ...group, rank: undefined })),
    };
    const spans = branchRankSpans(stripped);

    expect(spans.get("local")).toBe("无定品");
  });
});
