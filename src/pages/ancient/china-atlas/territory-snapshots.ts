import type { TerritorySnapshot } from "./types";

/**
 * 疆域变迁首批快照（汉两幅、唐两幅、宋元各一幅）。
 *
 * 疆域是一片连续区域，任何「轮廓」都是现代人的重构；这里只把每幅快照的
 * 都城与代表性控制节点（新拓疆域、界约地点、都护治所）锚定在真实底图上，
 * 节点之间的连线不代表边界。面积数字诸家估算分歧极大，一律写区间或省略。
 */
export const TERRITORY_SNAPSHOTS: readonly TerritorySnapshot[] = [
  {
    id: "han-nanyue",
    dynastyId: "han",
    year: -111,
    label: "南越置郡",
    capital: { name: "长安", ll: [108.94, 34.34] },
    anchors: [
      { name: "番禺（今广州）", ll: [113.26, 23.13] },
      { name: "日南郡（今越南中部）", ll: [108.25, 16.1] },
    ],
    description:
      "汉武帝平南越，以其地置南海、苍梧、郁林、合浦、交趾、九真、日南等九郡，岭南与越南中部沿海首次进入郡县体系。日南郡南界在何处，汉唐记载已有分歧，今人考订亦不一。",
    sources: ["《汉书·地理志》", "《史记·南越列传》"],
  },
  {
    id: "han-xiyu",
    dynastyId: "han",
    year: -60,
    label: "西域都护设立",
    capital: { name: "长安", ll: [108.94, 34.34] },
    anchors: [
      { name: "河西四郡 · 敦煌", ll: [94.66, 40.14] },
      { name: "西域都护治所 · 乌垒", ll: [84.25, 41.85] },
    ],
    areaWanKm2: "570–610",
    description:
      "河西四郡打通走廊，西域都护府领护诸国，汉之疆域西抵葱岭。都护屡置屡废、实控随国势进退，但「西域」自此成为中原王朝疆域叙事的一部分。",
    sources: ["《汉书·西域传》"],
  },
  {
    id: "tang-jisheng",
    dynastyId: "tang",
    year: 660,
    label: "疆域极盛",
    capital: { name: "长安", ll: [108.94, 34.34] },
    anchors: [
      { name: "安西四镇 · 碎叶", ll: [75.3, 42.9] },
      { name: "单于都护府 · 云中", ll: [111.5, 40.4] },
      { name: "安东都护府 · 平壤", ll: [125.75, 39.03] },
      { name: "安南都护府 · 交州", ll: [105.85, 21.03] },
    ],
    areaWanKm2: "1070–1240",
    description:
      "高宗显庆年间，唐疆东抵朝鲜半岛、西逾葱岭、南尽安南、北包漠北。极盛局面维持不足十年，各都护府实控程度差异极大；谭其骧图集所绘总章二年（669）范围为常被引用的峰值断面，数字仅示量级。",
    sources: ["《新唐书·地理志》", "谭其骧《中国历史地图集》"],
  },
  {
    id: "tang-shousuo",
    dynastyId: "tang",
    year: 781,
    label: "安史后的收缩",
    capital: { name: "长安", ll: [108.94, 34.34] },
    anchors: [
      { name: "清水会盟界 · 清水", ll: [106.14, 34.75] },
      { name: "陷蕃 · 凉州", ll: [102.63, 37.93] },
    ],
    description:
      "安史之乱后河西、陇右渐陷于吐蕃，贞元三年（787）清水会盟划定界线，唐疆退回关中—剑南一线。安西四镇与中原隔绝，守军孤悬奉唐正朔，至贞元、元和间相继陷落。",
    sources: ["《旧唐书·吐蕃传》"],
  },
  {
    id: "song-shaoxing",
    dynastyId: "song",
    year: 1141,
    label: "绍兴和议",
    capital: { name: "临安", ll: [120.16, 30.25] },
    anchors: [
      { name: "淮河中流 · 楚州", ll: [119.14, 33.5] },
      { name: "大散关", ll: [106.9, 34.27] },
    ],
    areaWanKm2: "200–280",
    description:
      "绍兴十一年和议成，宋金东以淮水、西以大散关为界，宋对金称臣，岁贡银绢二十五万两匹。南渡后的疆界自此定型，中原故地成为南宋一朝「恢复」话语的政治符号。",
    sources: ["《宋史·高宗本纪》", "《建炎以来系年要录》"],
  },
  {
    id: "yuan-zhishun",
    dynastyId: "yuan",
    year: 1330,
    label: "至顺版图",
    capital: { name: "大都", ll: [116.4, 39.9] },
    anchors: [
      { name: "岭北行省 · 和宁", ll: [102.5, 47.2] },
      { name: "辽阳行省 · 辽阳", ll: [123.17, 41.27] },
      { name: "云南行省 · 中庆", ll: [102.83, 24.88] },
      { name: "宣政院辖地 · 萨斯迦", ll: [88.02, 28.9] },
    ],
    areaWanKm2: "1372",
    description:
      "《元史·地理志》所记至顺年间疆理：行省直抵漠北、辽东，宣政院辖吐蕃。谭其骧图集取 1330 年为元代断面，约 1372 万平方公里——西北诸蒙古汗国是否计入，历来口径不一。",
    sources: ["《元史·地理志》", "谭其骧《中国历史地图集》"],
  },
];

/** 按朝代 id 取该朝的疆域快照，保持注册顺序。 */
export function getTerritorySnapshotsByDynasty(dynastyId: string): readonly TerritorySnapshot[] {
  return TERRITORY_SNAPSHOTS.filter((snapshot) => snapshot.dynastyId === dynastyId);
}

/** 时间轴用的年份区间（负数表示公元前）。 */
export const TERRITORY_YEAR_RANGE = {
  min: Math.min(...TERRITORY_SNAPSHOTS.map((snapshot) => snapshot.year)),
  max: Math.max(...TERRITORY_SNAPSHOTS.map((snapshot) => snapshot.year)),
} as const;
