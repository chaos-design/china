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
  /** 相邻叶子的横向间距（越小树越窄，配合 z 弧呈立体扇面）。 */
  slotGap: 0.6,
  /** z 弧强度：树冠外沿向后的弯曲程度（越小越平、越易读）。 */
  zCurve: 0.006,
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
  const layout = (id: string): number => {
    const kids = childOf.get(id) ?? [];
    if (kids.length === 0) {
      slots.set(id, cursor);
      const slot = cursor;
      cursor += 1;
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
