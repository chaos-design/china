import { branch, ladder, level, badges as makeBadges, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 清代官制图谱：内容据《清朝官职制度》与《九品十八级》两图整理，藩部与岁俸据《清史稿·职官志》补正。 */
export const qing: DynastyAtlas = {
  id: "qing",
  name: "清",
  period: "1644 — 1912",
  system: "九品十八级 · 军机处与督抚",
  source: "《清史稿·职官志》《大清会典》",
  intro:
    "品级决定服色、补子、顶戴，也决定礼仪中的位置。清代分满汉、别正从，共十八级；内阁名义尊崇，军机处掌机要，总督巡抚分治疆寄。",

  root: { title: "皇帝", note: "总揽军政大权，以下诸衙署分职而治" },
  honorary: [
    {
      id: "three-dukes",
      rank: "正一品封号",
      title: "三公",
      children: [
        node("grand-preceptor", "太师", { rank: "正一品" }),
        node("grand-guardian", "太傅", { rank: "正一品" }),
        node("grand-protector", "太保", { rank: "正一品" }),
      ],
    },
    {
      id: "three-solitaires",
      rank: "从一品封号",
      title: "三孤",
      children: [
        node("junior-preceptor", "少师", { rank: "从一品" }),
        node("junior-guardian", "少傅", { rank: "从一品" }),
        node("junior-protector", "少保", { rank: "从一品" }),
      ],
    },
    {
      id: "heir-three-seniors",
      rank: "从一品封号",
      title: "太子三师",
      children: [
        node("heir-preceptor", "太子太师"),
        node("heir-guardian", "太子太傅"),
        node("heir-protector", "太子太保"),
      ],
    },
    {
      id: "heir-three-juniors",
      rank: "正二品封号",
      title: "太子三少",
      children: [
        node("heir-junior-preceptor", "太子少师"),
        node("heir-junior-guardian", "太子少傅"),
        node("heir-junior-protector", "太子少保"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "中枢部", "辅佐皇帝处理军国要务的中枢机构，位在百官之上。", [
      node("council-of-princes", "议政王大臣会议", {
        rank: "议政处",
        note: "满洲王公及少数蒙古、汉军旗人参与处理军国要务的制度。",
      }),
      node("grand-secretariat", "内阁", {
        note: "殿阁大学士满汉各二人，协办大学士满汉各一人，掌票拟、批答章奏。",
        children: [
          node("qing-grand-secretary", "殿阁大学士", { rank: "正一品" }),
          node("qing-junior-secretary", "协办大学士", { rank: "从一品" }),
          node("qing-reader", "侍读学士", { rank: "正五品" }),
        ],
      }),
      node("southern-study", "南书房", {
        note: "康熙年间置。选翰林入值，备咨询、撰拟文字，乾隆以后军机处成为常设机构，南书房渐成清闲之所。",
      }),
      node("grand-council", "军机处", {
        note: "雍正年间设。选内阁成员、六部堂官等入值，掌军务和参预机要，逐渐成为事实上的最高决策机构。",
      }),
    ]),
    branch("assistant", "佐", "佐理部", "分掌全国政务、监察、司法与礼仪的中央衙署。", [
      node("six-boards", "六部", {
        note: "吏、户、礼、兵、刑、工六部，尚书领之、侍郎佐之；部下分司，郎中、员外郎、主事分掌一司之事。",
        children: [
          { title: "吏部", duty: "掌文官铨选、升降、考绩与封爵，下设文选、验封、稽勋、考功四司。" },
          { title: "户部", duty: "掌户籍、田赋、仓储与俸禄，按省分司承办钱粮奏销。" },
          {
            title: "礼部",
            duty: "掌朝会礼仪、祭祀、贡举与外宾接待，下设仪制、祠祭、主客、精膳四司。",
          },
          { title: "兵部", duty: "掌武官铨选、军籍、军令与驿传，下设武选、职方、车驾、武库四司。" },
          { title: "刑部", duty: "掌律令刑名与各司复审，与大理寺、都察院合称三法司。" },
          { title: "工部", duty: "掌营造、水利、屯田与山泽物产，下设营缮、虞衡、都水、屯田四司。" },
        ].map(({ title, duty }, index) =>
          node(`qing-board-${index}`, title, {
            rank: "尚书 从一品 · 侍郎 正二品",
            note: `${duty}尚书总领部务，左右侍郎协理，各司郎中、员外郎、主事分掌具体事务。`,
            children: [
              node(`qing-board-${index}-left-vice`, "左侍郎", {
                rank: "正二品",
                note: "本部副长官之一，协理部务并分掌本司事务，遇尚书缺员则署理。",
              }),
              node(`qing-board-${index}-right-vice`, "右侍郎", {
                rank: "正二品",
                note: "本部副长官之一，与左侍郎分掌部务，满汉各设一员。",
              }),
              node(`qing-board-${index}-director`, "郎中", {
                rank: "正五品",
                note: "各清吏司的长官，统领本司属官承办本省或本类事务，承上启下。",
              }),
              node(`qing-board-${index}-vice-director`, "员外郎", {
                rank: "从五品",
                note: "各司副长官，协理郎中分掌专项，郎中出差时代理司务。",
              }),
              node(`qing-board-${index}-secretary`, "主事", {
                rank: "正六品",
                note: "各司基层办事官，掌文稿案牍与日常事务，是进士分部行走的起点。",
              }),
            ],
          }),
        ),
      }),
      node("censorate", "都察院", { rank: "左都御史 · 正一品" }),
      node("court-judicature", "大理寺", { rank: "大理寺卿 · 正三品" }),
      node("court-colonial", "理藩院", { rank: "理藩院尚书 · 从一品" }),
      node("communications", "通政使司", { rank: "通政使 · 正三品" }),
      node("hanlin", "翰林院", { rank: "掌院学士 · 从二品" }),
      node("national-academy", "国子监", { rank: "祭酒 · 从四品", note: "国子监祭酒，掌国学。" }),
      node("astronomy", "钦天监", { rank: "监正 · 正五品", note: "钦天监监正，掌天文历法。" }),
    ]),
    branch("household", "帝", "帝室部", "掌皇室宗族、宫廷供奉与帝室事务的机构。", [
      node("imperial-ancestral", "太常寺", { rank: "太常寺卿 · 正三品" }),
      node("imperial-banquets", "光禄寺", { rank: "光禄寺卿 · 从三品" }),
      node("imperial-stable", "太仆寺", { rank: "太仆寺卿 · 从三品" }),
      node("imperial-guest", "鸿胪寺", { rank: "鸿胪寺卿 · 正四品" }),
      node("imperial-household", "内务府", { rank: "总管大臣 · 正二品" }),
      node("imperial-clan", "宗人府", {
        rank: "宗令 · 亲王郡王兼领",
        note: "宗令以亲王、郡王充任，掌皇族谱牒。",
      }),
      node("heir-apparatus", "詹事府", { rank: "詹事 · 正三品" }),
      node("imperial-medical", "太医院", { rank: "院使 · 正五品" }),
    ]),
    branch(
      "province",
      "省",
      "行省",
      "总督、巡抚总揽一方军政，布政、按察、提学分掌民政、司法与学政。",
      [
        node("provincial-leadership", "封疆大吏", {
          note: "总督、巡抚加衔，总揽一省至数省军政。",
          children: [
            node("vice-roy", "总督", { rank: "正二品" }),
            node("governor", "巡抚", { rank: "从二品" }),
          ],
        }),
        node("provincial-boards", "两司与学政", {
          children: [
            node("provincial-treasury", "布政使", {
              rank: "从二品",
              note: "左右参政（从三品）、左右参议（从四品）佐之。",
              annotation: "承宣布政使司的长官，掌一省民政与钱粮。",
            }),
            node("provincial-justice", "按察使", {
              rank: "正三品",
              note: "按察使司副使（正四品）、佥事（正五品）佐之。",
              annotation: "提督按察使司的长官，掌一省刑名与监察。",
            }),
            node("provincial-education", "提督学政", {
              annotation: "提督学政署的长官，由朝廷简派主持一省学校与科举。",
            }),
          ],
        }),
        node("capital-prefectures", "京府", {
          children: [
            node("shuntian", "顺天府", {
              note: "顺天府尹，掌京畿地区民政。",
              children: [
                node("shuntian-prefect", "府尹", { rank: "正三品" }),
                node("shuntian-assistant", "府丞", { rank: "正四品" }),
                node("shuntian-administrator", "治中", { rank: "正四品" }),
                node("shuntian-judge", "通判", { rank: "正六品" }),
                node("shuntian-secretary", "经历", { rank: "从七品" }),
              ],
            }),
            node("fengtian", "奉天府", {
              note: "奉天府尹，掌盛京地区民政。",
              children: [
                node("fengtian-prefect", "府尹", { rank: "正三品" }),
                node("fengtian-assistant", "府丞", { rank: "正四品" }),
                node("fengtian-administrator", "治中", { rank: "正四品" }),
                node("fengtian-judge", "通判", { rank: "正六品" }),
                node("fengtian-secretary", "经历", { rank: "从七品" }),
              ],
            }),
          ],
        }),
      ],
    ),
    branch("frontier", "藩", "藩部", "蒙古、西藏、新疆等藩部，因俗而治，设将军、大臣与伯克分理。", [
      node("mongolia", "蒙古地区", {
        note: "将军、都统驻防分理漠南漠北蒙古。",
        children: [
          node("uliastai-general", "定边左副将军", {
            rank: "从一品",
            note: "驻乌里雅苏台，统辖喀尔喀蒙古。",
          }),
          node("suiyuan-general", "绥远城将军", { rank: "从一品" }),
          node("chahar-dutong", "察哈尔都统", { rank: "从一品" }),
        ],
      }),
      node("tibet", "西藏地区", {
        note: "驻藏大臣督办藏务，本职加内阁学士、都察院御史、六部侍郎等衔。",
        children: [
          node("amban-tibet", "驻藏大臣", { rank: "加衔无定品" }),
          node("deputy-amban", "帮办大臣"),
        ],
      }),
      node("xinjiang", "新疆地区", {
        note: "伊犁将军总统天山南北军政，回部设伯克制。",
        children: [
          node("ili-general", "伊犁将军", { rank: "从一品", note: "总统伊犁等处将军。" }),
          node("achib-beck", "阿奇木伯克", { rank: "正三品至正六品", note: "伯克制理回部城邑。" }),
        ],
      }),
    ]),
    branch("local", "地", "府州县", "省以下府、州、县三级，佐贰官分掌粮捕、水利、簿籍与刑狱。", [
      node("prefecture", "府", {
        children: [
          node("prefect-governor", "知府", { rank: "从四品" }),
          node("prefect-vice", "同知", { rank: "正五品" }),
          node("prefect-assistant", "通判", { rank: "正六品" }),
          node("prefect-judge", "推官", { rank: "从六品" }),
        ],
      }),
      node("department", "州", {
        children: [
          node("department-governor", "知州", { rank: "正五品" }),
          node("department-vice", "州同", { rank: "从六品" }),
          node("department-assistant", "州判", { rank: "从七品" }),
        ],
      }),
      node("county", "县", {
        children: [
          node("county-governor", "知县", { rank: "正七品" }),
          node("county-vice", "县丞", { rank: "正八品" }),
          node("county-recorder", "主簿", { rank: "正九品" }),
          node("county-clerk", "典史", { rank: "未入流" }),
        ],
      }),
    ]),
  ],
  hierarchyNote:
    "此树复现《清朝官职制度》一图的分区与从属关系，品级括注为图中所标或据《清史稿·职官志》补正（伊犁将军隶新疆、驻藏大臣驻西藏）；荣衔多为封赠虚衔，实权以中枢部与行省衙署为准。点击带箭头的衙署可展开属官。",

  rankSystemLabel: "九品十八级",
  rankIntro: "清代官员共有九品十八级，品级高低决定制服、俸禄、礼仪与政治地位。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保、大学士", {
      order: 1,
      salary: 100,
      salaryLabel: "180 两",
      hat: "红宝石顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#9e2b25",
      robe: "石青色绣金",
      robeColor: "#1f3a5f",
    }),
    level("从一品", "从", "少师、少傅、少保、协办大学士", {
      order: 1,
      salary: 94,
      salaryLabel: "180 两",
      hat: "珊瑚顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#c8503c",
      robe: "石青色绣金",
      robeColor: "#27456b",
    }),
    level("正二品", "正", "总督、巡抚、内阁学士、各部院尚书", {
      order: 2,
      salary: 86,
      salaryLabel: "155 两",
      hat: "珊瑚顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#d2694f",
      robe: "石青色绣金",
      robeColor: "#2b4c74",
    }),
    level("从二品", "从", "布政使、副都统、翰林院掌院学士", {
      order: 2,
      salary: 81,
      salaryLabel: "155 两",
      hat: "珊瑚顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#d2694f",
      robe: "石青色绣金",
      robeColor: "#30537d",
    }),
    level("正三品", "正", "按察使、各部院侍郎、都察院副都御史", {
      order: 3,
      salary: 72,
      salaryLabel: "130 两",
      hat: "蓝宝石顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#2f5fa8",
      robe: "石青色绣银",
      robeColor: "#355b86",
    }),
    level("从三品", "从", "光禄寺卿、太仆寺卿、盐运使", {
      order: 3,
      salary: 67,
      salaryLabel: "130 两",
      hat: "蓝宝石顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#3a6cb5",
      robe: "石青色绣银",
      robeColor: "#3a628e",
    }),
    level("正四品", "正", "知府、通政使司副使、大理寺少卿", {
      order: 4,
      salary: 58,
      salaryLabel: "105 两",
      hat: "青金石顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#2b4c9b",
      robe: "石青色绣银",
      robeColor: "#3f6895",
    }),
    level("从四品", "从", "翰林院侍读学士、国子监祭酒", {
      order: 4,
      salary: 55,
      salaryLabel: "105 两",
      hat: "青金石顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#3557a8",
      robe: "石青色绣银",
      robeColor: "#456f9d",
    }),
    level("正五品", "正", "同知、各部院郎中、给事中", {
      order: 5,
      salary: 45,
      salaryLabel: "80 两",
      hat: "水晶顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#b9c9d6",
      robe: "青色",
      robeColor: "#33575c",
    }),
    level("从五品", "从", "知州、各部院员外郎、监察御史", {
      order: 5,
      salary: 42,
      salaryLabel: "80 两",
      hat: "水晶顶",
      hatBeads: "珊瑚朝珠",
      hatColor: "#c6d3dd",
      robe: "青色",
      robeColor: "#3a6368",
    }),
    level("正六品", "正", "通判、京县知县、各部院主事", {
      order: 6,
      salary: 33,
      salaryLabel: "60 两",
      hat: "砗磲顶",
      hatBeads: "素珠朝珠",
      hatColor: "#e2d9c6",
      robe: "蓝色",
      robeColor: "#3b6ea8",
    }),
    level("从六品", "从", "州同、翰林院修撰、光禄寺署正", {
      order: 6,
      salary: 31,
      salaryLabel: "60 两",
      hat: "砗磲顶",
      hatBeads: "素珠朝珠",
      hatColor: "#e8dfcd",
      robe: "蓝色",
      robeColor: "#4678af",
    }),
    level("正七品", "正", "知县、翰林院编修、大理寺评事", {
      order: 7,
      salary: 25,
      salaryLabel: "45 两",
      hat: "素金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#c9a227",
      robe: "月白",
      robeColor: "#cfd8dd",
    }),
    level("从七品", "从", "州判、翰林院检讨、中书舍人", {
      order: 7,
      salary: 23,
      salaryLabel: "45 两",
      hat: "素金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#d2ab2f",
      robe: "月白",
      robeColor: "#d7dfe3",
    }),
    level("正八品", "正", "县丞、教谕、各部院司务", {
      order: 8,
      salary: 22,
      salaryLabel: "40 两",
      hat: "阴纹镂花素金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#a9912e",
      robe: "花青",
      robeColor: "#4a5d7a",
    }),
    level("从八品", "从", "县教谕、训导、盐课司提举", {
      order: 8,
      salary: 19,
      salaryLabel: "40 两",
      hat: "阴纹镂花素金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#b09a3c",
      robe: "花青",
      robeColor: "#556985",
    }),
    level("正九品", "正", "主簿、巡检、各部院笔帖式", {
      order: 9,
      salary: 18,
      salaryLabel: "33 两",
      hat: "镂金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#d9b64a",
      robe: "灰蓝",
      robeColor: "#6d7d93",
    }),
    level("从九品", "从", "典史、驿丞、闸官", {
      order: 9,
      salary: 17,
      salaryLabel: "33 两",
      hat: "镂金顶",
      hatBeads: "素珠朝珠",
      hatColor: "#dfc15c",
      robe: "灰蓝",
      robeColor: "#78889d",
    }),
  ]),
  ladderGroups: [
    ladder("正一品", "太师、太傅、太保、大学士", [1], "正"),
    ladder("从一品", "少师、少傅、少保、协办大学士", [1], "从"),
    ladder("正二品", "总督、巡抚、内阁学士、各部", [2]),
    ladder("三至六品", "知府、同知、知州、通判、主事、员外郎等", [3, 4, 5, 6]),
    ladder("七至九品", "知县、主簿、教谕、典史等", [7, 8, 9]),
  ],
  badgesAvailable: true,
  civilBadges: makeBadges(["仙鹤", "锦鸡", "孔雀", "云雁", "白鹇", "鹭鸶", "鸂鶒", "鹌鹑", "练雀"]),
  militaryBadges: makeBadges(["麒麟", "狮", "豹", "虎", "熊", "彪", "犀牛", "犀牛", "海马"]),
  badgeNote: "文官补子绣飞禽，武官补子绣走兽，一眼可辨品级与文武。",
  notes: {
    rank: "清代官员共有九品十八级，品级高低决定制服、俸禄、礼仪与政治地位。",
    hat: "以材质与颜色区分官员品级高低。",
    robe: "朝服颜色与纹饰随品级而异。",
    salary:
      "京官岁俸银两数如上，同品正从同俸，另支同数之禄米（斛）；外官正俸之外另有养廉银，相差悬殊。",
    ritual: "品级决定朝会、宴会、仪仗、座次的前后尊卑。",
    badge: "文官补子绣飞禽，武官补子绣走兽，一眼可辨品级与文武。",
  },
  ritual: {
    title: "品级决定站在哪里",
    text: "朝会、祭祀与宴飨皆按品级列班：品高者居前列上位，同品正品先于从品，文武分班而序；班次前后即是礼仪中的尊卑。",
    left: "上位",
    right: "下位",
  },
  footnote:
    "内容据《清朝官职制度》与《九品十八级，不只是一顶官帽》两图整理；顶戴色卡与朝服色块为示意，岁俸为京官正俸参考、另支同数禄米，具体员额与品级以会典、职官志为准。",
};
