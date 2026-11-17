/**
 * 清代官制图谱的结构化数据，内容取自两张参考图：
 * 1. 《清朝官职制度》层级图 —— 皇帝之下的中枢部 / 佐理部 / 帝室部 / 行省 / 藩部 / 府州县；
 * 2. 《九品十八级，不只是一顶官帽》信息图 —— 品秩、文武补子、顶戴、朝服、俸禄、礼序。
 *
 * 这里只描述"图中写了什么"，不引入跨朝代口径，也不与 ranks 页的八朝对照数据混用。
 */

export type QingOfficeCategory =
  | "imperial"
  | "central"
  | "assistant"
  | "household"
  | "province"
  | "frontier"
  | "local";

export interface QingOfficeNode {
  /** 稳定 id，供展开态与测试定位。 */
  id: string;
  /** 衙署 / 官职名。 */
  title: string;
  /** 品级或封号口径（图中括注）。 */
  rank?: string;
  /** 一句话说明（图中对各机构的注记）。 */
  note?: string;
  /** 子节点。 */
  children?: readonly QingOfficeNode[];
}

export interface QingOfficeBranch {
  category: QingOfficeCategory;
  id: string;
  /** 图中该部的定位说明。 */
  summary: string;
  title: string;
  nodes: readonly QingOfficeNode[];
}

