import type {
  OfficialGrade,
  OfficialPost,
  OfficialsDynasty,
  OfficialsDynastyId,
} from "../china-officials/officials-data";

/**
 * 立体品级树的布局计算（纯函数，不碰 DOM / WebGL）：
 * 把一朝「品级 → 官职」的两层从属关系摊成可绘制的三维坐标。
 * 数据源是 officials-data.ts 的完整官职名录；品序直接取 `grade.order`
 * （0 超品、1…9 品、10 流外），与 RANK_RULER 同轴；秦汉的「约当 N 品」
 * 由 grade.approx 携带，仅作标注，不参与布局换算。
 *
 * 两条竖轴口径：
 * - `even`：每级等距，看结构最清楚；
 * - `band`：按品序对齐，两朝并置时同一高度即同一品，纵向留白就是这一朝没有设官的品级。
 *
 * 文武双枝：`split: "branch"` 时树干在皇权下方分叉，文枝沿左（-x）、武枝沿右（+x）
 * 逐层下垂，每级留一个挂枝锚点，官职节点由锚点接出短梗；
 * `split: "merged"` 时仍是单环散点，不绘双枝（bough 为空数组）。
 */

export type RankTreeSpan = "even" | "band";
export type RankTreeSplit = "merged" | "branch";

export const TREE_GEOMETRY = {
  /** 等距模式的层间距。 */
  evenGap: 2.7,
  /** 品序模式的每一品间距。 */
  bandGap: 2.8,
  /** 官职环的基础半径。 */
  baseRadius: 3.4,
  /** 每多一位属官，环半径增加的量。 */
  radiusPerOffice: 0.55,
  /** 官职环半径上限，防止多官层级撑得过宽。 */
  maxNodeRadius: 8.6,
  /** 平台比官职环外扩的余量。 */
  plateMargin: 0.85,
  /** 官职节点悬于平台之上的高度。 */
  officeLift: 0.78,
  /** 皇权根节点高于最高层的距离。 */
  rootLift: 2.0,
  /** 双朝并置时两棵树之间的净距。 */
  columnGap: 4.2,
  /** 皇权根节点到文武分叉点的距离。 */
  forkDrop: 0.85,
  /** 枝锚点相对本级官职环半径的内缩比例。 */
  anchorInset: 0.52,
  /** 枝锚点离树干轴的最近距离。 */
  anchorMinX: 1.15,
  /** 枝锚点高于平台的高度。 */
  anchorLift: 0.5,
} as const;

/** 超品在品序轴上的取值：高于一品。 */
export const SUPER_GRADE_BAND = 0;
/** 流外 / 品外在品序轴上的取值：低于九品。 */
export const OUT_OF_RANK_BAND = 10;

export const RANK_RULER: readonly { band: number; label: string }[] = [
  { band: SUPER_GRADE_BAND, label: "超品" },
  { band: 1, label: "一品" },
  { band: 2, label: "二品" },
  { band: 3, label: "三品" },
  { band: 4, label: "四品" },
  { band: 5, label: "五品" },
  { band: 6, label: "六品" },
  { band: 7, label: "七品" },
  { band: 8, label: "八品" },
  { band: 9, label: "九品" },
  { band: OUT_OF_RANK_BAND, label: "流外" },
];

export interface RankTreeVec3 {
  x: number;
  y: number;
  z: number;
}

export interface RankTreeTier {
  /** 文枝挂枝锚点（-x 侧）。 */
  civilAnchor: RankTreeVec3;
  /** 文官数。 */
  civilCount: number;
  grade: OfficialGrade;
  gradeIndex: number;
  /** 武枝挂枝锚点（+x 侧）。 */
  militaryAnchor: RankTreeVec3;
  /** 武官数。 */
  militaryCount: number;
  officeCount: number;
  /** 平台半径（含外扩余量）。 */
  plateRadius: number;
  /** 官职环半径。 */
  radius: number;
  /** 布局用的品序值（0 超品、1-9 品、10 流外）。 */
  band: number;
  y: number;
}

export interface RankTreeNode {
  angle: number;
  band: number;
  gradeIndex: number;
  /** 稳定标识：`朝代:品级id:官名`。 */
  id: string;
  post: OfficialPost;
  x: number;
  y: number;
  z: number;
}

