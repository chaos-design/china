import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 隋：三省六部定型、九品各分正从，罢郡存州。 */
export const sui: DynastyAtlas = {
  id: "sui",
  name: "隋",
  period: "581 — 618",
  system: "九品正从 · 三省六部",
  source: "《隋书·百官志》《通典·职官》",
  intro:
    "隋文帝废北周六官，复汉魏之旧而立三省六部：内史出令、纳言封驳、尚书执行；九品各分正从，共十八等，流外另为一途。炀帝时改州为郡，地方二级制取代州郡县三级。",
  root: { title: "皇帝", note: "三省分权、六部执行，废六官而复汉魏旧制" },
  honorary: [
    {
      id: "sui-three-gong",
      rank: "正一品",
      title: "三公",
      children: [node("sui-taishi", "太师"), node("sui-situ", "司徒"), node("sui-sikong", "司空")],
    },
  ],
  branches: [
    branch("central", "中", "三省", "内史省草诏、门下省封驳、尚书省总领六部，为隋代政务核心。", [
      node("sui-neishi", "内史省", { note: "内史令二人掌草诏，避隋讳不称中书。" }),
      node("sui-menxia", "纳言", { note: "门下省长官二人，掌封驳规谏，即唐代侍中之职。" }),
      node("sui-shangshu", "尚书省", { note: "尚书令、左右仆射总领六部，尚书都省为政务枢纽。" }),
    ]),
    branch("assistant", "佐", "六部九寺", "六部分掌政务，九寺五监分理事务，御史台独立监察。", [
      node("sui-six-boards", "六部", {
        children: ["吏部", "民部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
          node(`sui-board-${i}`, title, { note: "各置尚书一人、侍郎二人，分掌本曹政务。" }),
        ),
      }),
      node("sui-censorate", "御史台", { note: "御史大夫、治书侍御史掌监察弹劾。" }),
      node("sui-nine-courts", "九寺五监", {
        note: "太常、光禄、卫尉、宗正、太仆、大理、鸿胪、司农、太府。",
      }),
    ]),
    branch("local", "地", "州县", "炀帝改州为郡，郡县二级：郡置太守、通守，县置令、丞、尉。", [
      node("sui-prefecture", "州 · 郡", {
        children: [
          node("sui-governor", "刺史 / 太守", { rank: "从三品 — 正四品" }),
          node("sui-vice", "别驾、通守"),
        ],
      }),
      node("sui-county", "县", {
        children: [
          node("sui-magistrate", "县令", { rank: "正五品 — 从七品" }),
          node("sui-aide", "县丞、县尉"),
        ],
      }),
    ]),
    branch("military", "武", "卫府", "十二卫掌宿卫，府兵寓农于兵，折冲府隶于卫府。", [
      node("sui-twelve-guard", "十二卫", { note: "翊军、骁骑等卫，各置大将军一人、将军二人。" }),
      node("sui-zhechong", "折冲府", {
        note: "府兵基层，置折冲都尉、左右果毅都尉，平时务农、农闲训练。",
      }),
    ]),
  ],
  hierarchyNote: "九品各分正从，共十八等；流外官不入九品，与流内出身判然有别。",
  rankSystemLabel: "九品正从",
  rankIntro: "九品各分正从，共十八等；不似唐制四品以下再分上下阶。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保", {
      order: 1,
      salary: 100,
      hat: "进贤冠",
      hatColor: "#8a6d1f",
      robe: "紫袍",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "太子三师、骠骑将军", {
      order: 2,
      salary: 94,
      hat: "进贤冠",
      hatColor: "#987b2a",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("正二品", "正", "尚书令、左右仆射", {
      order: 3,
      salary: 84,
      hat: "进贤冠",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("从二品", "从", "内史令、纳言", {
      order: 4,
      salary: 80,
      hat: "进贤冠",
      hatColor: "#ae9443",
      robe: "紫袍",
      robeColor: "#7b5a80",
    }),
    level("正三品", "正", "六部尚书、御史大夫", {
      order: 5,
      salary: 70,
      hat: "进贤冠",
      hatColor: "#b89e50",
      robe: "紫袍",
      robeColor: "#835f86",
    }),
    level("从三品", "从", "州刺史、太守", {
      order: 6,
      salary: 62,
      hat: "进贤冠",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("正四品 — 五品", "正", "六部侍郎、县令", {
      order: 7,
      salary: 44,
      hat: "进贤冠",
      hatColor: "#cab978",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "员外郎、县丞、县尉", {
      order: 8,
      salary: 30,
      hat: "进贤冠",
      hatColor: "#d2c389",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "主簿、诸司吏员", {
      order: 9,
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
    ladder("一品 · 从一品", "太师、太子三师", [1, 2]),
    ladder("二品", "尚书令、内史令、纳言", [3, 4]),
    ladder("三品", "六部尚书、御史大夫", [5]),
    ladder("四品 — 七品", "刺史、六部侍郎、县令", [6, 7]),
    ladder("八品 — 九品 · 流外", "县丞、主簿、诸司吏员", [8, 9, 10]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "隋代以紫、绯、绿、青诸色别品，补子尚未出现。",
  notes: {
    rank: "九品各分正从，共十八等，流外不入九品。",
    hat: "以进贤冠等冠制别尊卑。",
    robe: "紫、绯、绿、青依品而服。",
    salary: "品级越高，禄米越厚。",
    ritual: "朝会班序依品阶排定。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以品阶定班序",
    text: "朝会与大典的班序依品阶高下排定，三省长官各依本班列立。",
    left: "正一品",
    right: "流外",
  },
  footnote: "九品正从据《隋书·百官志》；内史、纳言为隋代本名，不借用唐宋的中书令、侍中。",
};
