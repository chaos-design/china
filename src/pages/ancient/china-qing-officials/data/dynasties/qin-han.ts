import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 秦：无「品」，以印绶与秩石定尊卑。 */
export const qin: DynastyAtlas = {
  id: "qin",
  name: "秦",
  period: "前221 — 前206",
  system: "三公九卿 · 印绶秩石",
  source: "《汉书·百官公卿表》《史记·秦始皇本纪》",
  intro:
    "秦无「品」，以印绶与秩石定尊卑：金印紫绶最高、银印青绶次之，三公总揽、九卿分曹，郡县两级直承朝廷。",
  root: { title: "皇帝", note: "总揽军政，三公九卿与郡县分职而治" },
  honorary: [
    {
      id: "qin-three-dukes",
      rank: "金印紫绶 · 万石",
      title: "三公",
      children: [
        node("qin-chancellor", "丞相"),
        node("qin-grand-marshal", "太尉"),
        node("qin-censor", "御史大夫"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "中枢与三公", "丞相助理万机，太尉掌兵，御史大夫监察，为秦制核心。", [
      node("qin-chancellor-office", "丞相府", {
        rank: "金印紫绶 · 万石",
        note: "秦分左右丞相，为百官之长。",
      }),
      node("qin-marshal-office", "太尉府", {
        rank: "金印紫绶 · 万石",
        note: "掌全国武事，常虚置而不轻授。",
      }),
      node("qin-censor-office", "御史大夫", {
        rank: "银印青绶 · 中二千石",
        note: "副丞相，典法度、掌图籍并监察百官。",
      }),
    ]),
    branch("assistant", "佐", "九卿", "分掌宗庙、宫殿、车马、刑狱、财政等具体事务的中央诸卿。", [
      node("qin-nine-ministers", "奉常 / 郎中令 / 卫尉", {
        note: "掌宗庙礼仪、宫殿门户与宫门屯兵。",
      }),
      node("qin-nine-ministers-2", "太仆 / 廷尉 / 典客", { note: "掌车马、刑狱与宾客接待。" }),
      node("qin-nine-ministers-3", "宗正 / 治粟内史 / 少府", {
        note: "掌皇族、田租赋税与山海池泽之税。",
      }),
    ]),
    branch("local", "地", "郡县", "废分封、行郡县，地方长官由朝廷任免，直承中央。", [
      node("qin-commandery", "郡", {
        children: [
          node("qin-governor", "郡守", { rank: "银印青绶 · 二千石" }),
          node("qin-commandant", "郡尉", { rank: "银印青绶 · 比二千石" }),
          node("qin-inspector", "郡监御史"),
        ],
      }),
      node("qin-county", "县", {
        children: [
          node("qin-county-magistrate", "县令 / 县长", { rank: "千石 — 六百石" }),
          node("qin-county-vice", "县丞", { rank: "四百石 — 二百石" }),
          node("qin-county-clerk", "县尉"),
        ],
      }),
    ]),
  ],
  hierarchyNote: "秦以秩石代品，图中「约当 N 品」仅为跨朝对照的示意，不代表秦代真有九品之名。",
  rankSystemLabel: "秩石 · 印绶",
  rankIntro: "秦无九品，以印绶颜色与秩石等第定尊卑，金印紫绶最贵。",
  levels: sequence([
    level("万石 · 约当一品", "正", "丞相、太尉、御史大夫", {
      order: 1,
      salary: 100,
      hat: "金印紫绶",
      hatColor: "#8a6d1f",
      robe: "黑色（尚水德）",
      robeColor: "#2b2b32",
    }),
    level("中二千石 · 约当二品", "从", "奉常、郎中令、卫尉", {
      order: 2,
      salary: 82,
      hat: "银印青绶",
      hatColor: "#5c7f8a",
      robe: "黑色",
      robeColor: "#33333b",
    }),
    level("二千石 · 约当三品", "正", "郡守、典客", {
      order: 3,
      salary: 68,
      hat: "银印青绶",
      hatColor: "#6b8b95",
      robe: "黑色",
      robeColor: "#3a3a43",
    }),
    level("千石 — 六百石", "—", "县令、御史中丞", {
      order: 4,
      salary: 48,
      hat: "铜印黑绶",
      hatColor: "#4a4a52",
      robe: "青色",
      robeColor: "#3d5a52",
    }),
    level("四百石 — 二百石", "—", "县丞、县尉", {
      order: 6,
      salary: 28,
      hat: "铜印黄绶",
      hatColor: "#a6882c",
      robe: "青色",
      robeColor: "#4a6a60",
    }),
    level("百石以下", "—", "佐史、书佐", {
      order: 9,
      salary: 8,
      hat: "青绶",
      hatColor: "#7a8f96",
      robe: "皂色",
      robeColor: "#55555d",
    }),
  ]),
  ladderGroups: [
    ladder("万石 · 三公", "丞相、太尉、御史大夫", [1]),
    ladder("中二千石 · 九卿", "奉常、郎中令、卫尉等", [2]),
    ladder("二千石 · 郡守", "郡守、典客", [3]),
    ladder("千石以下", "县令、县丞、佐史", [4, 5, 6, 7, 8, 9]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "秦以印绶与冠服别尊卑，补子尚未出现（补服为明清定制）。",
  notes: {
    rank: "秦无九品，以印绶颜色与秩石等第定尊卑。",
    hat: "以印绶材质与颜色区分等级：金印紫绶最贵。",
    robe: "秦尚水德，服色尚黑。",
    salary: "秩石越高，俸禄越多。",
    ritual: "朝会位次依秩石高下排定。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以秩石定朝位",
    text: "朝会、宴会与仪仗的位次依秩石高下排定。",
    left: "万石",
    right: "佐史",
  },
  footnote: "秦行秩石制，本页「约当」品序仅为示意对照；官名与秩石据《汉书·百官公卿表》。",
};

/** 汉：三公九卿与内外朝，秩石十六等。 */
export const han: DynastyAtlas = {
  id: "han",
  name: "汉",
  period: "前206 — 220",
  system: "三公九卿 · 秩石十六等",
  source: "《汉书·百官公卿表》《后汉书·百官志》",
  intro:
    "汉承秦制而损益：三公九卿分掌政务，尚书台渐成内朝中枢，刺史监察州部，秩石自万石以下分为十余等。",
  root: { title: "皇帝", note: "外朝三公九卿与内朝尚书并立" },
  honorary: [
    {
      id: "han-three-dukes",
      rank: "万石",
      title: "三公",
      children: [
        node("han-chancellor", "丞相（司徒）"),
        node("han-marshal", "太尉（司马）"),
        node("han-censor", "御史大夫（司空）"),
      ],
    },
  ],
  branches: [
    branch(
      "central",
      "中",
      "外朝 · 三公九卿",
      "丞相、太尉、御史大夫分掌政、军、监察，九卿分曹治事。",
      [
        node("han-chancellor-office", "丞相府", { rank: "万石", note: "掌丞天子、助理万机。" }),
        node("han-nine-ministers", "九卿", {
          note: "太常、光禄勋、卫尉、太仆、廷尉、大鸿胪、宗正、大司农、少府。",
        }),
        node("han-inner-court", "尚书台", { note: "本为少府属官，汉武帝后渐成内朝决策中枢。" }),
      ],
    ),
    branch("assistant", "佐", "监察与京畿", "刺史以卑临尊监察州部，三辅与京兆分治京畿。", [
      node("han-inspector", "刺史", {
        rank: "六百石",
        note: "以六百石监察二千石郡守，卑临尊之制。",
      }),
      node("han-capital", "京兆尹 / 左冯翊 / 右扶风", {
        rank: "二千石",
        note: "三辅分治京畿地区。",
      }),
    ]),
    branch("local", "地", "州郡县", "州为监察区，郡国并行，县分大小置令、长。", [
      node("han-province", "州", { note: "东汉末州牧渐成一级行政机构。" }),
      node("han-commandery", "郡 / 王国", {
        children: [
          node("han-governor", "太守", { rank: "二千石" }),
          node("han-vice", "郡丞", { rank: "六百石" }),
        ],
      }),
      node("han-county", "县", {
        children: [
          node("han-county-magistrate", "县令 / 县长", { rank: "千石 — 三百石" }),
          node("han-county-vice", "县丞 / 县尉"),
        ],
      }),
    ]),
  ],
  hierarchyNote: "汉代秩石与后代九品不同轴；本页品序为跨朝对照示意。",
  rankSystemLabel: "秩石十六等",
  rankIntro: "汉以秩石定尊卑，自万石至佐史凡十余等，并以印绶颜色相别。",
  levels: sequence([
    level("万石 · 约当一品", "正", "丞相、太傅、太保", {
      order: 1,
      salary: 100,
      hat: "金印紫绶",
      hatColor: "#8a6d1f",
      robe: "玄色",
      robeColor: "#292934",
    }),
    level("中二千石 · 约当二品", "从", "九卿、京兆尹", {
      order: 2,
      salary: 84,
      hat: "银印青绶",
      hatColor: "#5c7f8a",
      robe: "玄色",
      robeColor: "#32323e",
    }),
    level("二千石 · 约当三品", "正", "郡太守、州牧", {
      order: 3,
      salary: 70,
      hat: "银印青绶",
      hatColor: "#6b8b95",
      robe: "青色",
      robeColor: "#3d5a52",
    }),
    level("比二千石 · 约当四品", "从", "西域都护、校尉", {
      order: 4,
      salary: 60,
      hat: "银印青绶",
      hatColor: "#7596a0",
      robe: "青色",
      robeColor: "#45635a",
    }),
    level("千石 — 六百石", "—", "县令、刺史、御史中丞", {
      order: 5,
      salary: 44,
      hat: "铜印黑绶",
      hatColor: "#4a4a52",
      robe: "绿色",
      robeColor: "#3f6349",
    }),
    level("四百石 — 二百石", "—", "县丞、县尉", {
      order: 7,
      salary: 26,
      hat: "铜印黄绶",
      hatColor: "#a6882c",
      robe: "绿色",
      robeColor: "#4b7054",
    }),
    level("百石以下", "—", "佐史、书佐", {
      order: 9,
      salary: 8,
      hat: "青绶",
      hatColor: "#7a8f96",
      robe: "皂色",
      robeColor: "#55555d",
    }),
  ]),
  ladderGroups: [
    ladder("万石 · 三公", "丞相、太傅、太保", [1]),
    ladder("中二千石 · 九卿", "太常、光禄勋、卫尉等", [2]),
    ladder("二千石 · 郡守", "太守、州牧", [3, 4]),
    ladder("千石以下", "县令、刺史、佐史", [5, 6, 7, 8, 9]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "汉以印绶与冠服别尊卑，补子尚未出现。",
  notes: {
    rank: "汉以秩石定尊卑，自万石至佐史凡十余等。",
    hat: "印绶材质与颜色区分等级。",
    robe: "汉尚玄色，朝服依秩石而异。",
    salary: "秩石越高，俸禄越多。",
    ritual: "朝会位次依秩石高下。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以秩石定朝位",
    text: "朝会、宴会与仪仗的位次依秩石高下排定。",
    left: "万石",
    right: "佐史",
  },
  footnote: "汉行秩石制，「约当」品序仅为示意；官名与秩石据《汉书·百官公卿表》。",
};
