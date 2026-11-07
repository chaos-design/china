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
// 以下为后续正式数据的数据契约（预留）。当前没有任何数据文件实现它们；
// 各主题落地时在 china-atlas/ 下新增 data-*.ts 并按这里的形状填充。
// ---------------------------------------------------------------------------

/** 资料出处。所有涉及统计、疆界数字的条目都应携带，沿用站内「争议数字写区间」的约定。 */
export type AtlasSource = readonly string[];

/** 疆域变迁：一个朝代的一幅疆域快照。 */
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

/** 民族迁徙：一条迁徙路线。 */
export interface MigrationRoute {
  description: string;
  /** 迁徙主体，如「匈奴」「中原士族」。 */
  group: string;
  dynastyId: AtlasDynastyId;
  /** 起点；沿线与终点分别列出。 */
  from: string;
  /** 大致时段，如「永嘉之乱前后」。 */
  period: string;
  sources?: AtlasSource;
  /** 沿线或终点地名，按路线顺序。 */
  stops: readonly string[];
}

/** 边疆治理：一项边疆制度或治理机构。 */
export interface FrontierPolicyEntry {
  description: string;
  dynastyId: AtlasDynastyId;
  /** 机构或制度名，如「西域都护府」「羁縻州」。 */
  institution: string;
  /** 施行区域，如「西域」「西南」。 */
  regions: readonly string[];
  sources?: AtlasSource;
}
