import type { AtlasDynasty } from "./types";

/**
 * 朝代骨架，按时间先后排列。占位页用它展示「按朝代展开」的规划；
 * 正式图谱落地后，各主题的数据文件按 dynasty.id 关联到这里的条目。
 *
 * 先立汉、唐、宋、元四个骨架（这三个主题在这四朝资料最成体系），
 * 后续按需向前追加秦、向后追加明清——数组保持时间有序即可。
 */
export const ATLAS_DYNASTIES: readonly AtlasDynasty[] = [
  {
    id: "han",
    label: "汉",
    period: "前202 — 220",
    planned: {
      frontier: "西域都护府与属国都尉：设官治理的开端。",
      migration: "匈奴南附与北迁、越人内迁的主要路线。",
      territory: "武帝时期的版图轮廓：河西四郡与西域都护的设置。",
    },
  },
  {
    id: "tang",
    label: "唐",
    period: "618 — 907",
    planned: {
      frontier: "羁縻州县与六大都护府：因俗而治的成型。",
      migration: "突厥、回纥、吐蕃与粟特人的往来与定居。",
      territory: "贞观至开元的疆域极盛与安史后的收缩。",
    },
  },
  {
    id: "song",
    label: "宋",
    period: "960 — 1279",
    planned: {
      frontier: "榷场互市与和议体制：边界成为日常治理对象。",
      migration: "靖康南渡的人口迁移与经济重心南移。",
      territory: "辽夏金对峙下的疆界变化与南渡后的版图。",
    },
  },
  {
    id: "yuan",
    label: "元",
    period: "1271 — 1368",
    planned: {
      frontier: "宣政院辖地与土司制度的开端。",
      migration: "色目人东迁与各族的杂居格局。",
      territory: "行省制度下的版图整合与驿路网络。",
    },
  },
];