/** 场景条目只需 id / 名称 / 年代，不依赖具体数据模块。 */
export interface RankTreeDynastyMeta {
  id: OfficialsDynastyId;
  name: string;
  period: string;
}

export interface RankTreeLayout {
  bottomY: number;
  /** 文枝自顶向下的锚点序列（含分叉点）；合列模式为空。 */
  civilBough: RankTreeVec3[];
  dynastyId: OfficialsDynastyId;
  /** 文武分叉点（树干上、皇权下方）。 */
  fork: RankTreeVec3;
  maxRadius: number;
  /** 武枝自顶向下的锚点序列（含分叉点）；合列模式为空。 */
  militaryBough: RankTreeVec3[];
  minY: number;
  maxY: number;
  nodes: RankTreeNode[];
  /** 皇权根节点位置（树干顶端）。 */
  root: RankTreeVec3;
  tiers: RankTreeTier[];
  topY: number;
  trunk: { bottom: number; top: number };
  /** 树冠横向直径（含平台余量）。 */
  width: number;
}

/** 官职环半径：属官越多，平台越宽——树冠的胖瘦本身就是职数的读数。 */
export function nodeRingRadius(officeCount: number): number {
  const raw = TREE_GEOMETRY.baseRadius + officeCount * TREE_GEOMETRY.radiusPerOffice;
  return Math.min(TREE_GEOMETRY.maxNodeRadius, raw);
}

/** 品序值转可读标签：0 超品、10 流外、半格读作「从N品」。 */
export function formatBandLabel(band: number): string {
  if (band === SUPER_GRADE_BAND) {
    return "超品";
  }
  if (band >= OUT_OF_RANK_BAND) {
    return "流外";
  }
  const whole = Math.floor(band);
  const numeral =
    Object.entries(CHINESE_NUMERALS).find(([, value]) => value === whole)?.[0] ?? whole;
  return band > whole ? `从${numeral}品` : `${numeral}品`;
}

const CHINESE_NUMERALS: Record<string, number> = {
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

function spreadAngles(count: number): number[] {
  // 正前方留出空位给品级牌，节点从偏侧起排。
  const front = Math.PI / 2 + 0.55;
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [front];
  }
  return Array.from({ length: count }, (_, index) => front + (index * Math.PI * 2) / count);
}

/** 文武分列时，文官占左半环、武官占右半环（默认镜头从 +z 看）。 */
function sectorAngles(count: number, branch: "civil" | "military"): number[] {
  const gap = 0.5;
  const front = Math.PI / 2;
  const start = branch === "civil" ? front + gap : -front + gap;
  const end = branch === "civil" ? front + Math.PI - gap : front - gap;
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [(start + end) / 2];
  }
  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
}

function tierAngles(grade: OfficialGrade, split: RankTreeSplit): Map<string, number> {
  const angles = new Map<string, number>();

  if (split === "branch") {
    for (const branch of ["civil", "military"] as const) {
      const posts = grade.posts.filter((post) => post.branch === branch);
      const branches = sectorAngles(posts.length, branch);
      posts.forEach((post, index) => {
        angles.set(post.title, branches[index] ?? Math.PI / 2);
      });
    }
    return angles;
  }

  const merged = spreadAngles(grade.posts.length);
  grade.posts.forEach((post, index) => {
    angles.set(post.title, merged[index] ?? Math.PI / 2);
  });
  return angles;
}

/** 枝锚点：沿 ±x 内缩到官职环内侧，略高于平台，逐层下垂成枝。 */
function branchAnchor(radius: number, side: 1 | -1, y: number): RankTreeVec3 {
  return {
    x: side * Math.max(radius * TREE_GEOMETRY.anchorInset, TREE_GEOMETRY.anchorMinX),
    y,
    z: 0,
  };
}

