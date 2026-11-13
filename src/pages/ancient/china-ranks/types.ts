/**
 * 品级纵横（官位品级对比）的数据类型。
 *
 * 「品」是九品制诞生后的产物：秦汉以秩石定尊卑、无「品」可依，
 * 故秦汉的每级阶梯带一个「约当 N 品」的示意映射（approxGrade），
 * 供「同品断面」把八个王朝放到同一根品序轴上对照；该映射仅为示意。
 */
export type RankBand = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface RankOffice {
  /** 文武分途标记：文=朱点、武=蓝点。 */
  branch: "civil" | "military";
  /** 职能一句话。 */
  duty: string;
  /** 古今对应（参考）：仅为量级类比，非严格等价。 */
  modern?: string;
  /** 权力实态与沿革备注：品级与实权脱钩之处写在这里。 */
  note?: string;
  /** 确切品秩写法，如「正三品」「秩万石」「差遣·品随本官」。 */
  rank: string;
  /**
   * 品序（一品=1…九品=9），供「同品断面」筛选；
   * 流外/品外官缺省，秦汉官职回退到所属等级的 approxGrade。
   */
  band?: RankBand;
  /** 俸禄/秩俸（有通行记载者填，存疑用「约」）。 */
  salary?: string;
  /** 官名。 */
  title: string;
}

export interface RankLevel {
  /** 阶梯行标签：一品…九品，或秦汉的秩石等第。 */
  grade: string;
  /** 秦汉无品制时的「约当 N 品」示意映射（仅秦汉数据使用）。 */
  approxGrade?: RankBand;
  /** 流外/品外等级：官职不入九品，不参与同品断面。 */
  outOfRank?: boolean;
  offices: readonly RankOffice[];
}

export type RankDynastyId =
  | "qin"
  | "han"
  | "weijin"
  | "suitang"
  | "song"
  | "yuan"
  | "ming"
  | "qing";

export interface RankDynasty {
  /** 一句制度口径：这一朝用什么定尊卑。 */
  systemNote: string;
  id: RankDynastyId;
  /** 阶梯：自最高品/秩向最低排列。 */
  levels: readonly RankLevel[];
  name: string;
  period: string;
  /** 制度名：如「九品三十阶」。 */
  system: string;
  /** 数据出处（正史职官志等）。 */
  source: string;
}

export interface TrackStop {
  dynastyId: RankDynastyId;
  /** 这条职系在该朝的名称，多名并列用「·」。 */
  title: string;
  /** 该朝的品秩写法。 */
  rank: string;
  /** 一句权力实态。 */
  power: string;
}

export interface OfficeTrack {
  /** 职系一句话说明。 */
  blurb: string;
  id: string;
  name: string;
  /** 与 RANK_DYNASTIES 同序的八个停靠点；缺位也写成该朝的实态说明，不留空。 */
  stops: readonly TrackStop[];
}
