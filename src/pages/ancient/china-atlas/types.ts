/**
 * 「疆域与民族图谱」模块的数据契约与页面骨架类型。
 *
 * 本模块当前只预留入口与占位页；这里先把「按朝代展开」的数据形状定下来，
 * 后续各图谱落地时直接按契约填充数据文件，页面与导航不需要再动。
 */

/** 图谱主题 id。三个主题对应三条导航入口与三条路由。 */
export type AtlasTopicId = "territory" | "migration" | "frontier";

/** 朝代 id。数据文件按此 id 关联到朝代，避免用汉字标签做外键。 */
export type AtlasDynastyId = "han" | "tang" | "song" | "yuan";

/** 一条图谱入口的元信息：导航、占位页与后续正式页共用这一份。 */
export interface AtlasTopic {
  description: string;
  id: AtlasTopicId;
  label: string;
  /** 站内路由路径，如 /china/atlas/territory。 */
  path: string;
  /** 规划中的图谱形态，占位页按顺序列出，正式落地后替换为真实模块。 */
  plannedFeatures: readonly string[];
  tagline: string;
}

/** 朝代骨架：占位页展示「按朝代展开」的路线图，正式图谱按 id 挂接数据。 */
export interface AtlasDynasty {
  id: AtlasDynastyId;
  label: string;
  /** 该朝代在各主题下规划展开的内容；缺省键表示该主题暂未规划到这一朝。 */
  planned: Partial<Record<AtlasTopicId, string>>;
  period: string;
}

// ---------------------------------------------------------------------------
// 以下为图谱数据的数据契约。疆域与边疆治理尚未落地（预留）；
// 民族迁徙已由 migration-events.ts 按契约填充。
// ---------------------------------------------------------------------------

/** 资料出处。所有涉及统计、疆界数字的条目都应携带，沿用站内「争议数字写区间」的约定。 */
export type AtlasSource = readonly string[];

/** 疆域变迁：一个朝代的一幅疆域快照（预留）。 */
export interface TerritorySnapshot {
  /** 疆域说明；变迁节点（迁都、割让、开拓）各自成条，不要把一整个朝代压成一条。 */
  description: string;
  dynastyId: AtlasDynastyId;
  /** 快照年份，负数表示公元前。 */
  year: number;
  /** 快照名称，如「武帝极盛」「绍兴和议后」。 */
  label: string;
  /** 面积估算（万平方公里）。估算分歧大时写区间字符串或省略。 */
  areaWanKm2?: string;
  sources?: AtlasSource;
}

/** 民族迁徙：一条迁徙路线。经纬度路线由 migration-projection.ts 投到真实底图上。 */
export interface MigrationRoute {
  description: string;
  dynastyId: AtlasDynastyId;
  /** 起点地名。 */
  from: string;
  id: string;
  /** 路线途经点，按出发 → 抵达排序；至少两处（起点与终点）。 */
  waypoints: readonly MigrationWaypoint[];
  /** 迁徙主体，如「南匈奴」「粟特商旅」。 */
  group: string;
  /** 大致时段，如「东汉初年」「1127 年前后」。 */
  period: string;
  sources: AtlasSource;
  /** 终点地名。 */
  to: string;
}

/** 迁徙路线的一个途经点。name 省略时地图上不渲染地名标注。 */
export interface MigrationWaypoint {
  /** [经度, 纬度]。 */
  ll: readonly [number, number];
  name?: string;
}

/** 边疆治理：一项边疆制度或治理机构。治所（或代表地）经纬度由投影投到真实底图上。 */
export interface FrontierPolicyEntry {
  description: string;
  dynastyId: AtlasDynastyId;
  id: string;
  /** 机构或制度名，如「西域都护府」「羁縻州」。 */
  institution: string;
  /** 大致时段，如「前 60 年起」「澶渊之盟（1005）后」。 */
  period: string;
  /** 施行区域，如「西域」「西南」。 */
  regions: readonly string[];
  /** 治所或代表地点：地图上的定位锚点。 */
  seat: FrontierSeat;
  sources: AtlasSource;
}

/** 治所（或制度的代表地点）。 */
export interface FrontierSeat {
  /** [经度, 纬度]。 */
  ll: readonly [number, number];
  name: string;
}
