import type { AtlasOfficeNode, DynastyAtlas } from "./data";

/**
 * 官制图谱立体树的布局计算（纯函数，不碰 DOM / WebGL）：
 * 把 DynastyAtlas 的「皇权 → 荣衔 → 六类官署分区 → 属官」层级关系
 * 摊成一棵可绘制的三维径向整齐树（tidy radial tree）。
 *
 * 与 rank-tree-layout 的「品级分层」不同，这里是一棵真正的从属树：
 * 皇权居中在上，直属子节点按「叶子数占比」分得第一道椭圆环上的扇区，
 * 属官按深度落到逐层外扩的同心环上（一圈一代人），角度取后代叶子的均值——
 * 子代聚拢在父代角附近，纵向再按深度下沉。扇区随族大小伸缩、角度槽两两错开，
 * 从任何视角都不是一条线，也保证不了任何两枚节点落到同一点。
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
  /** 读图注释：同职异称、从属关系、口径说明等语义。 */
  annotation?: string;
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
  /**
   * 每一级向下的纵向间距。取景由全树宽度主导，加高纵向不会推远相机——
   * 这是屏幕上真正能把层与层拉开的参数，别为了「紧凑」调小它。
   */
  levelGap: 6.2,
  /**
   * 同心深度环：depth d 的节点落在椭圆环 (ringRadiusX + (d-1)·ringStepX,
   * ringRadiusZ + (d-1)·ringStepZ) 上。皇权居中在上，直属子节点铺第一道环，
   * 属官按深度落到更外圈——「一圈一代人」，俯视即见同心圆层级。
   * x 半径决定取景宽度（放大它会等比例拉远相机，屏幕间距不变）；
   * z 半径只进取景深度且带 0.75 权重，放大它能真正在屏幕上摊开前后排。
   * z 再放大（>9.2/3.3）会压到「子代聚拢父代」的 xz 同向守卫（明·内阁端部
   * 属官 dot 跌到 0.2 以下），前后排松了、父子朝向却散了——两害相权不再加。
   */
  ringRadiusX: 12,
  ringRadiusZ: 9.2,
  /** 每深一层，环向外扩的步长。 */
  ringStepX: 3.5,
  ringStepZ: 3.3,
  /**
   * 族扇区平滑项：每个直属子族（荣衔组 / 官署分区）按「叶子数 + sectorSmooth +
   * sectorQuadratic·叶子数²」分得环上的弧长——衙署多的分区自动拿到更宽的弧，
   * 避免族内拥挤。
   */
  sectorSmooth: 3,
  /**
   * 族扇区超线性项：权重里的 K·L² 让密集分区（清·佐理部 37 叶、明·内阁 29 叶）
   * 拿到比纯线性比例更宽的扇区，同环相邻原子的角度步长随之放宽——展开后
   * 原子名称更容易彼此分开。再大就顶到「子代聚拢父代」守卫（明·内阁端部
   * 属官 xz 同向 dot ≥ 0.2，当前余量 0.023），端部属官会绕到父代对侧。
   */
  sectorQuadratic: 0.008,
  /** 根节点高于第一道环的距离。 */
  rootLift: 2.2,
} as const;

/** 第一族在环上的起始角（正后方），族沿逆时针依次铺开。 */
const START_ANGLE = -Math.PI / 2;

/** 把朝代数据摊成一棵以皇权为根的从属树（尚未定位坐标）。 */
interface RawNode {
  id: string;
  kind: OfficeNodeKind;
  mark?: string;
  note?: string;
  annotation?: string;
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
    annotation: node.annotation,
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
  // 荣衔与官署共用同一套递归挂载：节点自身先入树，再递归挂全部后代。
  // 旧版荣衔只用 rawFromOfficeNode 挂一层，孙节点会静默丢失、永远不渲染。
  const attach = (parentId: string, depth: number, node: AtlasOfficeNode) => {
    const raw = rawFromOfficeNode(parentId, depth, node);
    register(raw);
    index.get(parentId)?.children.push(node.id);
    for (const child of node.children ?? []) {
      attach(node.id, depth + 1, child);
    }
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
      attach(group.id, 2, child);
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
    for (const node of branch.nodes) {
      attach(branch.id, 2, node);
    }
  }

  return raws;
}