/** 图一：清朝官职制度的六大分区（皇权单列，作为树根）。 */
export const QING_OFFICE_BRANCHES: readonly QingOfficeBranch[] = [
  {
    category: "central",
    id: "central",
    summary: "辅佐皇帝处理军国要务的中枢机构，位在百官之上。",
    title: "中枢部",
    nodes: [
      {
        id: "council-of-princes",
        note: "满洲王公及少数蒙古、汉军旗人参与处理军国要务的制度。",
        rank: "议政处",
        title: "议政王大臣会议",
      },
      {
        children: [
          { id: "grand-secretary", rank: "正一品", title: "殿阁大学士" },
          { id: "junior-secretary", rank: "从一品", title: "协办大学士" },
          { id: "reader", rank: "正五品", title: "侍读学士" },
        ],
        id: "grand-secretariat",
        note: "殿阁大学士满汉各二人，协办大学士满汉各一人，掌票拟、批答章奏。",
        title: "内阁",
      },
      {
        id: "southern-study",
        note: "选翰林入值，备咨询、撰拟文字，无固定员额；乾隆以后军机处成为常设机构，南书房渐成清闲之所。",
        title: "南书房",
      },
      {
        id: "grand-council",
        note: "选内阁成员、六部堂官等入值，掌军务和参预机要，逐渐成为事实上的最高决策机构。",
        title: "军机处",
      },
    ],
  },
  {
    category: "assistant",
    id: "assistant",
    summary: "分掌全国政务、监察、司法与礼仪的中央衙署。",
    title: "佐理部",
    nodes: [
      {
        children: [
          { id: "board-personnel", rank: "从一品 → 正二品", title: "吏部" },
          { id: "board-revenue", rank: "从一品 → 正二品", title: "户部" },
          { id: "board-rites", rank: "从一品 → 正二品", title: "礼部" },
          { id: "board-war", rank: "从一品 → 正二品", title: "兵部" },
          { id: "board-justice", rank: "从一品 → 正二品", title: "刑部" },
          { id: "board-works", rank: "从一品 → 正二品", title: "工部" },
        ],
        id: "six-boards",
        note: "吏、户、礼、兵、刑、工六部，尚书领之，侍郎佐之。",
        title: "六部",
      },
      { id: "censorate", rank: "左都御史 · 正一品", title: "都察院" },
      { id: "court-judicature", rank: "大理寺卿 · 正三品", title: "大理寺" },
      { id: "court-colonial", rank: "理藩院尚书 · 从一品", title: "理藩院" },
      { id: "communications", rank: "通政使 · 正三品", title: "通政使司" },
      { id: "hanlin", title: "翰林院" },
      { id: "national-academy", note: "国子监祭酒，掌国学。", title: "国子监" },
      { id: "astronomy", note: "钦天监监正，掌天文历法。", title: "钦天监" },
    ],
  },
  {
    category: "household",
    id: "household",
    summary: "掌皇室宗族、宫廷供奉与帝室事务的机构。",
    title: "帝室部",
    nodes: [
      { id: "imperial-ancestral", rank: "太常寺卿 · 正三品", title: "太常寺" },
      { id: "imperial-banquets", rank: "光禄寺卿 · 从三品", title: "光禄寺" },
      { id: "imperial-stable", rank: "太仆寺卿 · 从三品", title: "太仆寺" },
      { id: "imperial-guest", rank: "鸿胪寺卿 · 正四品", title: "鸿胪寺" },
      { id: "imperial-household", title: "内务府" },
      { id: "imperial-clan", note: "宗人府令，掌皇族谱牒。", title: "宗人府" },
      { id: "heir-apparatus", title: "詹事府" },
      { id: "imperial-medical", rank: "院使 · 正五品", title: "太医院" },
    ],
  },
  {
    category: "province",
    id: "province",
    summary: "总督、巡抚总揽一方军政，布政、按察、提学分掌民政、司法与学政。",
    title: "行省",
    nodes: [
      {
        children: [
          { id: "vice-roy", rank: "正二品", title: "总督" },
          { id: "governor", rank: "从二品", title: "巡抚" },
        ],
        id: "provincial-leadership",
        note: "总督、巡抚加衔，总揽一省至数省军政。",
        title: "封疆大吏",
      },
      {
        children: [
          { id: "provincial-treasury", rank: "从二品", title: "承宣布政使司 · 布政使" },
          { id: "provincial-justice", rank: "正三品", title: "提督按察使司 · 按察使" },
          { id: "provincial-education", title: "提督学政署 · 提督学政" },
        ],
        id: "provincial-boards",
        title: "两司与学政",
      },
      {
        children: [
          { id: "shuntian", note: "顺天府尹，掌京畿地区民政。", title: "顺天府" },
          { id: "fengtian", note: "奉天府尹，掌盛京地区民政。", title: "奉天府" },
        ],
        id: "capital-prefectures",
        title: "京府",
      },
    ],
  },
  {
    category: "frontier",
    id: "frontier",
    summary: "蒙古、西藏、新疆等藩部，因俗而治，设将军、大臣与伯克分理。",
    title: "藩部",
    nodes: [
      {
        id: "mongolia",
        note: "伊犁将军（蒙古），定边左副将军、定边右副将军、乌里雅苏台参赞大臣等分驻。",
        title: "蒙古地区",
      },
      {
        id: "tibet",
        note: "驻藏大臣，办事大臣，帮办大臣，总揽藏事。",
        title: "西藏地区",
      },
      {
        id: "xinjiang",
        note: "阿奇木伯克（三品至六品），伯克制回部地方事务。",
        title: "新疆地区",
      },
    ],
  },
  {
    category: "local",
    id: "local",
    summary: "省以下府、州、县三级，佐贰官分掌粮捕、水利、簿籍与刑狱。",
    title: "府州县",
    nodes: [
      {
        children: [
          { id: "prefect-governor", rank: "从四品", title: "知府" },
          { id: "prefect-vice", rank: "正五品", title: "同知" },
          { id: "prefect-assistant", rank: "正六品", title: "通判" },
          { id: "prefect-judge", rank: "从六品", title: "推官" },
        ],
        id: "prefecture",
        title: "府",
      },
      {
        children: [
          { id: "department-governor", rank: "正五品", title: "知州" },
          { id: "department-vice", rank: "从六品", title: "州同" },
          { id: "department-assistant", rank: "从七品", title: "州判" },
        ],
        id: "department",
        title: "州",
      },
      {
        children: [
          { id: "county-governor", rank: "正七品", title: "知县" },
          { id: "county-vice", rank: "正八品", title: "县丞" },
          { id: "county-recorder", rank: "正九品", title: "主簿" },
          { id: "county-clerk", rank: "未入流", title: "典史" },
        ],
        id: "county",
        title: "县",
      },
    ],
  },
];

/** 图一顶端的荣衔：三公、三孤与太子三师三少。 */
export const QING_HONORARY_RANKS: readonly QingOfficeNode[] = [
  {
    children: [
      { id: "grand-preceptor", rank: "正一品", title: "太师" },
      { id: "grand-guardian", rank: "正一品", title: "太傅" },
      { id: "grand-protector", rank: "正一品", title: "太保" },
    ],
    id: "three-dukes",
    rank: "正一品封号",
    title: "三公",
  },
  {
    children: [
      { id: "junior-preceptor", rank: "从一品", title: "少师" },
      { id: "junior-guardian", rank: "从一品", title: "少傅" },
      { id: "junior-protector", rank: "从一品", title: "少保" },
    ],
    id: "three-solitaires",
    rank: "从一品封号",
    title: "三孤",
  },
  {
    children: [
      { id: "heir-preceptor", rank: "从一品", title: "太子太师" },
      { id: "heir-guardian", rank: "从一品", title: "太子太傅" },
      { id: "heir-protector", rank: "从一品", title: "太子太保" },
    ],
    id: "heir-three-seniors",
    rank: "从一品封号",
    title: "太子三师",
  },
  {
    children: [
      { id: "heir-junior-preceptor", rank: "正二品", title: "太子少师" },
      { id: "heir-junior-guardian", rank: "正二品", title: "太子少傅" },
      { id: "heir-junior-protector", rank: "正二品", title: "太子少保" },
    ],
    id: "heir-three-juniors",
    rank: "正二品封号",
    title: "太子三少",
  },
];

