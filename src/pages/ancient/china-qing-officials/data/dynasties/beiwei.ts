import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/**
 * 北魏（386—534）：鲜卑拓跋部入主中原，糅合部落联盟旧制与魏晋汉制。
 * 孝文帝太和改制（约 477—499）仿南朝典章厘定官常、改姓氏、易冠服、迁都洛阳，
 * 形成胡汉并置的二元官制。官品承魏晋九品而各分正从，宗室勋贵与中原士族同列朝班。
 */
export const beiwei: DynastyAtlas = {
  id: "beiwei",
  name: "北魏",
  period: "386 — 534",
  system: "九品正从 · 胡汉糅合 · 太和改制",
  source: "《魏书·官氏志》《魏书·孝文帝纪》《通典·职官》《北史》",
  intro:
    "北魏起于鲜卑拓跋部落联盟，道武帝建国后渐采魏晋汉制，至孝文帝太和年间全面改制：仿南朝厘定三省六曹与九卿，改鲜卑姓氏、禁北语、易冠服、迁都洛阳。官制一面承汉晋九品之制、品各分正从，一面保留八部大人、宗室诸王与军镇镇将等鲜卑旧贵色彩，九品中正与胡汉分职并行，遂成胡汉糅合的二元格局。",
  root: {
    title: "皇帝",
    note: "拓跋皇权与宗室勋贵共治；太和改制后以汉制重整官常，鲜卑旧贵与中原士族并立朝班。",
  },
  honorary: [
    {
      id: "beiwei-three-gong",
      rank: "一品 · 上公",
      title: "三公（上公）",
      children: [
        node("beiwei-taishi", "太师", {
          rank: "一品",
          note: "上公之一，位极人臣，多为宗室元老或勋贵加衔，主辅导天子、总揽朝政。",
        }),
        node("beiwei-taifu", "太傅", {
          rank: "一品",
          note: "上公之一，与太师、太保并称三公，掌教天子以德义，常为荣誉极高之职。",
        }),
        node("beiwei-taibao", "太保", {
          rank: "一品",
          note: "上公之一，辅弼天子、守卫社稷，太和改制后多授宗室重臣。",
        }),
      ],
    },
    {
      id: "beiwei-tribal",
      rank: "超品 · 鲜卑旧贵",
      title: "部落大人与宗室诸王",
      children: [
        node("beiwei-badaren", "八部大人", {
          note: "源于鲜卑部落联盟的八国（八部）大人，参与军国大议，是部落贵族分权共治的旧制遗存，太和改制后渐被汉制官品消化。",
        }),
        node("beiwei-zongwang", "宗室诸王", {
          note: "拓跋宗室封王，位在百僚之上，出则镇守方镇、入则参预机要，宗室与勋贵同为皇权支柱。",
        }),
      ],
    },
  ],
  branches: [
    branch(
      "beiwei-central",
      "中",
      "三省",
      "尚书总庶政、中书掌诏令、门下司封驳，三省雏形于北魏渐趋完备，为太和改制后政务中枢。",
      [
        node("beiwei-shangshu", "尚书省", {
          note: "尚书台总领全国政务，令、仆射统领诸曹，是实际行政中枢。",
          children: [
            node("beiwei-shangshuling", "尚书令", {
              rank: "二品",
              note: "尚书省长官，总揽六曹庶政，位高权重，常由宗室或重臣担任。",
            }),
            node("beiwei-zuopu", "左仆射", {
              rank: "从二品",
              note: "尚书令之副，佐理省务，与右仆射分掌诸曹。",
            }),
            node("beiwei-youpu", "右仆射", {
              rank: "从二品",
              note: "尚书令之副，协理军国庶政。",
            }),
          ],
        }),
        node("beiwei-zhongshu", "中书省", {
          note: "掌草拟诏令、参议机要，中书监、令出纳王命，渐成独立机构。",
          children: [
            node("beiwei-zhongshujian", "中书监", {
              rank: "二品",
              note: "中书省长官之一，与中书令同掌诏敕起草、参预机密。",
            }),
            node("beiwei-zhongshuling", "中书令", {
              rank: "三品",
              note: "中书省长官之一，专司草诏、宣旨，亲近天子。",
            }),
          ],
        }),
        node("beiwei-menxia", "门下省", {
          note: "侍中、黄门侍郎掌规谏、封驳与随朝奏事，门下地位在北魏显著上升。",
          children: [
            node("beiwei-shizhong", "侍中", {
              rank: "三品",
              note: "门下省长官，常侍天子左右，参与决策、驳正诏令。",
            }),
            node("beiwei-huangmen", "黄门侍郎", {
              rank: "四品",
              note: "门下省副职，掌奏事、规谏，出入禁闼，为清要之职。",
            }),
          ],
        }),
      ],
    ),
    branch(
      "beiwei-assistant",
      "佐",
      "六曹九卿",
      "尚书六曹分掌政务，九卿沿汉晋旧制分理事务，御史台独立监察，共成佐理之政。",
      [
        node("beiwei-liucao", "六曹（尚书曹）", {
          note: "吏部、户部、礼部、兵部、刑部、工部六曹，各置尚书、侍郎分理庶政。",
          children: ["吏部", "户部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
            node(`beiwei-board-${i}`, title, {
              note: "曹长官为尚书，副为侍郎，吏部尚书掌铨选，尤为要职。",
            }),
          ),
        }),
        node("beiwei-jiuqing", "九卿", {
          note: "太常、光禄勋、卫尉、太仆、廷尉、大鸿胪、宗正、大司农、太府九卿，沿汉晋之制分掌礼、仪、军、刑、财诸务。",
          children: [
            "太常",
            "光禄勋",
            "卫尉",
            "太仆",
            "廷尉",
            "大鸿胪",
            "宗正",
            "大司农",
            "太府",
          ].map((title, i) =>
            node(`beiwei-court-${i}`, title, {
              note: "九卿之一，位列三公之下，掌专项事务。",
            }),
          ),
        }),
        node("beiwei-yushitai", "御史台", {
          note: "御史大夫、御史中丞掌纠察弹劾、肃清朝纲，独立于行政系统之外。",
        }),
      ],
    ),
    branch(
      "beiwei-imperial",
      "帝",
      "宗室东宫",
      "宗正掌皇族谱牒，太子三师三少辅导储君，内廷诸职侍奉禁中，宗室勋贵于此维系。",
      [
        node("beiwei-zongzhengsi", "宗正寺（宗正）", {
          rank: "三品",
          note: "掌皇族谱牒、宗室名籍与宗室封赏，宗室事务专属之职。",
        }),
        node("beiwei-taizi-sanshi", "太子三师", {
          rank: "二品",
          note: "太子太师、太子太傅、太子太保，辅导储君，多由三公或重臣兼任。",
        }),
        node("beiwei-taizi-sanshao", "太子三少", {
          rank: "三品",
          note: "太子少师、太子少傅、太子少保，佐三师教习太子，掌东宫庶务。",
        }),
        node("beiwei-neiting", "内廷诸职", {
          note: "中常侍、黄门令等侍奉禁中、传达诏命，太和改制后参用汉制宦官机构。",
        }),
      ],
    ),
    branch(
      "beiwei-local",
      "地",
      "州郡县三长",
      "州刺史、郡太守、县令长三级相承，三长制与均田制相表里，掌户籍、授田与乡里赋役。",
      [
        node("beiwei-zhou", "州", {
          note: "州置刺史、州牧，掌一方军政；北魏州数滋多，为地方最高行政层级。",
          children: [
            node("beiwei-cishi", "刺史", {
              rank: "四品 — 五品",
              note: "州长官，掌民政、军政与监察属郡，带将军号者兼领兵权。",
            }),
            node("beiwei-biejiang", "别驾、长史、司马", {
              note: "刺史佐官，分掌州府庶务、军事与监察。",
            }),
          ],
        }),
        node("beiwei-jun", "郡", {
          note: "郡置太守、郡丞，上中下郡品级有差。",
          children: [
            node("beiwei-taishou", "太守", {
              rank: "五品 — 六品",
              note: "郡长官，掌一郡民政、赋税、刑狱，上郡品级较高。",
            }),
            node("beiwei-juncheng", "郡丞", {
              note: "太守副贰，佐理郡务。",
            }),
          ],
        }),
        node("beiwei-xian", "县", {
          note: "县置令、长，品级随县之等第而差。",
          children: [
            node("beiwei-xianling", "县令", {
              rank: "六品 — 七品",
              note: "大县置令，掌一县民政、赋役、诉讼。",
            }),
            node("beiwei-xiancheng", "县丞、主簿", {
              note: "县令佐官，掌文书、仓廪与掾属事务。",
            }),
          ],
        }),
        node("beiwei-sanzhang", "三长制", {
          note: "孝文帝太和十年立三长制：五家为邻、五邻为里、五里为党，各置邻长、里长、党长，检括户口、均田授田、征发赋役，取代宗主督护，强化国家对编户的控制。",
          children: [
            node("beiwei-linzhang", "邻长", { note: "五家之长，最基层，掌邻里互检与赋役催办。" }),
            node("beiwei-lizhang", "里长", { note: "五邻之长，掌一里户籍与授田协调。" }),
            node("beiwei-dangzhang", "党长", { note: "五里之长，上承县官，掌一党田赋与徭役。" }),
          ],
        }),
      ],
    ),
    branch(
      "beiwei-military",
      "军",
      "都督镇戍",
      "都督诸军事统方面兵权，军镇镇将守北方边要，禁军宿卫京师，武职多由鲜卑勋贵居之。",
      [
        node("beiwei-dudu", "都督诸军事", {
          note: "统辖一路或数州军务，加将军号，为方面军事长官，多授宗室勋贵。",
        }),
        node("beiwei-zhenjiang", "镇将", {
          rank: "四品 — 五品",
          note: "军镇长官，掌边镇兵马与屯戍，北方六镇尤为要害，镇将多鲜卑旧贵。",
        }),
        node("beiwei-zhenshu", "镇戍", {
          note: "沿边设镇、戍，戍主、戍副分掌烽燧、屯兵与边防，构成北方防御体系。",
        }),
        node("beiwei-yulin", "禁军（领军、护军）", {
          note: "领军将军、护军将军统率宿卫禁军，护卫宫廷与京师，为中央武职核心。",
        }),
      ],
    ),
  ],
  hierarchyNote:
    "北魏官制呈胡汉二元：一面承袭魏晋三省、六曹、九卿与州郡县汉制框架，一面保留八部大人、宗室诸王、军镇镇将等鲜卑部落旧贵之职。孝文帝太和改制厘定品秩、各分正从，九品中正评第与官职品级相表里；三长制、均田制推行后，邻、里、党长成为掌握户籍授田的基层职掌，强化编户与赋役控制。本页阶梯取太和改制后官职品级口径。",
  rankSystemLabel: "九品正从 · 太和官品",
  rankIntro:
    "北魏承魏晋九品之制而各分正从，太和改制后品级趋于定制，胡汉分职、清浊并立；九品中正评人与官职品级交互为用，宗室勋贵与中原士族同品列班，流外吏员另为一途。",
  levels: sequence([
    level("一品（正）", "正", "太师、太傅、太保、太尉、司徒、司空", {
      order: 1,
      salary: 100,
      hat: "进贤冠（三梁）",
      hatColor: "#8a6d1f",
      robe: "紫袍",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "骠骑大将军、太子三师、宗室诸王", {
      order: 2,
      salary: 94,
      hat: "进贤冠（三梁）",
      hatColor: "#987b2a",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("二品（正）", "正", "尚书令、中书监、都督诸军事", {
      order: 3,
      salary: 84,
      hat: "进贤冠（二梁）",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("从二品", "从", "左右仆射、太子少师、中书令", {
      order: 4,
      salary: 80,
      hat: "进贤冠（二梁）",
      hatColor: "#ae9443",
      robe: "紫袍",
      robeColor: "#7b5a80",
    }),
    level("三品（正）", "正", "侍中、吏部尚书、九卿、宗正、州刺史", {
      order: 5,
      salary: 70,
      hat: "进贤冠（二梁）",
      hatColor: "#b89e50",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("从三品", "从", "黄门侍郎、六曹侍郎、光禄勋", {
      order: 6,
      salary: 58,
      hat: "进贤冠（一梁）",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("四品 — 五品", "正", "郡太守、镇将、别驾、州司马", {
      order: 7,
      salary: 44,
      hat: "进贤冠（一梁）",
      hatColor: "#cab978",
      robe: "绯袍",
      robeColor: "#a1524a",
    }),
    level("六品 — 七品", "从", "县令、台省郎官、县丞", {
      order: 8,
      salary: 30,
      hat: "进贤冠",
      hatColor: "#d2c389",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "主簿、诸曹掾属、党长、里长", {
      order: 9,
      salary: 16,
      hat: "进贤冠",
      hatColor: "#dacd9b",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
    level("流外", "—", "诸司吏员、书令史、邻长", {
      order: 10,
      salary: 6,
      hat: "无品",
      hatColor: "#9aa0a6",
      robe: "皂袍",
      robeColor: "#55555d",
    }),
  ]),
  ladderGroups: [
    ladder("一品 · 从一品", "三公上公、宗室诸王、骠骑大将军、太子三师", [1, 2]),
    ladder("二品 · 从二品", "尚书令、中书监、左右仆射、都督", [3, 4]),
    ladder("三品 · 从三品", "侍中、吏部尚书、九卿、黄门侍郎", [5, 6]),
    ladder("四品 — 五品", "郡太守、镇将、别驾、司马", [7]),
    ladder("六品 — 七品", "县令、台省郎官、县丞", [8]),
    ladder("八品 — 九品 · 流外", "主簿、掾属、三长、诸司吏员", [9, 10]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote:
    "北魏以冠服形制、颜色与品秩高低别尊卑，尚无明清式样之补子；官品各分正从，服色随品而殊。",
  notes: {
    rank: "北魏承魏晋九品，太和改制后品各分正从；九品中正评第与官职品级相表里，胡汉分职、清浊并立，流外吏员不入正品。",
    hat: "以进贤冠等冠制及梁数、簪笏别尊卑，太和改制后参用汉制冠服，鲜卑旧俗渐革。",
    robe: "紫、绯、绿、青依品而服，三品以上多用紫，四五品绯，六七品绿，八九品青。",
    salary: "品级越高，禄米与田秩越厚；宗室勋贵另有封户、赐田之益。",
    ritual: "朝会、宴飨与大典班序依品秩高下排定，宗室、勋贵与中原士族各以本品列班。",
    badge: "补子尚未出现，尊卑以冠服与品秩辨识。",
  },
  ritual: {
    title: "以品秩定班序",
    text: "太和改制后朝会、大典班序依官品正从高下排定，上公宗室居前，九品流外居后，胡汉百官各以本品就列。",
    left: "上公宗室",
    right: "九品流外",
  },
  footnote:
    "官名与品秩据《魏书·官氏志》《魏书·孝文帝纪》《通典·职官》《北史》等正史通行记载；三长制、均田制职掌参《魏书·食货志》。品各正从，员额与服色以本朝令式为准，补子之制尚未出现。",
};
