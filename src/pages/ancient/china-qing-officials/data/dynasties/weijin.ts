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
        node("weijin-taishi", "太师", {
          note: "八公之首，天子之师，坐而论道、辅佐天子，多为上品士族或宗室元老加衔。",
        }),
        node("weijin-situ", "司徒", {
          note: "八公之一，掌民事、户籍与教化，与太尉、司空并称三公，多为荣誉尊位。",
        }),
        node("weijin-sikong", "司空", {
          note: "八公之一，掌水土、营造与百工之政，与太师、司徒同列上公，常为重臣加衔。",
        }),
        node("weijin-taifu", "太傅", {
          note: "八公之一，傅相天子与太子，主德化与辅导，位尊而务简，常授勋贵老臣。",
        }),
        node("weijin-taibao", "太保", {
          note: "八公之一，辅弼天子、保安社稷，与太师、太傅并称，多为优礼重臣之虚衔。",
        }),
        node("weijin-taiwei", "太尉", {
          note: "八公之一，掌军事征伐与军政，为最高武职尊号，曹魏以后渐成加官。",
        }),
        node("weijin-dasima", "大司马", {
          note: "八公之一，统军旅之政，位在太尉之次，常加于都督诸军事的宗室重臣。",
        }),
        node("weijin-dajiangjun", "大将军", {
          note: "八公之一，统率全国军队的最高武号，多授当朝权臣，为魏晋军政中枢之尊称。",
        }),
      ],
    },
  ],
  branches: [
    branch("central", "中", "三省雏形", "中书草诏、门下封驳、尚书执行，三省分权于此发端。", [
      node("weijin-zhongshu", "中书省", {
        note: "掌草拟诏令、参预机要，中书监、令出纳王命，为三省中最亲近天子者。属官有中书侍郎、中书舍人，分掌起草、宣诏与文书。",
        children: [
          node("weijin-zhongshujian", "中书监", {
            note: "中书省长官之一，与中书令同掌诏敕起草、参预机密，品秩清要，多为上品士族所居。",
          }),
          node("weijin-zhongshuling", "中书令", {
            note: "中书省长官之一，专司草诏、宣旨，亲近天子而掌机要，权任重于常规政务之官。",
          }),
          node("weijin-zhongshulang", "中书侍郎", {
            note: "中书监、令之副，协理诏令撰拟与文书出入，为清贵之职，常由此迁中书令。",
          }),
        ],
      }),
      node("weijin-shangshu", "尚书省", {
        note: "尚书令、左右仆射总领诸曹，为政务中枢。尚书台分为吏部、度支、五兵、祠部、都官等曹，各置尚书分掌铨选、财赋、军政、礼祀与刑狱。",
        children: [
          node("weijin-shangshu-cao", "尚书诸曹", {
            note: "尚书台分曹治事之总称，诸曹尚书各领一曹，分掌文官铨选、财赋、军政、礼祀与刑狱，为尚书省政务之骨干。",
            children: [
              node("weijin-libu-shangshu", "吏部尚书", {
                note: "尚书诸曹之首，掌文官铨选、升降与考课，与九品中正评第相表里，为士族竞争最烈之要职。",
              }),
              node("weijin-duzhi-shangshu", "度支尚书", {
                note: "掌军国财赋、仓储与收支核算，凡赋税、漕运、军粮皆考其出入，为度支曹之长。",
              }),
              node("weijin-wubing-shangshu", "五兵尚书", {
                note: "掌中兵、外兵、骑兵、别兵、都兵诸军籍与军政，为五兵曹之长，主武官铨选与征发。",
              }),
              node("weijin-cibu-shangshu", "祠部尚书", {
                note: "掌宗庙祭祀、吉凶礼制与祠祀之事，为祠部曹之长，与太常分掌礼事。",
              }),
              node("weijin-duguan-shangshu", "都官尚书", {
                note: "掌刑狱、律令与都官诸郎，为都官曹之长，主法度听讼与囚徒纠察。",
              }),
            ],
          }),
          node("weijin-shangshuling", "尚书令", {
            note: "尚书省长官，总领诸曹庶政、出纳王命，位在百僚之上，常由重臣兼录尚书事。",
          }),
          node("weijin-zuopu", "左仆射", {
            note: "尚书令之副，佐理省务，与右仆射分掌诸曹，尚书令缺员时多代行其职。",
          }),
          node("weijin-youpu", "右仆射", {
            note: "尚书令之副，协理军国庶政，与左仆射分曹治事，同为尚书台之长官。",
          }),
        ],
      }),
      node("weijin-menxia", "门下省", {
        note: "侍中掌规谏、封驳，出入禁闼、随朝奏事，渐成独立机构。黄门侍郎为其副，共司出纳诏命与纠驳之权。",
        children: [
          node("weijin-shizhong", "侍中", {
            note: "门下省长官，常侍天子左右，参与决策、驳正诏令，为近臣清要之职，多由士族名士居之。",
          }),
          node("weijin-huangmen", "黄门侍郎", {
            note: "门下省副职，掌奏事、规谏，出入禁闼，与侍中同司封驳，为清贵之选。",
          }),
        ],
      }),
    ]),
    branch(
      "assistant",
      "佐",
      "清浊之别",
      "上品清官重门第、尚玄谈，下品浊官掌实务，品第与清议相表里。",
      [
        node("weijin-pure", "清官", {
          note: "中书、门下、秘书、著作等，多为上品士族所居。职掌文书、典礼与清议，品第高、事务简，为门阀子弟标榜身份之途。",
        }),
        node("weijin-regular", "浊官", {
          note: "尚书省郎吏、地方掾属等实务之职。掌钱谷、刑狱、簿籍等具体事务，品第较低而事务繁剧，多为寒门与下品之士所任。",
        }),
      ],
    ),
    branch("local", "地", "州郡县", "州刺史、郡太守、县令长三级，中正官掌乡里品评。", [
      node("weijin-province", "州", {
        note: "州为地方最高行政层级，刺史或州牧掌一方军政、监察郡县，带将军号者兼领兵权。",
        children: [
          node("weijin-cishi", "州刺史", {
            note: "州长官，掌一州民政、刑狱与监察属郡；魏晋刺史多加将军号，军政合一，权重一方。",
          }),
          node("weijin-zhoumu", "州牧", {
            note: "州之军政长官，位在刺史之上，统辖数郡兵马，多为宗室或重臣出任，以镇一方。",
          }),
        ],
      }),
      node("weijin-commandery", "郡", {
        note: "郡上承州、下领县，太守掌一郡政令、赋税与刑狱，郡丞佐之。",
        children: [
          node("weijin-governor", "太守", {
            rank: "五品",
            note: "郡长官，掌一郡民政、赋税、刑狱与教化，上计于州，为地方要职。",
          }),
          node("weijin-vice", "郡丞", {
            note: "太守之副，佐理郡务，掌文书、仓廪与属吏纠察，太守缺员时署理郡事。",
          }),
        ],
      }),
      node("weijin-county", "县", {
        note: "县为基层行政，大县置令、小县置长，县丞、主簿分掌文书与仓廪。",
        children: [
          node("weijin-magistrate", "县令 / 县长", {
            note: "一县之长，大县称令、小县称长，掌民政、赋役、诉讼与教化，上承郡守而治其民。",
            children: [
              node("weijin-xianling", "县令", {
                note: "大县之长，掌一县政务、赋税与刑狱，品秩较高，多为士族起家之职。",
              }),
              node("weijin-xianzhang", "县长", {
                note: "小县之长，职掌与县令同而品秩稍低，治户口、田赋与乡里诉讼。",
              }),
            ],
          }),
          node("weijin-aide", "县丞、主簿", {
            note: "县令之佐官，分掌文书、仓廪与掾属事务，为县中处理日常案牍之职。",
            children: [
              node("weijin-xiancheng", "县丞", {
                note: "县令副贰，掌仓储、田赋与户籍簿籍，县令外出时代行县事。",
              }),
              node("weijin-zhubu", "主簿", {
                note: "县中掌文书案牍之官，主簿籍、印信与书记，凡县中公文皆经其手。",
              }),
            ],
          }),
        ],
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
