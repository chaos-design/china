import type { RankDynasty, RankDynastyId, RankLevel } from "./types";

/**
 * 立体品级树的布局计算（纯函数，不碰 DOM / WebGL）：
 * 把一朝「品级 → 官职」的两层从属关系摊成可绘制的三维坐标。
 *
 * 两条竖轴口径：
 * - `even`：每级等距，看结构最清楚；
 * - `band`：按品序对齐（超品 0、一品 1…九品 9、流外 10），
 *   两朝并置时同一高度即同一品，纵向留白就是这一朝没有设官的品级。
 *
 * 秦汉无品，用数据里的「约当 N 品」；其余朝代从「二品 · 三品」这类
 * 层名里取首个数字；元代「路府州县」无所属品，按前后层级内插。
 * 内插只发生在布局层，不改动 `rank-data.ts` 的史料口径。
 */

export type RankTreeSpan = "even" | "band";
export type RankTreeSplit = "merged" | "branch";

export const TREE_GEOMETRY = {
  /** 等距模式的层间距。 */
  evenGap: 2.7,
  /** 品序模式的每一品间距；正/从之间占半格。 */
  bandGap: 2.8,
  /** 官职环的基础半径。 */
  baseRadius: 4.2,
  /** 每多一位属官，环半径增加的量。 */
  radiusPerOffice: 0.78,
  /** 官职环半径上限，防止四官层级撑得过宽。 */
  maxNodeRadius: 7.4,
  /** 平台比官职环外扩的余量。 */
  plateMargin: 0.85,
  /** 官职节点悬于平台之上的高度。 */
  officeLift: 0.78,
  /** 皇权根节点高于最高层的距离。 */
  rootLift: 2.0,
  /** 双朝并置时两棵树之间的净距。 */
  columnGap: 4.2,
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

export interface RankTreeTier {
  /** 文官数。 */
  civilCount: number;
  /** 层级名，如「二品 · 三品」「万石」。 */
  grade: string;
  level: RankLevel;
  levelIndex: number;
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
  /** 稳定标识：`朝代:层序:官名`。 */
  id: string;
  levelIndex: number;
  office: RankLevel["offices"][number];
  x: number;
  y: number;
  z: number;
}

export interface RankTreeLayout {
  dynastyId: RankDynastyId;
  /** 最高层与最低层的 y。 */
  bottomY: number;
  maxRadius: number;
  minY: number;
  maxY: number;
  nodes: RankTreeNode[];
  /** 皇权根节点位置（树干顶端）。 */
  root: { x: number; y: number; z: number };
  tiers: RankTreeTier[];
  topY: number;
  trunk: { bottom: number; top: number };
  /** 树冠横向直径（含平台余量）。 */
  width: number;
}

/**
 * 把层名解析为品序值：超品 0、流外 10、其余取层名中的首个中文数字。
 * 秦汉等无「品」的秩石层由数据里的 approxGrade 提供。
 */
export function resolveLevelBand(level: RankLevel): number | null {
  if (level.grade.includes("超品")) {
    return SUPER_GRADE_BAND;
  }
  if (level.outOfRank === true) {
    return OUT_OF_RANK_BAND;
  }
  if (level.approxGrade !== undefined) {
    return level.approxGrade;
  }
  const numeral = level.grade.match(/[一二三四五六七八九]/);
  if (!numeral) {
    return null;
  }
  const value = CHINESE_NUMERALS[numeral[0]];
  if (value === undefined) {
    return null;
  }
  // 正 / 从是相邻两阶：从一品落在正一品与正二品之间，占半格。
  return level.grade.startsWith("从") ? value + 0.5 : value;
}

/**
 * 为缺品序的层级（如元「路府州县」）按前后层内插，并压成严格递增，
 * 保证同一朝内不会有两层落在同一高度。
 */
export function fillLevelBands(rawBands: readonly (number | null)[]): number[] {
  const bands = rawBands.map((band) => band);

  for (let index = 0; index < bands.length; index += 1) {
    if (bands[index] !== null) {
      continue;
    }
    let prev = -1;
    for (let bandIndex = index - 1; bandIndex >= 0; bandIndex -= 1) {
      if (bands[bandIndex] !== null) {
        prev = bandIndex;
        break;
      }
    }
    const next = bands.findIndex((band, bandIndex) => bandIndex > index && band !== null);

    if (prev >= 0 && next >= 0) {
      const prevBand = bands[prev] ?? 0;
      const nextBand = bands[next] ?? prevBand;
      bands[index] =
        Math.round((prevBand + ((nextBand - prevBand) * (index - prev)) / (next - prev)) * 2) / 2;
    } else if (prev >= 0) {
      bands[index] = Math.min(OUT_OF_RANK_BAND, (bands[prev] ?? 0) + (index - prev));
    } else if (next >= 0) {
      bands[index] = Math.max(0, (bands[next] ?? 0) - (next - index));
    } else {
      bands[index] = index;
    }
  }

  const resolved = bands.map((band) => band ?? 0);

  for (let index = 1; index < resolved.length; index += 1) {
    const prevBand = resolved[index - 1] ?? 0;
    if ((resolved[index] ?? 0) <= prevBand) {
      resolved[index] = Math.min(OUT_OF_RANK_BAND, prevBand + 0.5);
    }
  }

  // 品序轴只有 0…10 格：越界时整体平移回来，保持相对高低。
  const last = resolved.length - 1;
  if (last >= 0) {
    const overflow = (resolved[last] ?? 0) - OUT_OF_RANK_BAND;
    if (overflow > 0) {
      for (let index = 0; index <= last; index += 1) {
        resolved[index] = (resolved[index] ?? 0) - overflow;
      }
    }
    const underflow = resolved[0] ?? 0;
    if (underflow < 0) {
      for (let index = 0; index <= last; index += 1) {
        resolved[index] = (resolved[index] ?? 0) - underflow;
      }
    }
  }

  return resolved;
}

export function resolveDynastyBands(dynasty: RankDynasty): number[] {
  return fillLevelBands(dynasty.levels.map(resolveLevelBand));
}

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

/** 官职环半径：属官越多，平台越宽——树冠的胖瘦本身就是职数的读数。 */
export function nodeRingRadius(officeCount: number): number {
  const raw = TREE_GEOMETRY.baseRadius + officeCount * TREE_GEOMETRY.radiusPerOffice;
  return Math.min(TREE_GEOMETRY.maxNodeRadius, raw);
}

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

function tierAngles(level: RankLevel, split: RankTreeSplit): Map<string, number> {
  const angles = new Map<string, number>();

  if (split === "branch") {
    for (const branch of ["civil", "military"] as const) {
      const offices = level.offices.filter((office) => office.branch === branch);
      const branches = sectorAngles(offices.length, branch);
      offices.forEach((office, index) => {
        angles.set(office.title, branches[index] ?? Math.PI / 2);
      });
    }
    return angles;
  }

  const merged = spreadAngles(level.offices.length);
  level.offices.forEach((office, index) => {
    angles.set(office.title, merged[index] ?? Math.PI / 2);
  });
  return angles;
}

export function layoutRankTree(
  dynasty: RankDynasty,
  options: { span: RankTreeSpan; split: RankTreeSplit },
): RankTreeLayout {
  const bands = resolveDynastyBands(dynasty);
  const levelCount = dynasty.levels.length;
  const tiers: RankTreeTier[] = [];
  const nodes: RankTreeNode[] = [];

  dynasty.levels.forEach((level, levelIndex) => {
    const band = bands[levelIndex] ?? levelIndex;
    const radius = nodeRingRadius(level.offices.length);
    const y =
      options.span === "band"
        ? (OUT_OF_RANK_BAND - band) * TREE_GEOMETRY.bandGap
        : (levelCount - 1 - levelIndex) * TREE_GEOMETRY.evenGap;

    tiers.push({
      band,
      civilCount: level.offices.filter((office) => office.branch === "civil").length,
      grade: level.grade,
      level,
      levelIndex,
      militaryCount: level.offices.filter((office) => office.branch === "military").length,
      officeCount: level.offices.length,
      plateRadius: radius + TREE_GEOMETRY.plateMargin,
      radius,
      y,
    });

    const angles = tierAngles(level, options.split);
    level.offices.forEach((office) => {
      const angle = angles.get(office.title) ?? Math.PI / 2;
      nodes.push({
        angle,
        band,
        id: `${dynasty.id}:${level.grade}:${office.title}`,
        levelIndex,
        office,
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

  return {
    bottomY,
    dynastyId: dynasty.id,
    maxRadius,
    maxY: rootY + 0.9,
    minY: bottomY - 1.5,
    nodes,
    root: { x: 0, y: rootY, z: 0 },
    tiers,
    topY,
    trunk: { bottom: bottomY - 0.55, top: rootY },
    width: maxRadius * 2,
  };
}

export interface ComparableTier {
  band: number;
  /** 是否正好同品；false 表示就近取层。 */
  exact: boolean;
  level: RankLevel;
  levelIndex: number;
}

/**
 * 跨朝找「同一品」的层：先取完全同品，再看最近品序；
 * 距离相同取靠上的层级（品高者优先）。
 */
export function findComparableTier(dynasty: RankDynasty, band: number): ComparableTier | null {
  const bands = resolveDynastyBands(dynasty);
  let best: ComparableTier | null = null;

  dynasty.levels.forEach((level, levelIndex) => {
    const tierBand = bands[levelIndex] ?? levelIndex;
    if (!best) {
      best = { band: tierBand, exact: tierBand === band, level, levelIndex };
      return;
    }
    const distance = Math.abs(tierBand - band);
    const bestDistance = Math.abs(best.band - band);
    if (distance < bestDistance) {
      best = { band: tierBand, exact: tierBand === band, level, levelIndex };
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
