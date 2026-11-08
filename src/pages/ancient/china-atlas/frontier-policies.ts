import type { FrontierPolicyEntry } from "./types";

/**
 * 边疆治理首批制度（汉、唐、宋、元各两项）。
 *
 * 每项制度以一个治所（或代表地点）锚定在真实底图上——制度往往覆盖一片区域，
 * 单个治所只是它的行政支点，辖区范围见 regions 与详情说明。
 * 「羁縻州县」「榷场」这类遍布边地的制度，取史料记载最充分的代表地示意。
 */
export const FRONTIER_POLICIES: readonly FrontierPolicyEntry[] = [
  {
    id: "han-xiyu-duhu",
    dynastyId: "han",
    defenseScope:
      "东扼玉门、阳关，西限葱岭，领护西域诸国；都护治乌垒城，以册命、屯田、烽燧与屯戍构成沿线防务。王莽末政令中断，东汉三绝三通。",
    institution: "西域都护府",
    period: "汉宣帝神爵二年（前 60 年）起",
    regions: ["西域"],
    seat: { name: "乌垒城（今轮台境内）", ll: [84.25, 41.85] },
    description:
      "汉宣帝神爵二年（前 60）设西域都护府，治乌垒城，统领西域诸国，「都护」之号自此始。汉之政令由都护颁行西域，册命、屯田、烽燧与屯戍构成治理网络；王莽末年政令中断，东汉时期三绝三通。",
    sources: ["《汉书·西域传》", "《后汉书·西域传》"],
  },
  {
    id: "han-shuguo-duwei",
    dynastyId: "han",
    defenseScope:
      "沿北部边塞安置内附的匈奴、羌人部落，属国都尉「依其本国之俗」领之，保留部落组织而隶于郡县体系，把归附人群转为边防力量。",
    institution: "属国都尉",
    period: "两汉",
    regions: ["北部边塞"],
    seat: { name: "五原、朔方塞下（河套）", ll: [108.9, 40.7] },
    description:
      "对内附的匈奴、羌人设属国安插，保留其部落组织而由属国都尉领之，「依其本国之俗」而隶于郡县体系。塞内属国是汉廷把归附人群转化为边防力量的制度化安排，也是「因俗而治」的早期形态。",
    sources: ["《后汉书·百官志》", "《史记·骠骑将军列传》"],
  },
  {
    id: "tang-anxi-duhu",
    dynastyId: "tang",
    defenseScope:
      "统龟兹、于阗、疏勒、碎叶安西四镇，以都护府—守捉—烽燧层层布防，与羁縻州府相表里。安史之乱后道路隔绝，守军仍奉唐正朔数十年。",
    institution: "安西都护府",
    period: "贞观十四年（640 年）置，后移治龟兹",
    regions: ["西域"],
    seat: { name: "龟兹（今库车）", ll: [82.96, 41.68] },
    description:
      "唐平高昌后置西州、庭州，安西都护府统辖安西四镇（龟兹、于阗、疏勒、碎叶），以都护府——守捉——烽燧层层布防，与羁縻州府相表里。安史之乱后与中原道路隔绝，安西守军仍奉唐正朔数十年。",
    sources: ["《旧唐书·地理志》", "《资治通鉴·唐纪》"],
  },
  {
    id: "tang-jimi-zhou",
    dynastyId: "tang",
    defenseScope:
      "缘边降附部落置羁縻州府八百五十六，以首领为都督、刺史世袭统领，贡赋不上户部；名单与辖境随各部叛附进退，与都护府防务相表里。",
    institution: "羁縻州县",
    period: "唐代（贞观年间大盛）",
    regions: ["东北、北方边地"],
    seat: { name: "营州都督府（今朝阳）", ll: [119.75, 41.57] },
    description:
      "唐于缘边降附部落置羁縻州府八百五十六，以首领为都督、刺史，世袭统领，贡赋不上户部，是「全其部落，顺其土俗」之争的制度化结果。羁縻州的名单与辖境随各部叛附进退，绝大多数不在版图内却仍在治理体系之中。",
    sources: ["《新唐书·地理志》", "《资治通鉴·唐纪》"],
  },
  {
    id: "song-quechang",
    dynastyId: "song",
    defenseScope:
      "宋辽、宋夏边界的指定地点设榷场，官督商办，违禁之物各有所限、抽税有制；岁币与榷场收入、走私与缉私构成和议体制下的边界防务。",
    institution: "榷场互市",
    period: "澶渊之盟（1005 年）后",
    regions: ["宋辽、宋夏边界"],
    seat: { name: "雄州榷场（今雄县）", ll: [116.1, 39.0] },
    description:
      "宋与辽、西夏在边界指定地点设榷场，官督商办，违禁之物各有所限，抽税有制。边界由此从对峙线变成日常治理与经济往来的界面；岁币与榷场收入、走私与缉私，构成和议体制的一体两面。",
    sources: ["《宋史·食货志》", "《宋史·外戚传》"],
  },
  {
    id: "song-nanfang-jimi",
    dynastyId: "song",
    defenseScope:
      "西南溪洞以首领知州、知洞，另籍土丁、峒丁备边；侬智高之乱（1052）后，对邕州左右江地区的册封与控制更加细密。",
    institution: "西南羁縻与土丁",
    period: "两宋",
    regions: ["西南"],
    seat: { name: "邕州左右江（今南宁）", ll: [108.32, 22.8] },
    description:
      "宋在西南溪洞延续羁縻之制，以首领知州、知洞，另籍土丁、峒丁备边。侬智高之乱（1052）后，宋对左右江地区的册封与控制更加细密，这一「以土官治土民」的形态是元代土司制度的前身。",
    sources: ["《宋史·兵志》", "《宋史·蛮夷传》"],
  },
  {
    id: "yuan-xingzheng",
    dynastyId: "yuan",
    defenseScope:
      "中书省之外设十大行省，云南、岭北等边地皆入行省体系；赛典赤·赡思丁治滇，建孔子庙、立赋役、修驿路，边疆防务与内地行政一体化。",
    institution: "行省制度",
    period: "至元十一年（1274 年）起",
    regions: ["全国，边地亦入行省"],
    seat: { name: "云南行省（昆明）", ll: [102.83, 24.88] },
    description:
      "元在中书省之外设十大行省，「都省握天下之机，十省分天下之治」。边地如云南、岭北皆入行省体系：赛典赤·赡思丁治滇，建孔子庙、立赋役、修驿路，边疆治理自此与内地行政一体化。",
    sources: ["《元史·地理志》", "《元史·赛典赤赡思丁传》"],
  },
  {
    id: "yuan-xuanzheng-yuan",
    dynastyId: "yuan",
    defenseScope:
      "吐蕃之地不入行省而由宣政院直辖，帝师领院事，下设宣慰司都元帅府，兼掌释教与吐蕃军民之政，构成元代西南边地的治理范围。",
    institution: "宣政院",
    period: "至元初设总制院，1288 年改宣政院",
    regions: ["吐蕃"],
    seat: { name: "吐蕃（拉萨）", ll: [91.13, 29.66] },
    description:
      "宣政院掌释教与吐蕃军民之政，帝师领院事，吐蕃之地不入行省而由宣政院直辖，下设宣慰司都元帅府。以宗教领袖兼领军民之政的治理形态由此定型，影响明清数百年的治藏框架。",
    sources: ["《元史·百官志》", "《元史·释老传》"],
  },
];

/** 按朝代 id 取该朝的边疆制度，保持注册顺序。 */
export function getFrontierPoliciesByDynasty(dynastyId: string): readonly FrontierPolicyEntry[] {
  return FRONTIER_POLICIES.filter((policy) => policy.dynastyId === dynastyId);
}
