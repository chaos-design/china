/**
 * 历代疆域编年数据契约。
 *
 * 全站口径：本页所有历史边界都是**示意多边形**——按谭其骧《中国历史地图集》
 * 与正史记载手工概化，不是实测边界；覆盖到「经常控制 / 长期驻官」的范围，
 * 不得把羁縻、朝贡、远征峰值画成实控领土（羁縻范围用 looseTerritory 虚线表达）。
 * 每一期、每一个战争条目都必须携带出处。
 */

/** 经纬度元组 [经度, 纬度]。本页所有几何直接落在 Leaflet 的 Web 墨卡托坐标系上。 */
export type LngLat = readonly [number, number];

/** 时代分组（左侧编年目录与时间轴刻度的着色单位）。 */
export type ChronicleEra =
  | "pre-qin"
  | "qin-han"
  | "wei-jin"
  | "sui-tang"
  | "song-yuan"
  | "ming-qing";

export const ERA_LABELS: Record<ChronicleEra, string> = {
  "pre-qin": "先秦",
  "qin-han": "秦汉",
  "wei-jin": "魏晋南北朝",
  "sui-tang": "隋唐",
  "song-yuan": "宋元",
  "ming-qing": "明清",
};

/** 政权的都城点。 */
export interface PolityCapital {
  /** 都邑名（历史名，如「镐京」）。 */
  name: string;
  ll: LngLat;
  /** main = 主都；secondary = 陪都 / 东都 / 行都。 */
  kind: "main" | "secondary";
  /** 一句话说明（如「周室东都，平王东迁后为王畿」）。 */
  note?: string;
}

/** 一期之内的一个政权（统一王朝只有一个，分裂期每政权一份）。 */
export interface ChroniclePolity {
  /** 期内唯一 id（如战国「qin-state」）。 */
  id: string;
  name: string;
  /** 深色底图上使用的政权主色（hex）。 */
  color: string;
  /** 疆域要点说明（控制范围、四至、政区背景，2–4 句）。 */
  note: string;
  /** 主疆域示意多边形（闭合，≥3 个顶点）。 */
  territory: readonly LngLat[];
  /** 羁縻 / 势力范围（虚线绘制，可缺省）。 */
  looseTerritory?: readonly LngLat[];
  capitals: readonly PolityCapital[];
  sources: readonly string[];
}

/** 核心地区：本期政治 / 财赋 / 军事的枢纽地带（如关中、中原、江南）。 */
export interface CoreRegion {
  name: string;
  /** 名称标注锚点。 */
  ll: LngLat;
  /** 示意范围（可缺省——缺省时只画名称锚点）。 */
  polygon?: readonly LngLat[];
  note: string;
}

/** 政区采样：郡 / 州 / 道 / 路 / 行省 / 省 / 将军辖区 / 都护府……治所 + 一句话。 */
export interface AdminDivision {
  name: string;
  kind: string;
  seat: LngLat;
  note: string;
}

/** 边防 / 大型工程要素。线状（长城、边墙、界壕、运河）或点状（边镇、都护府、要塞）。 */
export interface DefenseFeature {
  id: string;
  name: string;
  kind: string;
  /** 线状要素途经点（≥2）。 */
  points?: readonly LngLat[];
  /** 点状要素位置。 */
  ll?: LngLat;
  note: string;
}

/** 战争图上要素：行军箭头（advance/retreat）、战场、包围圈。 */
export interface WarOp {
  kind: "arrow" | "retreat" | "battle" | "encircle";
  /** 归属方：1 = sideA，2 = sideB；encircle 多为围方。 */
  side: 1 | 2;
  /** 要素名（如「卫青出定襄」「白起围上党」）。 */
  name: string;
  /** arrow/encircle 的途经点（arrow 首尾为起讫，encircle 为闭合圈）。 */
  points?: readonly LngLat[];
  /** battle 的战场位置。 */
  ll?: LngLat;
  note?: string;
}

export interface WarEvent {
  id: string;
  name: string;
  /** 年份表述（如「前260」或「755—763」）。 */
  year: string;
  sideA: string;
  sideB: string;
  /** 战场中心（未选 ops 时地图按此聚焦）。 */
  center: LngLat;
  /** 一句话概括。 */
  brief: string;
  /** 经过要点（2–4 句）。 */
  detail: string;
  outcome: string;
  ops?: readonly WarOp[];
  sources: readonly string[];
}

export interface ChroniclePeriod {
  id: string;
  name: string;
  /** 分裂期的显示名（如「北宋 · 辽 · 西夏」），缺省用 name。 */
  display?: string;
  yearLabel: string;
  /** 排序用的起讫年（负数 = 公元前），编年时间轴的横轴。 */
  startYear: number;
  endYear: number;
  era: ChronicleEra;
  /** 疆域总述（150 字上下）。 */
  summary: string;
  polities: readonly ChroniclePolity[];
  coreRegions: readonly CoreRegion[];
  divisions: readonly AdminDivision[];
  defenses: readonly DefenseFeature[];
  wars: readonly WarEvent[];
  /** 本期总体出处（政区与疆域口径）。 */
  sources: readonly string[];
  /** 切到本期的取景：中心 + 目标缩放级。 */
  focus: { center: LngLat; zoom: number };
}
