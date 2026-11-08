import type { MigrationRoute } from "./types";

/**
 * 民族迁徙首批路线（汉、唐、宋、元各两条）。
 *
 * 途经点是真实经纬度（[lon, lat]），经 migration-projection.ts 投到
 * 真实省界底图上。迁徙是大尺度、长时段的人群流动，这里只画主流向的
 * 示意走廊：同一次迁徙往往分几波、走几条道，不要把一条线读成唯一通道。
 *
 * 争议或概括性表述在 description 里说明分歧，沿用站内「数字写区间、
 * 分歧写明」的约定。
 */
export const MIGRATION_EVENTS: readonly MigrationRoute[] = [
  {
    id: "han-xiongnu-south",
    dynastyId: "han",
    group: "南匈奴",
    period: "东汉初年（公元 48 年之后）",
    from: "漠北草原",
    to: "并州塞内",
    waypoints: [
      { ll: [102.4, 47.3], name: "漠北单于庭" },
      { ll: [108.6, 40.7], name: "五原、朔方塞下" },
      { ll: [110.9, 37.6], name: "西河、离石" },
    ],
    description:
      "匈奴分裂后，南匈奴归附东汉，部众逐步迁入长城一线乃至并州诸郡，朝廷以「保塞内附」安置。匈奴由此深入塞内，为后来的十六国格局埋下伏线。",
    sources: ["《后汉书·南匈奴列传》"],
  },
  {
    id: "han-yue-inland",
    dynastyId: "han",
    group: "闽越人",
    period: "西汉武帝时期（公元前 110 年前后）",
    from: "闽越故地",
    to: "江淮之间",
    waypoints: [
      { ll: [119.3, 26.08], name: "东冶（福州）" },
      { ll: [120.65, 28.0], name: "东瓯（温州）" },
      { ll: [117.28, 31.86], name: "庐江、九江" },
    ],
    description:
      "汉平闽越后，将闽越故地的部分居民迁往江淮一带，《史记》记「诏军吏皆将其民徙处江淮间，东越地遂虚」。「地遂虚」是史家笔法，留居山地者并未绝迹。",
    sources: ["《史记·东越列传》"],
  },
  {
    id: "tang-tujue-submit",
    dynastyId: "tang",
    group: "东突厥降众",
    period: "贞观四年（公元 630 年）之后",
    from: "阴山以北",
    to: "灵州至长安",
    waypoints: [
      { ll: [107.4, 43.2], name: "漠南" },
      { ll: [108.9, 40.5], name: "河套" },
      { ll: [106.2, 38.4], name: "灵州" },
      { ll: [108.94, 34.34], name: "长安" },
    ],
    description:
      "东突厥汗国瓦解后，大批突厥降户南渡黄河，唐廷在突利故地置顺、祐、化、长四州都督府，又以灵州为安置门户。温彦博主张「全其部落，顺其土俗」，与徙民内地之议相争，最终两种方案并行。",
    sources: ["《资治通鉴·唐纪九》", "《新唐书·突厥传》"],
  },
  {
    id: "tang-sogdian-east",
    dynastyId: "tang",
    group: "粟特商旅",
    period: "北朝末至盛唐（四至八世纪）",
    from: "撒马尔罕一带",
    to: "长安",
    waypoints: [
      { ll: [66.97, 39.65], name: "撒马尔罕" },
      { ll: [94.66, 40.14], name: "敦煌" },
      { ll: [102.63, 37.93], name: "凉州" },
      { ll: [108.94, 34.34], name: "长安" },
    ],
    description:
      "粟特人沿丝路绿洲结成商贸网络，敦煌、凉州直至长安都有聚落，长安西市胡商云集。他们不只是商人：粟特人同时把祆教、音乐、舞蹈带入中原，安史之乱的安禄山、史思明即出身营州杂胡。",
    sources: ["《新唐书·西域传》", "荣新江《中古中国与外来文明》"],
  },
  {
    id: "song-jingkang-south",
    dynastyId: "song",
    group: "中原士民",
    period: "靖康之变前后（1126—1141 年）",
    from: "开封及中原",
    to: "临安",
    waypoints: [
      { ll: [114.31, 34.8], name: "开封" },
      { ll: [119.42, 32.39], name: "扬州" },
      { ll: [120.58, 31.3], name: "平江（苏州）" },
      { ll: [120.16, 30.25], name: "临安" },
    ],
    description:
      "靖康之变后宋室南渡，「中原士民，扶携南渡，不知其几千万人」（《建炎以来系年要录》引语，系概括而非统计）。人口重心与经济重心一同南移，江南自此为全国财赋所出。",
    sources: ["《建炎以来系年要录》", "《宋史·高宗本纪》"],
  },
  {
    id: "song-hakka-south",
    dynastyId: "song",
    group: "客家先民",
    period: "两宋至宋元之际",
    from: "赣南",
    to: "闽西、粤东",
    waypoints: [
      { ll: [114.94, 25.85], name: "赣州" },
      { ll: [116.36, 25.85], name: "汀州" },
      { ll: [116.12, 24.29], name: "梅州" },
    ],
    description:
      "客家先民自中原南迁，两宋之际进入赣南、闽西，宋元之际越过大庾岭与武夷山余脉进入粤东。赣州—汀州—梅州一线是客家研究的传统主线；客家形成是一个长时段过程，单一「起点」与「终点」都只是示意。",
    sources: ["罗香林《客家研究导论》", "《宋史·地理志》"],
  },
  {
    id: "yuan-semu-east",
    dynastyId: "yuan",
    group: "色目人",
    period: "蒙元时期（十三至十四世纪）",
    from: "中亚绿洲",
    to: "大都",
    waypoints: [
      { ll: [66.97, 39.65], name: "撒马尔罕" },
      { ll: [89.18, 42.9], name: "别失八里" },
      { ll: [98.5, 39.74], name: "肃州" },
      { ll: [116.4, 39.9], name: "大都" },
    ],
    description:
      "随蒙古西征与驿站网络，中亚工匠、商人与军士大量东迁，散布大都、河西与西南各地，元代泛称「色目人」。他们多从事理财、天文、工技，回回历法即在此时传入。",
    sources: ["《元史·百官志》", "《元史·天文志》"],
  },
  {
    id: "yuan-huihui-yunnan",
    dynastyId: "yuan",
    group: "回回人",
    period: "至元年间（十三世纪后期）",
    from: "中亚",
    to: "云南",
    waypoints: [
      { ll: [66.97, 39.65], name: "撒马尔罕" },
      { ll: [104.07, 30.66], name: "成都" },
      { ll: [102.83, 24.88], name: "昆明" },
    ],
    description:
      "赛典赤·赡思丁率部经略云南，至元十一年（1274 年）建云南行省，回回军士、商人与工匠随之落籍滇中。回回人从此在云南生根，成为西南边疆开发的重要人群。",
    sources: ["《元史·赛典赤赡思丁传》"],
  },
];

/** 按朝代 id 取该朝的迁徙路线，保持注册顺序。 */
export function getMigrationEventsByDynasty(dynastyId: string): readonly MigrationRoute[] {
  return MIGRATION_EVENTS.filter((event) => event.dynastyId === dynastyId);
}
