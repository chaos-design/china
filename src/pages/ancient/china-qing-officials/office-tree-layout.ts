import type { AtlasOfficeNode, DynastyAtlas } from "./data";

/**
 * 官制图谱立体树的布局计算（纯函数，不碰 DOM / WebGL）：
 * 把 DynastyAtlas 的「皇权 → 荣衔 → 六类官署分区 → 属官」层级关系
 * 摊成一棵可绘制的三维径向下降树。
 *
 * 与 rank-tree-layout 的「品级分层」不同，这里是一棵真正的从属树：
 * 节点父子随数据嵌套，叶子按序分配横向槽位（tidy tree），
 * 内节点取子代中轴；纵向按深度下沉；再叠一条抛物 z 弧，
 * 让树冠有纵深、旋转时呈「立体」而非平面的观感。
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
  width: number;
  /** 根节点（皇权）位置，画布取景中心参考。 */
}

export const OFFICE_TREE_GEOMETRY = {
  /** 每层深度对应的纵向间距（越大越像图二那种高瘦层级树）。 */
  levelGap: 3.2,
  /** 相邻叶子的横向间距（越大标签越不易互相覆盖）。 */
  slotGap: 1.6,
  /** z 弧强度：树冠外沿向后的弯曲程度（随树宽放大需调小，避免远端被透视压扁）。 */
  zCurve: 0.0012,
  /** 根节点高于最高层的距离。 */
  rootLift: 1.6,
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
  /** 该叶子占用的槽位数（荣衔封号标签更宽，占多槽防相邻标签重叠）。 */
  slotWeight?: number;
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
      const childRaw = rawFromOfficeNode(group.id, 2, child);
      childRaw.slotWeight = 5;
      register(childRaw);
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

/** tidy tree：叶子按序占横向槽位，内节点居中于子代。 */
function assignSlots(raws: RawNode[]): Map<string, number> {
  const slots = new Map<string, number>();
  const childOf = new Map<string, string[]>();
  for (const raw of raws) {
    if (raw.parent !== null) {
      const siblings = childOf.get(raw.parent) ?? [];
      siblings.push(raw.id);
      childOf.set(raw.parent, siblings);
    }
  }

  let cursor = 0;
  const weightOf = new Map(raws.map((raw) => [raw.id, raw.slotWeight ?? 1]));
  const layout = (id: string): number => {
    const kids = childOf.get(id) ?? [];
    if (kids.length === 0) {
      slots.set(id, cursor);
      const slot = cursor;
      cursor += weightOf.get(id) ?? 1;
      return slot;
    }
    let first = Number.POSITIVE_INFINITY;
    let last = Number.NEGATIVE_INFINITY;
    for (const kid of kids) {
      const slot = layout(kid);
      first = Math.min(first, slot);
      last = Math.max(last, slot);
    }
    const slot = (first + last) / 2;
    slots.set(id, slot);
    return slot;
  };

  const root = raws.find((candidate) => candidate.parent === null)!;
  layout(root.id);
  return slots;
}

export function layoutOfficeTree(atlas: DynastyAtlas): OfficeTreeLayout {
  const raws = buildOfficeTree(atlas);
  const slots = assignSlots(raws);

  // 以槽位中心为 0，让树在 x 轴对称，z 弧才呈中轴对称的碗状纵深。
  const slotX = raws.map((raw) => (slots.get(raw.id) ?? 0) * OFFICE_TREE_GEOMETRY.slotGap);
  const rawMinX = slotX.reduce((least, value) => Math.min(least, value), Number.POSITIVE_INFINITY);
  const rawMaxX = slotX.reduce((most, value) => Math.max(most, value), Number.NEGATIVE_INFINITY);
  const centerX = (rawMinX + rawMaxX) / 2;

  const nodes: OfficeTreeNode[] = raws.map((raw, index) => {
    const x = slotX[index]! - centerX;
    const y = -(raw.depth * OFFICE_TREE_GEOMETRY.levelGap) + OFFICE_TREE_GEOMETRY.rootLift;
    const z = -OFFICE_TREE_GEOMETRY.zCurve * x * x;
    return {
      ...raw,
      children: raw.children,
      x,
      y,
      z,
    };
  });

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

  return {
    edges,
    minX,
    minY,
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
  return {
    edges,
    minX,
    minY,
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
