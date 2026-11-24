import { describe, expect, it } from "vitest";

import { DYNASTY_ATLASES, getDynastyAtlas } from "./data";
import {
  branchRankSpans,
  buildOfficeTree,
  filterOfficeTreeLayout,
  layoutOfficeTree,
  OFFICE_TREE_GEOMETRY,
  parseRankLabels,
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

  it("spreads each level over the x/z plane instead of collapsing into one parabola", () => {
    const qing = getDynastyAtlas("qing")!;
    const full = layoutOfficeTree(qing);
    const collapsed = filterOfficeTreeLayout(full, visibleNodeIds(full, new Set()));
    const ring = full.nodes.filter((node) => node.depth === 1);
    const geometry = OFFICE_TREE_GEOMETRY;

    const xSpan = Math.max(...ring.map((node) => node.x)) - Math.min(...ring.map((node) => node.x));
    const zSpan = Math.max(...ring.map((node) => node.z)) - Math.min(...ring.map((node) => node.z));
    // 同层必须在 x 与 z 两个方向都铺开；退化成一条线时其中一个跨度会接近 0。
    expect(xSpan).toBeGreaterThan(geometry.ringRadiusX);
    expect(zSpan).toBeGreaterThan(geometry.ringRadiusZ);
    // 折叠视图坐标取自全量布局：纵深仍覆盖整只环，节点不重排。
    expect(collapsed.maxZ - collapsed.minZ).toBeGreaterThan(geometry.ringRadiusZ);
    expect(collapsed.nodes.find((node) => node.id === "assistant")!.x).toBe(
      full.nodes.find((node) => node.id === "assistant")!.x,
    );
  });

  it("places every non-root depth on its own concentric ring", () => {
    const layout = layoutOfficeTree(getDynastyAtlas("qing")!);
    const geometry = OFFICE_TREE_GEOMETRY;

    for (const node of layout.nodes) {
      if (node.depth === 0) {
        expect(node.x).toBe(0);
        expect(node.z).toBe(0);
        continue;
      }
      const ring = node.depth - 1;
      const rx = geometry.ringRadiusX + ring * geometry.ringStepX;
      const rz = geometry.ringRadiusZ + ring * geometry.ringStepZ;
      // 一圈一代人：每个节点都精确落在该深度的椭圆轨道上。
      expect((node.x / rx) ** 2 + (node.z / rz) ** 2).toBeCloseTo(1, 5);
      expect(node.y).toBe(geometry.rootLift - node.depth * geometry.levelGap);
    }
  });

  it("keeps same-depth nodes apart and children clustered around their parents", () => {
    for (const atlas of DYNASTY_ATLASES) {
      const layout = layoutOfficeTree(atlas);
      const byId = new Map(layout.nodes.map((node) => [node.id, node]));

      // 同深度的任意两枚节点不重叠（最小官署直径约 0.6）。
      const depths = [...new Set(layout.nodes.map((node) => node.depth))];
      for (const depth of depths) {
        const group = layout.nodes.filter((node) => node.depth === depth);
        for (let i = 0; i < group.length; i += 1) {
          for (let j = i + 1; j < group.length; j += 1) {
            const distance = Math.hypot(
              group[i]!.x - group[j]!.x,
              group[i]!.y - group[j]!.y,
              group[i]!.z - group[j]!.z,
            );
            expect(distance).toBeGreaterThan(0.6);
          }
        }
      }

      // 子代聚拢在父代所在扇区（根居中除外）。叶子多的族扇区可以很宽
      //（小朝代一个分区可占近半环），端部子代离父代均值可达五六十度，
      // 这里只锁「子代不绕到父代对侧」这一构造保证：父子 xz 同向。
      for (const node of layout.nodes) {
        if (node.depth === 0) {
          continue;
        }
        const magnitude = Math.hypot(node.x, node.z);
        for (const childId of node.children) {
          const child = byId.get(childId)!;
          const childMagnitude = Math.hypot(child.x, child.z);
          const dot =
            (node.x * child.x + node.z * child.z) / Math.max(1e-6, magnitude * childMagnitude);
          expect(dot).toBeGreaterThan(0.2);
        }
      }
    }
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
    expect(spans.get("assistant")).toBe("从一品—正六品");
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

describe("parseRankLabels", () => {
  it("extracts standard grade labels from single and compound annotations", () => {
    expect(parseRankLabels("正一品")).toEqual(["正一品"]);
    expect(parseRankLabels("左都御史 · 正一品")).toEqual(["正一品"]);
    expect(parseRankLabels("尚书 从一品 · 侍郎 正二品")).toEqual(["从一品", "正二品"]);
    expect(parseRankLabels("正三品至正六品")).toEqual(["正三品", "正六品"]);
  });

  it("maps 未入流 and returns nothing for honorary-style remarks", () => {
    expect(parseRankLabels("典史 · 未入流")).toEqual(["未入流"]);
    expect(parseRankLabels("加衔无定品")).toEqual([]);
    expect(parseRankLabels("议政处")).toEqual([]);
    expect(parseRankLabels("宗令 · 亲王郡王兼领")).toEqual([]);
  });
});
