import type { AtlasDynastyId } from "./types";

/**
 * 朝代断面：都城、当朝代表性大城市 / 治所，以及由这些点围合的「疆域示意」。
 *
 * 底图恒为现今中国疆域与省界；这里叠加的范围只是把该朝都城与史料可据的控制
 * 节点连成一片示意区域，**不是实测边界、也不是实控线**。城市名单取自各朝
 * 地理志与谭其骧《中国历史地图集》中常见的都会与治所，只作代表性标注，
 * 不宣称是全部城市。经度纬度沿用各快照 / 制度数据里已有的锚点，避免两套坐标。
 */

export interface DynastyCity {
  /** [经度, 纬度]。 */
  ll: readonly [number, number];
  name: string;
  role: "capital" | "city";
}

export interface DynastyTerritory {
  capital: string;
  cities: readonly DynastyCity[];
  id: AtlasDynastyId;
  label: string;
  note: string;
  period: string;
  sources: readonly string[];
}

const city = (
  name: string,
  lon: number,
  lat: number,
  role: DynastyCity["role"] = "city",
): DynastyCity => ({ ll: [lon, lat], name, role });

const SCHEMATIC_NOTE =
  "示意范围由都城与代表性城市、控制节点围合，只表示疆域大致所及；连线不是边界，也不代表实控线。底图为现今中国疆域与省界。";

export const DYNASTY_TERRITORIES: readonly DynastyTerritory[] = [
  {
    capital: "长安",
    cities: [
      city("长安", 108.94, 34.34, "capital"),
      city("洛阳", 112.45, 34.62),
      city("成都", 104.07, 30.67),
      city("番禺", 113.26, 23.13),
      city("敦煌", 94.66, 40.14),
      city("乌垒", 84.25, 41.85),
      city("日南", 108.25, 16.1),
    ],
    id: "han",
    label: "汉",
    note: SCHEMATIC_NOTE,
    period: "前202 — 220",
    sources: ["《汉书·地理志》", "谭其骧《中国历史地图集》第二册"],
  },
  {
    capital: "长安",
    cities: [
      city("长安", 108.94, 34.34, "capital"),
      city("洛阳", 112.45, 34.62),
      city("扬州", 119.42, 32.39),
      city("成都", 104.07, 30.67),
      city("广州", 113.26, 23.13),
      city("凉州", 102.63, 37.93),
      city("云中", 111.5, 40.4),
      city("平壤", 125.75, 39.03),
      city("交州", 105.85, 21.03),
      city("碎叶", 75.3, 42.9),
    ],
    id: "tang",
    label: "唐",
    note: SCHEMATIC_NOTE,
    period: "618 — 907",
    sources: ["《旧唐书·地理志》", "谭其骧《中国历史地图集》第五册"],
  },
  {
    capital: "临安",
    cities: [
      city("临安", 120.16, 30.25, "capital"),
      city("建康", 118.8, 32.06),
      city("楚州", 119.14, 33.5),
      city("襄阳", 112.14, 32.04),
      city("大散关", 106.9, 34.27),
      city("成都", 104.07, 30.67),
    ],
    id: "song",
    label: "宋",
    note: SCHEMATIC_NOTE,
    period: "960 — 1279",
    sources: ["《宋史·地理志》", "谭其骧《中国历史地图集》第六册"],
  },
  {
    capital: "大都",
    cities: [
      city("大都", 116.4, 39.9, "capital"),
      city("上都", 116.18, 42.36),
      city("和宁", 102.5, 47.2),
      city("辽阳", 123.17, 41.27),
      city("中庆", 102.83, 24.88),
      city("萨斯迦", 88.02, 28.9),
      city("杭州", 120.16, 30.25),
    ],
    id: "yuan",
    label: "元",
    note: SCHEMATIC_NOTE,
    period: "1271 — 1368",
    sources: ["《元史·地理志》", "谭其骧《中国历史地图集》第七册"],
  },
];

/** 按朝代 id 取断面；拼错 id 立即抛错，避免静默画出空图层。 */
export function getDynastyTerritory(id: AtlasDynastyId): DynastyTerritory {
  const territory = DYNASTY_TERRITORIES.find((entry) => entry.id === id);
  if (!territory) throw new Error(`未知的朝代断面：${id}`);
  return territory;
}
