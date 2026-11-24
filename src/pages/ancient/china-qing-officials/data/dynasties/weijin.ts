import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 魏晋南北朝：九品官人法，门阀与三省雏形。 */
export const weijin: DynastyAtlas = {
  id: "weijin",
  name: "魏晋南北朝",
  period: "220 — 589",
  system: "九品官人法 · 上品清途",
  source: "《晋书·职官志》《通典·职官》",
  intro:
    "曹魏创九品官人法，中正评第与官职品级相互表里；上品清途为门阀所据，三省雏形渐成，品级开始成为身份与清浊的标尺。",
  root: { title: "皇帝", note: "门阀政治下，皇权与士族共治" },
  honorary: [
    {
      id: "weijin-eight-dukes",
      rank: "一品 · 尊位",
      title: "八公",
      children: [
        node("weijin-taishi", "太师"),
        node("weijin-situ", "司徒"),
        node("weijin-sikong", "司空"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "三省雏形", "中书草诏、门下封驳、尚书执行，三省分权于此发端。", [
      node("weijin-zhongshu", "中书省", { note: "掌草拟诏令，中书监、令掌机要。" }),
      node("weijin-shangshu", "尚书省", { note: "尚书令、左右仆射总领六曹，为政务中枢。" }),
      node("weijin-menxia", "门下省", { note: "侍中掌规谏、封驳，渐成独立机构。" }),
    ]),
    branch(
      "assistant",
      "佐",
      "清浊之别",
      "上品清官重门第、尚玄谈，下品浊官掌实务，品第与清议相表里。",
      [
        node("weijin-pure", "清官", { note: "中书、门下、秘书、著作等，多为上品士族所居。" }),
        node("weijin-regular", "浊官", { note: "尚书省郎吏、地方掾属等实务之职。" }),
      ],
    ),
    branch("local", "地", "州郡县", "州刺史、郡太守、县令长三级，中正官掌乡里品评。", [
      node("weijin-province", "州", { note: "刺史或州牧，掌一方军政。" }),
      node("weijin-commandery", "郡", {
        children: [node("weijin-governor", "太守", { rank: "五品" }), node("weijin-vice", "郡丞")],
      }),
      node("weijin-county", "县", {
        children: [node("weijin-magistrate", "县令 / 县长"), node("weijin-aide", "县丞、主簿")],
      }),
    ]),
  ],
  hierarchyNote: "九品官人法中的「品」既评人又定官，本页阶梯取官职品级口径。",
  rankSystemLabel: "九品官人法",
  rankIntro: "曹魏立九品，官分九等；上品多为清途，品第与门第、清议相连。",
  levels: sequence([
    level("一品", "正", "丞相、八公、大司马", {
      order: 1,
      salary: 100,
      hat: "进贤冠",
      hatColor: "#8a6d1f",
      robe: "紫袍",
      robeColor: "#5b3a66",
    }),
    level("二品", "正", "录尚书事、中书监令、侍中", {
      order: 2,
      salary: 88,
      hat: "进贤冠",
      hatColor: "#9a7c2b",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("三品", "正", "吏部尚书、都督、州刺史", {
      order: 3,
      salary: 74,
      hat: "进贤冠",
      hatColor: "#aa8c3b",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("四品 — 五品", "从", "郡守、台省郎官、军府僚属", {
      order: 4,
      salary: 58,
      hat: "进贤冠",
      hatColor: "#b59a4c",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "县令、掾属", {
      order: 6,
      salary: 38,
      hat: "进贤冠",
      hatColor: "#c0aa62",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "县佐、台省吏员", {
      order: 8,
      salary: 18,
      hat: "进贤冠",
      hatColor: "#cab978",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品", "丞相、八公、大司马", [1]),
    ladder("二品 · 三品", "中书监令、侍中、吏部尚书", [2, 3]),
    ladder("四品 — 六品", "郡守、郎官、县令", [4, 5, 6]),
    ladder("七品 — 九品", "县佐、台省吏员", [7, 8, 9]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "魏晋以冠服颜色别品，补子尚未出现。",
  notes: {
    rank: "官分九等，品第与门第清议相连。",
    hat: "以进贤冠等冠制别尊卑。",
    robe: "紫、绯、绿、青依品而服。",
    salary: "品级越高，俸禄越厚。",
    ritual: "朝会位次以品第高下为准。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以品第定清浊",
    text: "上品清途居前，下品浊官居后，朝会座次依品第排定。",
    left: "上品",
    right: "下品",
  },
  footnote: "九品官人法的「品」兼评人与定官，此处按官职品级展示；官名据《晋书·职官志》。",
};
