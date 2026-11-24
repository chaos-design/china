import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 唐：三省六部、九品三十阶，流内流外分途。 */
export const tang: DynastyAtlas = {
  id: "tang",
  name: "唐",
  period: "618 — 907",
  system: "九品三十阶 · 三省六部",
  source: "《唐六典》《通典·职官》",
  intro:
    "唐承隋制而定三省六部：中书出令、门下审驳、尚书执行；九品各分正从，四品以下再上下阶，共三十阶，流外另为一途。中叶以后使职差遣渐多，节度、观察、盐铁等实权往往不在原品秩序列内。",
  root: { title: "皇帝", note: "三省分工、六部执行，相权一分为三" },
  honorary: [
    {
      id: "tang-three-gong",
      rank: "正一品",
      title: "三公",
      children: [
        node("tang-taishi", "太师"),
        node("tang-taifu", "太傅"),
        node("tang-taibao", "太保"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "三省", "中书草诏、门下封驳、尚书总领六部，为唐代政务核心。", [
      node("tang-zhongshu", "中书省", { note: "中书令二人，掌草拟诏敕。" }),
      node("tang-menxia", "侍中", { note: "门下省长官二人，掌封驳规谏。" }),
      node("tang-shangshu", "尚书省", { note: "尚书令、左右仆射总领六部，尚书都省为政务枢纽。" }),
    ]),
    branch("assistant", "佐", "六部九寺", "六部分掌政务，九寺五监分理事务，御史台独立监察。", [
      node("tang-six-boards", "六部", {
        children: ["吏部", "户部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
          node(`tang-board-${i}`, title, { note: "尚书正三品，侍郎正四品上。" }),
        ),
      }),
      node("tang-censorate", "御史台", { note: "御史大夫、中丞掌监察弹劾。" }),
      node("tang-nine-courts", "九寺五监", {
        note: "太常、光禄、卫尉、宗正、太仆、大理、鸿胪、司农、太府。",
      }),
    ]),
    branch("local", "地", "州县", "州分上中下，县分京畿、望、紧、上、中、下，品级随等第而差。", [
      node("tang-prefecture", "州", {
        children: [
          node("tang-governor", "刺史", { rank: "从三品 — 正四品下" }),
          node("tang-vice", "别驾、长史、司马"),
        ],
      }),
      node("tang-county", "县", {
        children: [
          node("tang-magistrate", "县令", { rank: "正五品上 — 从七品下" }),
          node("tang-aide", "县丞、主簿、县尉"),
        ],
      }),
    ]),
    branch(
      "military",
      "武",
      "军镇",
      "府兵渐弛，节度使总一方军政，观察、盐铁等使职分掌财赋与监察。",
      [
        node("tang-jiedushi", "节度使", {
          note: "掌一路军政、兵马与财赋，中后期权重，往往加御史大夫衔。",
        }),
        node("tang-guard", "十六卫", { note: "左右翊府与诸卫掌宿卫，大将军为正三品。" }),
      ],
    ),
  ],
  hierarchyNote: "九品各分正从、四品以下再分上下阶，共三十阶；流外官不入九品。",
  rankSystemLabel: "九品三十阶",
  rankIntro: "九品各分正从，四品以下再分上下阶，共三十阶；流内流外分途。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保、太尉", {
      order: 1,
      salary: 100,
      hat: "进贤冠",
      hatColor: "#8a6d1f",
      robe: "紫袍 · 金鱼袋",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "太子三师、骠骑大将军", {
      order: 1,
      salary: 94,
      hat: "进贤冠",
      hatColor: "#987b2a",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("正二品", "正", "尚书令、大行台尚书令", {
      order: 2,
      salary: 84,
      hat: "进贤冠",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("从二品", "从", "左右仆射、太子少师", {
      order: 2,
      salary: 80,
      hat: "进贤冠",
      hatColor: "#ae9443",
      robe: "紫袍",
      robeColor: "#7b5a80",
    }),
    level("正三品", "正", "六部尚书、中书令、侍中", {
      order: 3,
      salary: 70,
      hat: "进贤冠",
      hatColor: "#b89e50",
      robe: "紫袍",
      robeColor: "#835f86",
    }),
    level("正四品", "正", "侍郎、左庶子、州刺史", {
      order: 4,
      salary: 56,
      hat: "进贤冠",
      hatColor: "#c0aa62",
      robe: "绯袍 · 银鱼袋",
      robeColor: "#8a3a37",
    }),
    level("正五品", "正", "郎中、国子祭酒、县令", {
      order: 5,
      salary: 44,
      hat: "进贤冠",
      hatColor: "#cab978",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "员外郎、太常博士、县丞", {
      order: 6,
      salary: 30,
      hat: "进贤冠",
      hatColor: "#d2c389",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "主簿、县尉、录事", {
      order: 8,
      salary: 14,
      hat: "进贤冠",
      hatColor: "#dacd9b",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
    level("流外", "—", "诸司吏员、书令史", {
      order: 10,
      salary: 6,
      hat: "无品",
      hatColor: "#9aa0a6",
      robe: "皂袍",
      robeColor: "#55555d",
    }),
  ]),
  ladderGroups: [
    ladder("一品", "三公、太子三师", [1]),
    ladder("二品", "尚书令、左右仆射", [2]),
    ladder("三品", "六部尚书、中书令、侍中", [3]),
    ladder("四品 — 七品", "侍郎、郎中、刺史、县令", [4, 5, 6, 7]),
    ladder("八品 — 九品 · 流外", "主簿、县尉、诸司吏员", [8, 9, 10]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "唐代以紫、绯、绿、青四色与鱼袋别品，补子尚未出现。",
  notes: {
    rank: "九品各分正从，四品以下再分上下阶，共三十阶。",
    hat: "以进贤冠等冠制与簪笏别尊卑。",
    robe: "三品以上紫、四五品绯、六七品绿、八九品青。",
    salary: "品阶越高，禄米越多。",
    ritual: "朝会班序依品阶排定。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以品阶定班序",
    text: "朝会、宴饮与大典的班序依品阶高下排定。",
    left: "一品",
    right: "流外",
  },
  footnote: "九品三十阶据《唐六典》《通典·职官》；服色为通行记载，具体员额以唐代令式为准。",
};
