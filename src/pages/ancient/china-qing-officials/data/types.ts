import type { OfficialsDynastyId } from "../../china-officials/officials-data";

/**
 * 图谱朝代口径：与全站职官名录共用的 id 里去掉合并的「隋唐」（图谱里已拆成隋、唐），
 * 再补入只在官制图谱展开的朝代。后者不进入「品级纵横」名录，单独成类型以免牵动别的页面。
 * 「辽金西夏」也已拆成辽、金、西夏，不再作为图谱 id。
 */
export type AtlasDynastyId =
  | Exclude<OfficialsDynastyId, "suitang">
  | "zhou"
  | "beiwei"
  | "wudai"
  | "sui"
  | "tang"
  | "liao"
  | "jin"
  | "xixia";

/**
 * 官制图谱的朝代数据层类型。
 *
 * 两棵树的语义固定：hierarchy 是《清朝官职制度》一图的「机构从属」，
 * rank 是《九品十八级》一图的「品秩阶梯 + 服色礼制」。各朝填入自己的内容，
 * 页面组件只依赖这些类型，不再认识任何具体朝代。
 */

export interface AtlasOfficeNode {
  id: string;
  title: string;
  rank?: string;
  note?: string;
  children?: readonly AtlasOfficeNode[];
}

export interface AtlasOfficeBranch {
  /** 分支角标，一字概括（中/佐/帝/省/藩/地…）。 */
  mark: string;
  id: string;
  summary: string;
  title: string;
  nodes: readonly AtlasOfficeNode[];
}

export interface AtlasHonorGroup {
  id: string;
  rank?: string;
  title: string;
  children?: readonly AtlasOfficeNode[];
}

export interface AtlasRankLevel {
  /** 品序，0 为超品 / 无品最高等，1—9 为九品，10 为流外。 */
  order: number;
  label: string;
  grade: "正" | "从" | "—";
  offices: string;
  hat?: string;
  hatBeads?: string;
  hatColor?: string;
  robe?: string;
  robeColor?: string;
  /** 俸禄柱高的相对值（以本朝最高等为 100）。 */
  salary: number;
  salaryLabel?: string;
}

export interface AtlasBadge {
  order: number;
  animal: string;
}

export interface AtlasLadderGroup {
  label: string;
  note: string;
  orders: readonly number[];
  /** 组内正/从筛选（同品序正从分行的阶梯用；缺省不过滤）。 */
  grade?: AtlasRankLevel["grade"];
}

export interface AtlasRankNotes {
  rank: string;
  hat: string;
  robe: string;
  salary: string;
  ritual: string;
  badge: string;
}

export interface DynastyAtlas {
  id: AtlasDynastyId;
  name: string;
  period: string;
  system: string;
  source: string;
  /** 页头一句话总纲。 */
  intro: string;

  root: { title: string; note: string };
  honorary: readonly AtlasHonorGroup[];
  branches: readonly AtlasOfficeBranch[];
  hierarchyNote: string;

  rankSystemLabel: string;
  rankIntro: string;
  levels: readonly AtlasRankLevel[];
  ladderGroups: readonly AtlasLadderGroup[];
  /** 补子为明清定制；无补子的朝代给出一句制度说明。 */
  badgesAvailable: boolean;
  civilBadges: readonly AtlasBadge[];
  militaryBadges: readonly AtlasBadge[];
  badgeNote: string;
  notes: AtlasRankNotes;
  ritual: { title: string; text: string; left: string; right: string };
  footnote: string;
}
