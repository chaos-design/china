import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 辽：以国制治契丹、以汉制待汉人，北南面官分途。 */
export const liao: DynastyAtlas = {
  id: "liao",
  name: "辽",
  period: "916 — 1125",
  system: "因俗而治 · 南北面官",
  source: "《辽史·百官志》《契丹国志》",
  intro:
    "辽「以国制治契丹，以汉制待汉人」：北面官存契丹旧制，掌部族军政与宫卫；南面官仿唐制置三省六部，治汉人州县。两套系统并行，是因俗设官的典型。",
  root: { title: "皇帝", note: "北南面官分掌契丹与汉人，皇帝总揽而诸制并立" },
  honorary: [
    {
      id: "liao-honor-yuyue",
      rank: "超品（无定品）",
      title: "于越 · 大王",
      children: [
        node("liao-yuyue", "于越", {
          note: "辽代最高尊官，位在丞相、枢密使之上，总揽军国大政，多由皇族、外戚及勋臣任之。",
        }),
        node("liao-nanyuan-dawang", "南院大王", {
          note: "北面官大王院之长，掌所部契丹户民、兵甲与游牧事宜。",
        }),
        node("liao-beiyuan-dawang", "北院大王", {
          note: "北面官大王院之长，统契丹核心部族兵马，多由皇族出任。",
        }),
      ],
    },
  ],
  branches: [
    branch(
      "liao-beimian",
      "北",
      "北面官",
      "北面官「以国制治契丹」及诸部族，掌军政、部众与宫卫，官职多存契丹旧名。",
      [
        node("liao-beishumiyuan", "北枢密院", {
          note: "北面最高军政机构，长官为北院枢密使，掌契丹兵马、部族军政与边防。",
        }),
        node("liao-dawangyuan", "大王院", {
          children: [
            node("liao-nandawangyuan", "南大王院", {
              note: "南院大王所治，掌所部契丹户民与游牧。",
            }),
            node("liao-beidawangyuan", "北大王院", { note: "北院大王所治，统契丹核心部族。" }),
          ],
        }),
        node("liao-yilijin", "夷离堇", {
          note: "契丹旧制部落军事首长，掌一部军马与征伐，后多改称节度使而北面仍存旧名。",
        }),
        node("liao-gongwei", "宫卫 · 斡鲁朵", {
          note: "皇帝、皇后及皇族之宫卫，各有斡鲁朵名号，掌禁中宿卫与私属部众，自成军政系统。",
        }),
      ],
    ),
    branch(
      "liao-nanmian",
      "南",
      "南面官",
      "南面官「以汉制待汉人」及渤海人，仿唐制设三省六部与翰林院，掌州县民政、赋税与文教。",
      [
        node("liao-zhongshu", "中书省", {
          note: "南面最高政务机构，置中书令、左右丞相、参知政事，总领汉地民政。",
        }),
        node("liao-menxia", "门下省", { note: "置侍中、门下侍郎，掌封驳审议、出纳诏令。" }),
        node("liao-shangshu", "尚书省", {
          note: "置尚书令、左右仆射，统领六部，为汉制政务之总汇。",
        }),
        node("liao-liubu", "六部", {
          children: ["吏部", "户部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
            node(`liao-board-${i}`, title, { note: "南面六部之一，尚书、侍郎分掌本曹政务。" }),
          ),
        }),
        node("liao-hanlin", "翰林院", {
          note: "置翰林学士承旨、翰林学士，掌诏敕起草、国史纂修与备顾问。",
        }),
      ],
    ),
    branch(
      "liao-local",
      "地",
      "地方与部族",
      "汉地州县仿唐制而略简，契丹部族与宫卫另成一系，节度使多由契丹贵族出任。",
      [
        node("liao-jiedushi", "节度使", {
          note: "辽于诸州及部族置节度使，掌一方军政、兵马与财赋。",
        }),
        node("liao-zhouxian", "州县", {
          children: [
            node("liao-cizhou", "刺史州 · 知州", { note: "掌一州民政、赋役与刑狱。" }),
            node("liao-xianling", "县令", { note: "一县长官，掌赋役、狱讼、劝农与教化。" }),
          ],
        }),
      ],
    ),
  ],
  hierarchyNote:
    "北南面官分途而治：北面存契丹旧制与部族旧名，南面仿唐制治汉人州县；同品之中职掌、族属与升迁之途往往不一。",
  rankSystemLabel: "九品参用 · 北南异制",
  rankIntro:
    "辽品秩借鉴唐制九品正从，又兼存契丹部族旧官：北面官多依族属、南面官依汉制品阶，同品而职掌悬殊。",
  levels: sequence([
    level("一品", "正", "于越、南北院大王", {
      order: 1,
      salary: 100,
      hat: "金花毡冠",
      hatColor: "#8a6d1f",
      robe: "紫袍金带",
      robeColor: "#5b3a66",
      salaryLabel: "食封户 · 岁赐最厚",
    }),
    level("从一品", "从", "北南院枢密使、中书令", {
      order: 2,
      salary: 92,
      hat: "金花毡冠",
      hatColor: "#987b2a",
      robe: "紫袍金带",
      robeColor: "#66446f",
    }),
    level("二品", "正", "六部尚书、左右丞相", {
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
    level("四品 — 五品", "从", "六部侍郎、夷离堇", {
      order: 5,
      salary: 56,
      hat: "银饰幞头",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "州县正官、翰林学士", {
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
    ladder("一品 · 从一品", "于越、南北院大王、枢密使", [1, 2]),
    ladder("二品 · 三品", "六部尚书、节度使", [3, 4]),
    ladder("四品 — 五品", "六部侍郎、夷离堇", [5]),
    ladder("六品 — 七品", "州县正官、翰林学士", [6]),
    ladder("八品 — 九品", "主簿、县尉、诸司属吏", [7]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "补子为明清定制，辽无补子之制；契丹贵族尚左衽与金带，不以禽兽补纹分文武。",
  notes: {
    rank: "品秩借鉴唐九品正从，又存契丹部族旧职；北面依族属、南面依汉制，同品而职掌悬殊。",
    hat: "以毡冠、金花与银饰之别辨贵贱；北面多存本族旧服，南面从汉制幞头。",
    robe: "紫、绯、绿、青参用唐制，契丹贵胄尚左衽，以金带、玉带辨等威。",
    salary: "俸禄依品秩厚薄，兼有分地、食封户与岁赐，部族贵族多食封户、征赋自给。",
    ritual: "朝会班序依品秩与族属而别，北面、南面分班列立，各依本族之俗与汉制之仪。",
    badge: "补子未兴，以鱼袋、金带与服色辨尊卑文武。",
  },
  ritual: {
    title: "班分南北 · 因俗而治",
    text: "辽廷朝会，北面官与南面官分班列立，各依本族之俗与汉制之仪，是为一朝而众制并存。",
    left: "北面 · 国制",
    right: "南面 · 汉制",
  },
  footnote:
    "辽官制兼采唐制与契丹旧制，本文品秩为参照九品之制的示意梳理；官名据《辽史·百官志》《契丹国志》。",
};