export interface QingRankLevel {
  /** "正一品" / "从一品" … */
  label: string;
  /** 1—9 */
  order: number;
  /** 正 / 从 */
  grade: "正" | "从";
  /** 图中该品列举的代表官职。 */
  offices: string;
  /** 顶戴材质（含朝珠）。 */
  hat: string;
  hatBeads: string;
  /** 图中顶戴色卡：取近似 CSS 色值，仅作视觉示意。 */
  hatColor: string;
  /** 朝服色名（一至二品石青、五品绿……）。 */
  robe: string;
  robeColor: string;
  /** 年俸参考（两），柱高按此值归一。 */
  salary: number;
}

/** 图二：九品十八级，每品正从各一行。 */
export const QING_RANK_LEVELS: readonly QingRankLevel[] = [
  {
    label: "正一品",
    order: 1,
    grade: "正",
    offices: "太师、太傅、太保、大学士",
    hat: "红宝石顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#9e2b25",
    robe: "石青色",
    robeColor: "#1f3a5f",
    salary: 180,
  },
  {
    label: "从一品",
    order: 1,
    grade: "从",
    offices: "少师、少傅、少保、协办大学士",
    hat: "珊瑚顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#c8503c",
    robe: "石青色",
    robeColor: "#27456b",
    salary: 155,
  },
  {
    label: "正二品",
    order: 2,
    grade: "正",
    offices: "总督、巡抚、内阁学士、各部院尚书",
    hat: "珊瑚顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#d2694f",
    robe: "石青色",
    robeColor: "#2b4c74",
    salary: 155,
  },
  {
    label: "从二品",
    order: 2,
    grade: "从",
    offices: "布政使、副都统、翰林院掌院学士",
    hat: "珊瑚顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#d2694f",
    robe: "石青色",
    robeColor: "#30537d",
    salary: 130,
  },
  {
    label: "正三品",
    order: 3,
    grade: "正",
    offices: "按察使、各部院侍郎、都察院副都御史",
    hat: "蓝宝石顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#2f5fa8",
    robe: "石青色",
    robeColor: "#355b86",
    salary: 130,
  },
  {
    label: "从三品",
    order: 3,
    grade: "从",
    offices: "光禄寺卿、太仆寺卿、盐运使",
    hat: "蓝宝石顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#3a6cb5",
    robe: "石青色",
    robeColor: "#3a628e",
    salary: 110,
  },
  {
    label: "正四品",
    order: 4,
    grade: "正",
    offices: "知府、通政使司副使、大理寺少卿",
    hat: "青金石顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#2b4c9b",
    robe: "石青色",
    robeColor: "#3f6895",
    salary: 105,
  },
  {
    label: "从四品",
    order: 4,
    grade: "从",
    offices: "翰林院侍读学士、国子监祭酒",
    hat: "青金石顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#3557a8",
    robe: "石青色",
    robeColor: "#456f9d",
    salary: 100,
  },
  {
    label: "正五品",
    order: 5,
    grade: "正",
    offices: "同知、各部院郎中、给事中",
    hat: "水晶顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#b9c9d6",
    robe: "绿色",
    robeColor: "#2f6b4f",
    salary: 80,
  },
  {
    label: "从五品",
    order: 5,
    grade: "从",
    offices: "知州、各部院员外郎、监察御史",
    hat: "水晶顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#c6d3dd",
    robe: "绿色",
    robeColor: "#377657",
    salary: 75,
  },
  {
    label: "正六品",
    order: 6,
    grade: "正",
    offices: "通判、京县知县、各部院主事",
    hat: "砗磲顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#e2d9c6",
    robe: "蓝色",
    robeColor: "#3b6ea8",
    salary: 60,
  },
  {
    label: "从六品",
    order: 6,
    grade: "从",
    offices: "州同、翰林院修撰、光禄寺署正",
    hat: "砗磲顶",
    hatBeads: "珊瑚朝珠",
    hatColor: "#e8dfcd",
    robe: "蓝色",
    robeColor: "#4678af",
    salary: 55,
  },
  {
    label: "正七品",
    order: 7,
    grade: "正",
    offices: "知县、翰林院编修、大理寺评事",
    hat: "素金顶",
    hatBeads: "素珠朝珠",
    hatColor: "#c9a227",
    robe: "月白",
    robeColor: "#cfd8dd",
    salary: 45,
  },
  {
    label: "从七品",
    order: 7,
    grade: "从",
    offices: "州判、翰林院检讨、中书舍人",
    hat: "素金顶",
    hatBeads: "素珠朝珠",
    hatColor: "#d2ab2f",
    robe: "月白",
    robeColor: "#d7dfe3",
    salary: 42,
  },
  {
    label: "正八品",
    order: 8,
    grade: "正",
    offices: "县丞、教谕、各部院司务",
    hat: "素银顶",
    hatBeads: "素珠朝珠",
    hatColor: "#adb7bd",
    robe: "花青",
    robeColor: "#4a5d7a",
    salary: 40,
  },
  {
    label: "从八品",
    order: 8,
    grade: "从",
    offices: "县教谕、训导、盐课司提举",
    hat: "素银顶",
    hatBeads: "素珠朝珠",
    hatColor: "#b8c1c7",
    robe: "花青",
    robeColor: "#556985",
    salary: 35,
  },
  {
    label: "正九品",
    order: 9,
    grade: "正",
    offices: "主簿、巡检、各部院笔帖式",
    hat: "镂金顶",
    hatBeads: "素珠朝珠",
    hatColor: "#d9b64a",
    robe: "灰蓝",
    robeColor: "#6d7d93",
    salary: 33,
  },
  {
    label: "从九品",
    order: 9,
    grade: "从",
    offices: "典史、驿丞、闸官",
    hat: "镂金顶",
    hatBeads: "素珠朝珠",
    hatColor: "#dfc15c",
    robe: "灰蓝",
    robeColor: "#78889d",
    salary: 31,
  },
];