export function layoutRankTree(
  dynasty: OfficialsDynasty,
  options: { span: RankTreeSpan; split: RankTreeSplit },
): RankTreeLayout {
  const gradeCount = dynasty.grades.length;
  const tiers: RankTreeTier[] = [];
  const nodes: RankTreeNode[] = [];

  dynasty.grades.forEach((grade, gradeIndex) => {
    const band = grade.order;
    const radius = nodeRingRadius(grade.posts.length);
    const y =
      options.span === "band"
        ? (OUT_OF_RANK_BAND - band) * TREE_GEOMETRY.bandGap
        : (gradeCount - 1 - gradeIndex) * TREE_GEOMETRY.evenGap;
    const civilCount = grade.posts.filter((post) => post.branch === "civil").length;

    tiers.push({
      band,
      civilAnchor: branchAnchor(radius, -1, y + TREE_GEOMETRY.anchorLift),
      civilCount,
      grade,
      gradeIndex,
      militaryAnchor: branchAnchor(radius, 1, y + TREE_GEOMETRY.anchorLift),
      militaryCount: grade.posts.length - civilCount,
      officeCount: grade.posts.length,
      plateRadius: radius + TREE_GEOMETRY.plateMargin,
      radius,
      y,
    });

    const angles = tierAngles(grade, options.split);
    grade.posts.forEach((post) => {
      const angle = angles.get(post.title) ?? Math.PI / 2;
      nodes.push({
        angle,
        band,
        gradeIndex,
        id: `${dynasty.id}:${grade.id}:${post.title}`,
        post,
        x: Math.cos(angle) * radius,
        y: y + TREE_GEOMETRY.officeLift,
        z: Math.sin(angle) * radius,
      });
    });
  });

  const topTier = tiers[0];
  const bottomTier = tiers[tiers.length - 1];
  const topY = topTier?.y ?? 0;
  const bottomY = bottomTier?.y ?? 0;
  const maxRadius = tiers.reduce((widest, tier) => Math.max(widest, tier.plateRadius), 0);
  const rootY = topY + TREE_GEOMETRY.rootLift;
  const fork: RankTreeVec3 = { x: 0, y: rootY - TREE_GEOMETRY.forkDrop, z: 0 };
  const withBoughs = options.split === "branch" && tiers.length > 0;

  return {
    bottomY,
    civilBough: withBoughs ? [fork, ...tiers.map((tier) => tier.civilAnchor)] : [],
    dynastyId: dynasty.id,
    fork,
    maxRadius,
    militaryBough: withBoughs ? [fork, ...tiers.map((tier) => tier.militaryAnchor)] : [],
    minY: bottomY - 1.5,
    maxY: rootY + 0.9,
    nodes,
    root: { x: 0, y: rootY, z: 0 },
    tiers,
    topY,
    trunk: { bottom: bottomY - 0.55, top: rootY },
    width: maxRadius * 2,
  };
}

export interface ComparableGrade {
  band: number;
  /** 是否正好同品；false 表示就近取层。 */
  exact: boolean;
  grade: OfficialGrade;
  gradeIndex: number;
}

/**
 * 跨朝找「同一品」的层：先取完全同品，再看最近品序；
 * 距离相同取靠上的层级（品高者优先）。
 */
export function findComparableGrade(
  dynasty: OfficialsDynasty,
  band: number,
): ComparableGrade | null {
  let best: ComparableGrade | null = null;

  dynasty.grades.forEach((grade, gradeIndex) => {
    const gradeBand = grade.order;
    if (!best) {
      best = { band: gradeBand, exact: gradeBand === band, grade, gradeIndex };
      return;
    }
    const distance = Math.abs(gradeBand - band);
    const bestDistance = Math.abs(best.band - band);
    if (distance < bestDistance) {
      best = { band: gradeBand, exact: gradeBand === band, grade, gradeIndex };
    }
  });

  return best;
}

/** 双朝并置时各自圆心的 x 偏移：两棵树的树冠不重叠。 */
export function compareColumnOffsets(
  main: RankTreeLayout,
  compare: RankTreeLayout | null,
): { main: number; compare: number; width: number } {
  if (!compare) {
    return { compare: 0, main: 0, width: main.width };
  }
  const half = (main.maxRadius + compare.maxRadius + TREE_GEOMETRY.columnGap) / 2;
  return {
    compare: half,
    main: -half,
    width: (half + Math.max(main.maxRadius, compare.maxRadius)) * 2,
  };
}
