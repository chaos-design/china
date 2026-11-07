import type { AtlasTopic, AtlasTopicId } from "./types";

/**
 * 图谱主题注册表。三条入口共用：导航分组从这里取条目，
 * 路由与占位页从这里取元信息，后续正式页也按 id 认领自己的主题。
 *
 * 新增主题：在 types.ts 扩展 AtlasTopicId，在这里追加条目，
 * 再补路由与导航分组条目——注册表是唯一的真相来源。
 */
export const ATLAS_TOPICS: readonly AtlasTopic[] = [
  {
    description:
      "历代疆域如何扩张、收缩与定型。以朝代为章、以变迁节点为目，呈现版图轮廓与边界的变化过程，而不是只给一张极盛图。",
    id: "territory",
    label: "疆域变迁",
    path: "/china/atlas/territory",
    plannedFeatures: [
      "按朝代分章的疆域快照（汉、唐、宋、元先行）",
      "变迁节点时间轴：开拓、迁都、割让、和议",
      "可切换图层的手绘疆域示意图",
    ],
    tagline: "边界怎么移动",
  },
  {
    description:
      "人群在朝代间如何移动、混合与定居。迁徙不是背景板：每一次大规模流动都在改写疆域与治理的形态。",
    id: "migration",
    label: "民族迁徙",
    path: "/china/atlas/migration",
    plannedFeatures: [
      "主要迁徙路线图（主体、起点、沿线、终点）",
      "人口流动的推力与拉力注记",
      "与疆域变迁、边疆治理的交叉引用",
    ],
    tagline: "人群怎么走",
  },
  {
    description:
      "历代王朝如何治理边疆：机构、制度与互市体系。边疆治理是疆域的另一半——画得出边界，还要管得住边界。",
    id: "frontier",
    label: "边疆治理",
    path: "/china/atlas/frontier",
    plannedFeatures: [
      "边疆机构与制度卡片（都护府、羁縻州、行省、宣政院）",
      "治理区域分布图",
      "制度源流对照：从汉都护到元行省的延续与变形",
    ],
    tagline: "边疆怎么管",
  },
];

/** 按主题 id 取入口元信息；id 拼写错误立即抛错，让死链在启动期暴露。 */
export function getAtlasTopic(id: AtlasTopicId): AtlasTopic {
  const topic = ATLAS_TOPICS.find((candidate) => candidate.id === id);
  if (!topic) {
    throw new Error(`未知的图谱主题：${id}`);
  }
  return topic;
}

/** 除给定主题外的其余主题，占位页用来做三条入口之间的互链。 */
export function getOtherAtlasTopics(id: AtlasTopicId): readonly AtlasTopic[] {
  return ATLAS_TOPICS.filter((topic) => topic.id !== id);
}

/** 校验：主题 id 与路由路径必须一一对应，防止注册表改乱。 */
for (const topic of ATLAS_TOPICS) {
  if (topic.path !== `/china/atlas/${topic.id}`) {
    throw new Error(`图谱主题 ${topic.id} 的路径 ${topic.path} 与约定前缀不一致`);
  }
}
