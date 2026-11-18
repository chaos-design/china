import type { AtlasOfficeNode, DynastyAtlas } from "./data";

/**
 * 官制图谱立体树的布局计算（纯函数，不碰 DOM / WebGL）：
 * 把 DynastyAtlas 的「皇权 → 荣衔 → 六类官署分区 → 属官」层级关系
 * 摊成一棵可绘制的三维径向下降树。
 *
 * 与 rank-tree-layout 的「品级分层」不同，这里是一棵真正的从属树：
 * 皇权居中在上，直属子节点沿椭圆环铺开（x / z 皆独立变化，不是一条曲线），
 * 属官再挂靠各自父节点向下、向前垂落。纵向按深度下沉。
 * 环布局让同一层的节点真正在三维空间里错开，前后有远近、旋转有纵深，
 * 而不是旧版那样把 10 个分区压在一条抛物线上、标签首尾相接。
 */

export type OfficeNodeKind = "root" | "honorary" | "branch" | "office";

export interface OfficeTreeVec3 {
  x: number;
  y: number;
  z: number;
}

export interface OfficeTreeNode extends OfficeTreeVec3 {
  children: readonly string[];
  /** 父节点 id，根为 null。 */
  parent: string | null;
  kind: OfficeNodeKind;
  id: string;
  title: string;
  rank?: string;
  note?: string;
  mark?: string;
  depth: number;
}

export interface OfficeTreeEdge {
  from: string;
  to: string;
  kind: "honorary" | "branch" | "office";
}

export interface OfficeTreeLayout {
  edges: readonly OfficeTreeEdge[];
  nodes: readonly OfficeTreeNode[];
  root: OfficeTreeNode;
  rootId: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  width: number;
  /** 根节点（皇权）位置，画布取景中心参考。 */
}

export const OFFICE_TREE_GEOMETRY = {
  /** 每一级向下的纵向间距。 */
  levelGap: 4.2,
  /** 属官在父节点周围展开的横向步长。 */
  slotGap: 1.5,
  /**
   * 直属子节点环绕皇权的椭圆半径（x 横向 / z 纵深）。关键的结构变化：
   * 旧版把 10 个分区排在一条抛物线上（x 与 z 都是 x 的函数），本质上是一条 1D 曲线，
   * 从任何视角看都是「一条线」，标签首尾相接且层级被压平。改成椭圆环后，
   * 同一层的节点真正在 x/z 平面铺开，前后错落，层级与纵深同时可见。
   */
  ringRadiusX: 10,
  ringRadiusZ: 6.5,
  /** 属官每层在父节点基础上继续向前偏移，形成向前垂落的枝。 */
  branchForward: 1.6,
  /** 根节点高于直属子节点层的距离。 */
  rootLift: 1.8,
} as const;

/** 把朝代数据摊成一棵以皇权为根的从属树（尚未定位坐标）。 */
interface RawNode {
  id: string;
  kind: OfficeNodeKind;
  mark?: string;
  note?: string;
  parent: string | null;
  rank?: string;
  title: string;
  depth: number;
  children: string[];
}

const ROOT_ID = "office-root";

function rawFromOfficeNode(parent: string, depth: number, node: AtlasOfficeNode): RawNode {
  return {
    children: [],
    depth,
    id: node.id,
    kind: "office",
    note: node.note,
    parent,
    rank: node.rank,
    title: node.title,
  };
}

export function buildOfficeTree(atlas: DynastyAtlas): RawNode[] {
  const raws: RawNode[] = [];
  const index = new Map<string, RawNode>();
  const register = (node: RawNode) => {
    raws.push(node);
    index.set(node.id, node);
  };

  const root: RawNode = {
    children: [],
    depth: 0,
    id: ROOT_ID,
    kind: "root",
    note: atlas.root.note,
    parent: null,
    title: atlas.root.title,
  };
  register(root);

  // 荣衔：每个封号组是皇权的直属子节点，组内封官为孙节点。
  for (const group of atlas.honorary) {
    const groupRaw: RawNode = {
      children: [],
      depth: 1,
      id: group.id,
      kind: "honorary",
      note: undefined,
      parent: ROOT_ID,
      rank: group.rank,
      title: group.title,
    };
    register(groupRaw);
    root.children.push(group.id);
    for (const child of group.children ?? []) {
      register(rawFromOfficeNode(group.id, 2, child));
      groupRaw.children.push(child.id);
    }
  }

  // 官署分区：每个分区是皇权直属子节点，区内衙署（可再嵌套）为子代。
  for (const branch of atlas.branches) {
    const branchRaw: RawNode = {
      children: [],
      depth: 1,
      id: branch.id,
      kind: "branch",
      mark: branch.mark,
      note: branch.summary,
      parent: ROOT_ID,
      title: branch.title,
    };
    register(branchRaw);
    root.children.push(branch.id);
    const attach = (parentId: string, depth: number, node: AtlasOfficeNode) => {
      const nodeRaw = rawFromOfficeNode(parentId, depth, node);
      register(nodeRaw);
      index.get(parentId)?.children.push(node.id);
      for (const child of node.children ?? []) {
        attach(node.id, depth + 1, child);
      }
    };
    for (const node of branch.nodes) {
      attach(branch.id, 2, node);
    }
  }

  return raws;
}