export function layoutOfficeTree(atlas: DynastyAtlas): OfficeTreeLayout {
  const raws = buildOfficeTree(atlas);

  const childrenOf = new Map<string, RawNode[]>();
  for (const raw of raws) {
    if (raw.parent === null) {
      continue;
    }
    const siblings = childrenOf.get(raw.parent) ?? [];
    siblings.push(raw);
    childrenOf.set(raw.parent, siblings);
  }
  const index = new Map(raws.map((raw) => [raw.id, raw]));

  // —— 角度：径向整齐树（tidy radial tree）——
  // 直属子族（荣衔组 / 官署分区）按「叶子数 + sectorSmooth + sectorQuadratic·叶子数²」
  // 分得椭圆环上的扇区：平滑项保住小族的最小弧长，超线性项让密集分区（清·佐理部
  // 37 叶）拿到比纯线性比例更宽的弧——同环相邻原子角度步长放宽，展开后名称更易分开。
  // 族内叶子按序铺满扇区（角度槽两两错开），内部节点取全部后代叶子的角度均值：
  // 子代永远聚拢在父代角附近，衙署多的分区自动拿到更宽的弧，
  // 任何两枚节点都不会落到同一点。旧版按兄弟序号沿 x 轴排开再向 +z「向前垂落」，
  // 环后侧的子代反而被推进环内与中心相撞，且同层横向跨度挤爆扇区。
  const leafCount = (id: string): number => {
    const raw = index.get(id);
    if (!raw || raw.children.length === 0) {
      return 1;
    }
    return raw.children.reduce((sum, child) => sum + leafCount(child), 0);
  };
  /** 族权重：线性叶子数 + 平滑下限 + 超线性密集项（见 OFFICE_TREE_GEOMETRY 注释）。 */
  const familyWeight = (leaves: number): number =>
    leaves +
    OFFICE_TREE_GEOMETRY.sectorSmooth +
    OFFICE_TREE_GEOMETRY.sectorQuadratic * leaves * leaves;
  const families = childrenOf.get(ROOT_ID) ?? [];
  const totalWeight = families.reduce((sum, family) => sum + familyWeight(leafCount(family.id)), 0);
  const angleOf = new Map<string, number>();
  let familyStart = START_ANGLE;
  for (const family of families) {
    const leaves = leafCount(family.id);
    const span = (familyWeight(leaves) / Math.max(1, totalWeight)) * Math.PI * 2;
    const step = span / Math.max(1, leaves);
    let leafCursor = familyStart;
    const assign = (raw: RawNode): number => {
      if (raw.children.length === 0) {
        const angle = leafCursor + step / 2;
        leafCursor += step;
        angleOf.set(raw.id, angle);
        return angle;
      }
      const childAngles = raw.children.map((childId) => assign(index.get(childId)!));
      const angle = childAngles.reduce((sum, angle) => sum + angle, 0) / childAngles.length;
      angleOf.set(raw.id, angle);
      return angle;
    };
    angleOf.set(family.id, assign(family));
    familyStart += span;
  }

  // —— 坐标：同心深度环 ——
  // depth d 的节点落在椭圆环 (ringRadiusX + (d-1)·ringStepX, ringRadiusZ + (d-1)·ringStepZ)
  // 上，纵向每层再下沉 levelGap：俯视一圈即一代，侧视呈瀑布式下沉，层级一眼可辨。
  const nodes: OfficeTreeNode[] = [];
  for (const raw of raws) {
    let x = 0;
    let y = 0;
    let z = 0;
    if (raw.depth === 0) {
      y = OFFICE_TREE_GEOMETRY.rootLift;
    } else {
      const ring = raw.depth - 1;
      const angle = angleOf.get(raw.id) ?? START_ANGLE;
      x =
        Math.cos(angle) *
        (OFFICE_TREE_GEOMETRY.ringRadiusX + ring * OFFICE_TREE_GEOMETRY.ringStepX);
      z =
        Math.sin(angle) *
        (OFFICE_TREE_GEOMETRY.ringRadiusZ + ring * OFFICE_TREE_GEOMETRY.ringStepZ);
      y = OFFICE_TREE_GEOMETRY.rootLift - raw.depth * OFFICE_TREE_GEOMETRY.levelGap;
    }
    const node: OfficeTreeNode = { ...raw, children: raw.children, x, y, z };
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

/**
 * 从品级括注里解析出标准品级标签（「正一品」「从三品」「未入流」），
 * 供品级跨度汇总与详情面板的「品级实档」对位共用。
 * 复合括注（如「尚书 从一品 · 侍郎 正二品」）解析出全部命中，加衔类文字返回空。
 */
export function parseRankLabels(rank: string): string[] {
  const labels: string[] = [];
  if (BOTTOM_RANK.test(rank)) {
    labels.push("未入流");
  }
  for (const match of rank.matchAll(RANK_MATCH)) {
    labels.push(`${match[1] ?? ""}${match[2]}品`);
  }
  return labels;
}

function parseRankHits(rank: string): RankHit[] {
  return parseRankLabels(rank).map((label) => ({
    label,
    order: label === "未入流" ? 10 : (RANK_ORDER[label.slice(1, 2)] ?? 0),
  }));
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