export interface QingBadge {
  /** 对应品级 1—9。 */
  order: number;
  animal: string;
}

/** 图二：文官补子用飞禽，武官补子用走兽，各九品。 */
export const QING_CIVIL_BADGES: readonly QingBadge[] = [
  { animal: "仙鹤", order: 1 },
  { animal: "锦鸡", order: 2 },
  { animal: "孔雀", order: 3 },
  { animal: "云雁", order: 4 },
  { animal: "白鹇", order: 5 },
  { animal: "鹭鸶", order: 6 },
  { animal: "鸂鶒", order: 7 },
  { animal: "鹌鹑", order: 8 },
  { animal: "练雀", order: 9 },
];

export const QING_MILITARY_BADGES: readonly QingBadge[] = [
  { animal: "麒麟", order: 1 },
  { animal: "狮", order: 2 },
  { animal: "豹", order: 3 },
  { animal: "虎", order: 4 },
  { animal: "熊", order: 5 },
  { animal: "彪", order: 6 },
  { animal: "犀牛", order: 7 },
  { animal: "犀牛", order: 8 },
  { animal: "海马", order: 9 },
];

/** 图二中信息图右上与顶戴/朝服/俸禄/礼序各栏的说明文字。 */
export const QING_RANK_INTRO = "清代官员共有九品十八级，品级高低决定制服、俸禄、礼仪与政治地位。";

export const QING_RANK_NOTES: Record<
  "rank" | "hat" | "robe" | "salary" | "ritual" | "badge",
  string
> = {
  badge: "文官补子绣飞禽，武官补子绣走兽，一眼可辨品级与文武。",
  hat: "以材质与颜色区分官员品级高低。",
  rank: QING_RANK_INTRO,
  ritual: "品级决定朝会、宴会、仪仗、座次的前后尊卑。",
  robe: "朝服颜色与纹饰随品级而异。",
  salary: "品级越高，俸禄越多，待遇相差悬殊。",
};

/** 图中阶梯左侧的品级分组标注。 */
export const QING_LADDER_GROUPS: readonly {
  label: string;
  orders: readonly number[];
  note: string;
}[] = [
  { label: "正一品", note: "太师、太傅、太保、大学士", orders: [1] },
  { label: "从一品", note: "少师、少傅、少保、协办大学士", orders: [1] },
  { label: "正二品", note: "总督、巡抚、内阁学士、各部", orders: [2] },
  {
    label: "三至六品",
    note: "知府、同知、知州、通判、主事、员外郎等",
    orders: [3, 4, 5, 6],
  },
  {
    label: "七至九品",
    note: "知县、主簿、教谕、典史等",
    orders: [7, 8, 9],
  },
];