export function layoutOfficeTree(atlas: DynastyAtlas): OfficeTreeLayout {
  const raws = buildOfficeTree(atlas);

  // 按父分组：直属子节点用分组顺序铺满椭圆环，属官用兄弟序号在父节点周围局部展开。
  const childrenOf = new Map<string, RawNode[]>();
  for (const raw of raws) {
    if (raw.parent === null) {
      continue;
    }
    const siblings = childrenOf.get(raw.parent) ?? [];
    siblings.push(raw);
    childrenOf.set(raw.parent, siblings);
  }
  const ring = childrenOf.get(ROOT_ID) ?? [];

  // raws 是父先子后的前序：父节点坐标必已落定，子节点直接挂靠父节点。
  const placed = new Map<string, OfficeTreeNode>();
  const nodes: OfficeTreeNode[] = [];
  for (const raw of raws) {
    let x = 0;
    let y = 0;
    let z = 0;
    if (raw.depth === 0) {
      y = OFFICE_TREE_GEOMETRY.rootLift;
    } else if (raw.depth === 1) {
      const index = ring.findIndex((node) => node.id === raw.id);
      const theta = Math.PI / 2 + (index / Math.max(1, ring.length)) * Math.PI * 2;
      x = Math.cos(theta) * OFFICE_TREE_GEOMETRY.ringRadiusX;
      z = Math.sin(theta) * OFFICE_TREE_GEOMETRY.ringRadiusZ;
      y = OFFICE_TREE_GEOMETRY.rootLift - OFFICE_TREE_GEOMETRY.levelGap;
    } else {
      const parent = placed.get(raw.parent!)!;
      const siblings = childrenOf.get(raw.parent!) ?? [];
      const index = siblings.findIndex((node) => node.id === raw.id);
      const offset = index - (siblings.length - 1) / 2;
      x = parent.x + offset * OFFICE_TREE_GEOMETRY.slotGap;
      z = parent.z + (raw.depth - 1) * OFFICE_TREE_GEOMETRY.branchForward + offset * 0.6;
      y = parent.y - OFFICE_TREE_GEOMETRY.levelGap;
    }
    const node: OfficeTreeNode = { ...raw, children: raw.children, x, y, z };
    placed.set(raw.id, node);
    nodes.push(node);
  }

  const root = nodes.find((candidate) => candidate.parent === null)!;
  const edges: OfficeTreeEdge[] = nodes
    .filter((candidate) => candidate.parent !== null)
    .map((candidate) => ({
      from: candidate.parent!,
      kind: candidate.kind === "root" ? "office" : candidate.kind,
      to: candidate.id,
    }));

  const minX = nodes.reduce((least, node) => Math.min(least, node.x), Number.POSITIVE_INFINITY);
  const maxX = nodes.reduce((most, node) => Math.max(most, node.x), Number.NEGATIVE_INFINITY);
  const minY = nodes.reduce((least, node) => Math.min(least, node.y), Number.POSITIVE_INFINITY);
  const maxY = nodes.reduce((most, node) => Math.max(most, node.y), Number.NEGATIVE_INFINITY);
  const minZ = nodes.reduce((least, node) => Math.min(least, node.z), Number.POSITIVE_INFINITY);
  const maxZ = nodes.reduce((most, node) => Math.max(most, node.z), Number.NEGATIVE_INFINITY);

  return {
    edges,
    minX,
    minY,
    minZ,
    maxZ,
    nodes,
    root,
    rootId: ROOT_ID,
    width: maxX - minX,
    maxX,
    maxY,
  };
}

