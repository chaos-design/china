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

/** 时代主色（底部进度条 / 速报标签 / 菜单分组共用）。 */
export const ERA_COLORS: Record<ChronicleEra, string> = {
  "pre-qin": "#c98a4b",
  "qin-han": "#cf5b45",
  "wei-jin": "#8f5fbf",
  "sui-tang": "#d8a23c",
  "song-yuan": "#4f9cf9",
  "ming-qing": "#6faf8f",
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

/** 政权疆域内的重要城市（经济 / 军事 / 文化重镇，区别于都城与政区治所）。 */
export interface PolityCity {
  name: string;
  ll: LngLat;
  /** 一句话说明（地位 / 事件关联），可缺省。 */
  note?: string;
}

/** 战役推进阶段（特殊战争的小窗叙事：按时间列出的推进节点）。 */
export interface WarPhase {
  /** 阶段时间表述（如「755 十一月」）。 */
  year: string;
  /** 该阶段发生了什么（一句话）。 */
  text: string;
}

/**
 * 疆域控制变更：某年某月，一个政权被另一个政权吞并，其疆域整体转归接管方。
 * 时间轴上按月份生效——这是「疆域随年份变化」的主模型：被吞并的政权从
 * 该月起不再单独绘制，其疆域环以接管方颜色继续显示（虚线保留旧界）。
 * 没有接管方（by = null）表示该政权退出图面、疆域不再计入任何一方。
 */
export interface ControlChange {
  year: number;
  /** 月份（1–12），缺省按 1 月处理。 */
  month?: number;
  /** 接管方政权 id；null = 无人接管。 */
  by: string | null;
  /** 被吞并的政权 id。 */
  absorbed: string;
  /** 编年体一句话（进入右侧速报与时间轴提示）。 */
  note: string;
}

/**
 * 城市控制变更：某年某月，一座城（含都城）易主。城市标注随当前控制方
 * 换色，并在右侧「编年速报」里高亮；疆域大环由 ControlChange 负责，
 * 这里只处理城级归属（避免同一座城同时挂在两个政权名下）。
 */
export interface CityChange {
  year: number;
  month?: number;
  /** 城市名（必须能在本期的 capitals / cities 里找到）。 */
  city: string;
  /** 新城主政权 id；null = 失守 / 废弃。 */
  by: string | null;
  note: string;
}

/** 局部控制区：大环之外的飞地 / 争夺区，按月份切换归属（示意多边形）。 */
export interface ControlZone {
  id: string;
  name: string;
  ring: readonly LngLat[];
  /** 初始控制方。 */
  polityId: string;
  /** 控制权变更（按时间顺序）。 */
  changes?: readonly {
    year: number;
    month?: number;
    /** 新控制方；null = 无人控制。 */
    by: string | null;
    note?: string;
  }[];
  note: string;
}

/** 编年速报条目：播放 / 拖动时间时右侧实时更新的编年体记录。 */
export interface ChronicleAnnal {
  year: number;
  month?: number;
  kind: "capital" | "war" | "politics" | "person" | "territory";
  /** 一句话记事（高亮显示当前年附近的条目）。 */
  text: string;
  /** 关联政权 id（用于按控制方着色）。 */
  polityId?: string;
}

/** 人物志：忠臣 / 奸臣 / 重要人物，附生平与结局。 */
export interface ChronicleFigure {
  name: string;
  /** 身份标签（如「忠臣」「奸臣」「名将」「帝姬」）。 */
  role: string;
  /** 生平（1–2 句）。 */
  life: string;
  /** 结局（1 句）。 */
  fate: string;
  /** 评断：忠 / 奸 / 重要（仅用于标签着色，不做道德定论）。 */
  stance: "loyal" | "treacherous" | "notable";
  /** 生年 / 卒年（负数 = 公元前），用于播放时标注「在世 / 登场」。 */
  birthYear?: number;
  /** 生卒月份（1–12）；史籍无载时留空，界面标注「月无考」而不伪造。 */
  birthMonth?: number;
  deathMonth?: number;
  deathYear?: number;
  /** 补充说明（史实争议、传说性质等）。 */
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
  /** 重要城市采样（渲染为小圆点，放大后出现）；游牧政权可缺省。 */
  cities?: readonly PolityCity[];
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
  /** 年份表述（如「前260」或「755 — 763」）；机器可读区间由 parseWarYearRange 解析。 */
  year: string;
  sideA: string;
  sideB: string;
  /** 战场中心（未选 ops 时地图按此聚焦）。 */
  center: LngLat;
  /** 一句话概括。 */
  brief: string;
  /** 经过要点（2–4 句）。 */
  detail: string;
  /** 双方投入规模（约数，宣传性数字注明史载口径）。 */
  scale?: string;
  /** 伤亡 / 被俘 / 溃散（争议处写区间或无确数）。 */
  losses?: string;
  outcome: string;
  ops?: readonly WarOp[];
  /** 战役推进阶段（特殊战争的地图小窗叙事），可缺省。 */
  phases?: readonly WarPhase[];
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
  /** 疆域控制变更（按月份生效；缺省 = 全期固定）。 */
  control?: readonly ControlChange[];
  /** 城级控制变更（按月份生效）。 */
  cityChanges?: readonly CityChange[];
  /** 局部控制区（飞地 / 争夺区），按月份切换归属。 */
  controlZones?: readonly ControlZone[];
  /** 编年速报（右侧播放时实时更新；缺省时由战争与控制变更派生）。 */
  annals?: readonly ChronicleAnnal[];
  /** 人物志（右侧底部，默认折叠）。 */
  figures?: readonly ChronicleFigure[];
  /** 本期总体出处（政区与疆域口径）。 */
  sources: readonly string[];
  /** 切到本期的取景：中心 + 目标缩放级。 */
  focus: { center: LngLat; zoom: number };
}
