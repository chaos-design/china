import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 金：猛安谋克与州县并行，海陵王改制后汉制大备。 */
export const jin: DynastyAtlas = {
  id: "jin",
  name: "金",
  period: "1115 — 1234",
  system: "猛安谋克 · 汉制并用",
  source: "《金史·百官志》",
  intro:
    "金初以猛安谋克统女真部众，与州县汉制并行；海陵王改制后仿唐宋立尚书省、枢密院、御史台，女真旧制与汉制并用，形成一套二元官制。",
  root: { title: "皇帝", note: "汉制总政务、猛安谋克统部众，女真旧制与州县并行" },
  honorary: [
    {
      id: "jin-honor-three-gong",
      rank: "正一品",
      title: "金之三师",
      children: [node("jin-taishi", "太师"), node("jin-taifu", "太傅"), node("jin-taibao", "太保")],
    },
  ],
  branches: [
    branch(
      "jin-central",
      "中",
      "汉制中枢",
      "海陵王改制后尚书省总政务、枢密院掌军、御史台司纠察。",
      [
        node("jin-shangshu", "尚书省", {
          note: "金最高政务机构，总领六部、统辖百司。",
          children: [
            node("jin-zuochengxiang", "左丞相", { note: "尚书省长官之一，金制以左为上。" }),
            node("jin-youchengxiang", "右丞相", { note: "尚书省长官之一，佐左丞相理省务。" }),
          ],
        }),
        node("jin-yushitai", "御史台", { note: "掌监察纠弹，置御史大夫、御史中丞、侍御史。" }),
        node("jin-shumiyuan", "枢密院", { note: "掌全国军政、军令与边防，与尚书省对掌文武。" }),
      ],
    ),
    branch(
      "jin-tribal",
      "部",
      "女真旧制",
      "猛安谋克军政合一，世袭领部众、屯田与征伐，与州县并行而不相属。",
      [
        node("jin-mengan", "猛安", {
          note: "约当千户，掌部众、屯田、征伐与户籍，多世袭，是金室根本武力所托。",
        }),
        node("jin-mouke", "谋克", {
          note: "猛安之下约当百户的单位，掌民户、田亩与兵役，无事耕牧、有事从征。",
        }),
        node("jin-zhongdu", "中都路", { note: "猛安谋克错列州县之间，屯田与州县户籍分属两系统。" }),
      ],
    ),
    branch(
      "jin-local",
      "地",
      "州县军镇",
      "州分节度、防御、刺史三等，县置令、丞、尉，节度使兼掌军政。",
      [
        node("jin-jiedushi", "节度使", { note: "金于诸州置节度使，掌一路军政、兵马与财赋。" }),
        node("jin-fangyushi", "防御使", { note: "置于防御州，掌州城防御、军政与治安。" }),
        node("jin-zhouxian", "州县", {
          children: [
            node("jin-cizhou", "刺史州 · 知州", { note: "掌一州民政、赋役与刑狱。" }),
            node("jin-xianling", "县令", { note: "一县长官，掌赋役、狱讼、劝农与教化。" }),
          ],
        }),
      ],
    ),
  ],
  hierarchyNote:
    "尚书省总政务、枢密院掌军、御史台司纠察，猛安谋克与州县并行；汉制与女真旧制同列于皇帝之下，各有所掌。",
  rankSystemLabel: "九品参用 · 蕃汉异制",
  rankIntro: "金品秩借鉴唐宋九品正从，猛安谋克与州县各有等差；世袭部族官与流内汉官同列而职掌不同。",
  levels: sequence([
    level("一品", "正", "太师、尚书令、左右丞相", {
      order: 1,
      salary: 100,
      hat: "金花毡冠",
      hatColor: "#8a6d1f",
      robe: "紫袍金带",
      robeColor: "#5b3a66",
      salaryLabel: "食封户 · 岁赐最厚",
    }),
    level("从一品", "从", "平章政事、枢密使", {
      order: 2,
      salary: 92,
      hat: "金花毡冠",
      hatColor: "#987b2a",
      robe: "紫袍金带",
      robeColor: "#66446f",
    }),
    level("二品", "正", "六部尚书、御史大夫", {
      order: 3,
      salary: 82,
      hat: "金饰幞头",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("三品", "正", "翰林学士承旨、节度使", {
      order: 4,
      salary: 70,
      hat: "金饰幞头",
      hatColor: "#b89e50",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("四品 — 五品", "从", "六部侍郎、防御使、猛安", {
      order: 5,
      salary: 56,
      hat: "银饰幞头",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "员外郎、州县正官、谋克", {
      order: 6,
      salary: 38,
      hat: "幞头",
      hatColor: "#cab978",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "主簿、县尉、诸司属吏", {
      order: 7,
      salary: 18,
      hat: "幞头",
      hatColor: "#d2c389",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品 · 从一品", "太师、尚书令、枢密使", [1, 2]),
    ladder("二品 · 三品", "六部尚书、御史大夫、节度使", [3, 4]),
    ladder("四品 — 五品", "侍郎、防御使、猛安", [5]),
    ladder("六品 — 七品", "员外郎、州县正官、谋克", [6]),
    ladder("八品 — 九品", "主簿、县尉、诸司属吏", [7]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "补子为明清定制，金无补子之制；女真贵族尚左衽与金带，不以禽兽补纹分文武。",
  notes: {
    rank: "品秩借鉴唐宋九品正从，猛安谋克与州县各有等差；部族世袭官与汉官多不同品。",
    hat: "以毡冠、金花与幞头之别辨贵贱，女真旧制多存本族冠服。",
    robe: "紫、绯、绿、青参用唐宋，女真贵胄尚左衽，以金带、玉带辨等威。",
    salary: "俸禄依品秩厚薄，兼有分地、食封户与岁赐，猛安谋克多食封户、征赋自给。",
    ritual: "朝会班序依品秩与族属而别，女真旧礼与唐宋朝仪并存。",
    badge: "补子未兴，以鱼袋、金带与服色辨尊卑文武。",
  },
  ritual: {
    title: "汉制与旧俗并立",
    text: "金廷朝会，汉制百官依品列班，女真部族首长另依旧俗与世系叙位，两套秩序同朝并存。",
    left: "汉制 · 尚书省",
    right: "旧俗 · 猛安谋克",
  },
  footnote: "金官制兼采唐宋与女真旧制，本文品秩为参照九品之制的示意梳理；官名据《金史·百官志》。",
};