/**
 * 折叠 / 展开的可见节点集合：根恒可见，子代仅当父为根或父已展开时可见。
 * expanded 为空集时恰好是「皇帝 + 荣衔组 + 官署分区」共 11 个节点的折叠到分区视图。
 * 坐标始终取自全量布局——展开 / 折叠不重排，只改可见性与镜头取景。
 */
export function visibleNodeIds(
  layout: OfficeTreeLayout,
  expanded: ReadonlySet<string>,
): Set<string> {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const visible = new Set<string>();
  const stack = [layout.rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visible.has(id)) {
      continue;
    }
    visible.add(id);
    const node = byId.get(id);
    if (!node) {
      continue;
    }
    if (id === layout.rootId || expanded.has(id)) {
      stack.push(...node.children);
    }
  }
  return visible;
}

/** 从全量布局里筛出可见子图：坐标不变（展开 / 折叠不重排），边界取可见范围供镜头取景。 */
export function filterOfficeTreeLayout(
  layout: OfficeTreeLayout,
  ids: ReadonlySet<string>,
): OfficeTreeLayout {
  const nodes = layout.nodes.filter((node) => ids.has(node.id));
  const edges = layout.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  const root = nodes.find((node) => node.parent === null) ?? layout.root;
  const minX = nodes.reduce((least, node) => Math.min(least, node.x), Number.POSITIVE_INFINITY);
  const maxX = nodes.reduce((most, node) => Math.max(most, node.x), Number.NEGATIVE_INFINITY);
  const minY = nodes.reduce((least, node) => Math.min(least, node.y), Number.POSITIVE_INFINITY);
  const maxY = nodes.reduce((most, node) => Math.max(most, node.y), Number.NEGATIVE_INFINITY);
  const minZ = nodes.reduce((least, node) => Math.min(least, node.z), Number.POSITIVE_INFINITY);
  const maxZ = nodes.reduce((most, node) => Math.max(most, node.z), Number.NEGATIVE_INFINITY);
  return {
    edges,
    minX,
    minY,
    minZ,
    maxZ,
    nodes,
    root,
    rootId: layout.rootId,
    width: maxX - minX,
    maxX,
    maxY,
  };
}

/* 品级跨度：从 rank 括注字符串里解析品级，汇总成「从某品—至某品」的跨度文本，
   供左侧菜单的分区行与 3D 场景包围框标注「哪一层是哪个品级」。 */

const RANK_ORDER: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const RANK_MATCH = /(正|从)?([一二三四五六七八九])品/g;
const BOTTOM_RANK = /未入流|流外/;

interface RankHit {
  label: string;
  order: number;
}

function parseRankHits(rank: string): RankHit[] {
  const hits: RankHit[] = [];
  if (BOTTOM_RANK.test(rank)) {
    hits.push({ label: "未入流", order: 10 });
  }
  for (const match of rank.matchAll(RANK_MATCH)) {
    hits.push({ label: `${match[1] ?? ""}${match[2]}品`, order: RANK_ORDER[match[2]!] ?? 0 });
  }
  return hits;
}

function walkRanks(node: AtlasOfficeNode, hits: RankHit[]): void {
  if (node.rank) {
    hits.push(...parseRankHits(node.rank));
  }
  for (const child of node.children ?? []) {
    walkRanks(child, hits);
  }
}

function spanText(hits: RankHit[]): string {
  if (hits.length === 0) {
    return "无定品";
  }
  const min = hits.reduce((least, hit) => (hit.order < least.order ? hit : least));
  const max = hits.reduce((greatest, hit) => (hit.order > greatest.order ? hit : greatest));
  return min.order === max.order ? min.label : `${min.label}—${max.label}`;
}

/** 每个官署分区（id = 分区 id）与荣衔簇（id = "honorary"）的品级跨度。 */
export function branchRankSpans(atlas: DynastyAtlas): Map<string, string> {
  const spans = new Map<string, string>();
  const honoraryHits: RankHit[] = [];
  for (const group of atlas.honorary) {
    if (group.rank) {
      honoraryHits.push(...parseRankHits(group.rank));
    }
    for (const child of group.children ?? []) {
      walkRanks(child, honoraryHits);
    }
  }
  spans.set("honorary", spanText(honoraryHits));
  for (const entry of atlas.branches) {
    const hits: RankHit[] = [];
    for (const node of entry.nodes) {
      walkRanks(node, hits);
    }
    spans.set(entry.id, spanText(hits));
  }
  return spans;
}
