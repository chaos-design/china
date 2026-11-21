import type { ExamImageKey } from "./imperial-exam-images";
import type { ExamMilestone } from "./types";

/**
 * 登科之阶：明清定型后的科举全程，按「一科三年」的时间轴逻辑逐站铺开。
 * 每站 = 编号 + 站名 + 地点 + 时点 + 过关所得身份 + 一句话 + 两三条细节
 * （细节可带真实影像佐证）。名额与录取率取教科书通行口径，估算一律带「约」。
 */
export interface ExamStageDetail {
  /** 细节格标签，如「备考之苦」「百里挑一」。 */
  label: string;
  text: string;
  /** 可选的真实影像佐证。 */
  image?: { key: ExamImageKey; caption: string };
}

export interface ExamStage {
  /** 展示序号：①…⑦。 */
  num: string;
  name: string;
  /** 考在哪：本县 · 府城 · 省城贡院 · 京师。 */
  place: string;
  /** 一科三年里的时点。 */
  timing: string;
  /** 过关所得身份。 */
  identity: string;
  summary: string;
  details: ExamStageDetail[];
}

export const EXAM_STAGES: ExamStage[] = [
  {
    num: "①",
    name: "童试",
    place: "本县 · 府城",
    timing: "岁科两试 · 年年可考",
    identity: "过关得「生员（秀才）」",
    summary: "县试（知县主持）、府试（知府主持）、院试（学政主持）三关连过，才算「进学」。",
    details: [
      {
        label: "备考之苦",
        text: "应试者把题库刻本翻到卷边——《大题文府》一类八股范文汇刻是寒窗标配。",
        image: {
          key: "cike",
          caption: "《大题文府》刻本书影：八股范文与试题汇刻",
        },
      },
      {
        label: "三场连过",
        text: "县试、府试各一场，院试为最后一关；岁试、科试三年轮替，一次失利再等一年。",
      },
      {
        label: "进学率约百分之一二",
        text: "清代童生以百万计，一次院试进学者仅百分之一二（通行估算）。",
      },
    ],
  },
  {
    num: "②",
    name: "乡试",
    place: "省城贡院",
    timing: "子午卯酉年八月 · 秋闱",
    identity: "中式得「举人」",
    summary: "连考三场、每场三日，吃住全在号舍里；中式曰举人，第一名称解元。",
    details: [
      {
        label: "九天三夜的号舍",
        text: "号舍高六尺、深四尺，答卷、吃住都在其中；江南贡院号舍曾达两万余间。",
        image: {
          key: "haoshe",
          caption: "北京贡院号舍长排（1901 年前后）：乡试、会试共用的考棚形制",
        },
      },
      {
        label: "考题长这样",
        text: "从四书五经出题，八股文代圣人立言——乾隆四十四年顺天乡试题单可见各经题目。",
        image: {
          key: "xiangshiti",
          caption: "乾隆四十四年顺天乡试题单",
        },
      },
      {
        label: "百里挑一",
        text: "清代全国每科中额约一千二百名，应试秀才数万（通行估算）。",
      },
    ],
  },
  {
    num: "③",
    name: "放榜与报喜",
    place: "省城 · 贡院前",
    timing: "乡试年九月 · 桂榜",
    identity: "身份生效「举人」",
    summary: "桂榜张挂贡院前，报喜人连夜敲门；举人免役、见官不跪，「一举成名」由此而来。",
    details: [
      {
        label: "捷报匾板",
        text: "中举报喜是宗族与市镇的大事——泉州所见「状元、榜眼、探花」金字报板即是实证。",
        image: {
          key: "jiebao",
          caption: "泉州所见中举捷报匾板",
        },
      },
      {
        label: "举人的特权",
        text: "免徭役、可拣选知县与大挑教职；多数读书人的科举路到此为止。",
      },
      {
        label: "下次再等三年",
        text: "一科三年，落榜者把刻本翻回卷首，从下一科乡试再来一遍。",
      },
    ],
  },
  {
    num: "④",
    name: "进京赶考",
    place: "举人离乡赴京",
    timing: "会试年正月启程",
    identity: "具会试资格",
    summary: "乡试次年春闱在即，举人筹盘缠、辞宗族，跋涉千里进京。",
    details: [
      {
        label: "赶考的行囊",
        text: "衣装、干粮、笔墨书箱一去数月，路费多靠宗族凑资——落第者再等一科。",
        image: {
          key: "gankao",
          caption: "南京老门东赶考士子铜雕：负笈携箱、结伴而行",
        },
      },
      {
        label: "会馆同乡",
        text: "举子多借住各地会馆，同乡互助、书肆生意随之兴旺。",
      },
      {
        label: "多少人能到京",
        text: "举人过千赴考，路途与盘缠先刷掉一批。",
      },
    ],
  },
  {
    num: "⑤",
    name: "会试",
    place: "京师贡院 · 礼部主试",
    timing: "丑辰未戌年二月 · 春闱",
    identity: "中式得「贡士」",
    summary: "礼部主持的全国会试，九天三夜再进号舍；中式曰贡士，第一名称会元。",
    details: [
      {
        label: "京师贡院",
        text: "明远楼居中、号舍连绵成巷——1901 年的北京贡院照片可见其规模。",
        image: {
          key: "pekingGongyuan",
          caption: "北京贡院（1901 年）：明远楼与两侧号舍",
        },
      },
      {
        label: "夹带的重量",
        text: "与防弊措施同步进化的是作弊：蝇头小字密写的夹带实物至今可见。",
        image: {
          key: "cheating",
          caption: "清代科举夹带实物：满幅蝇头小字",
        },
      },
      {
        label: "录取率约十分之一二",
        text: "每科取二三百名，过千举人赴考（通行估算）；试卷朱笔誊录、去名糊口，考官只对文字不对人。",
      },
    ],
  },
  {
    num: "⑥",
    name: "殿试",
    place: "皇城保和殿（清制）",
    timing: "会试同年四月",
    identity: "定「进士」三甲",
    summary: "天子亲策于廷，只定名次不黜落——一甲三名赐进士及第，二甲赐进士出身，三甲赐同进士出身。",
    details: [
      {
        label: "大金榜",
        text: "金榜以「奉天承运皇帝制曰」起首——道光二十四年武殿试大金榜卷首书「第一甲赐武进士及第」。",
        image: {
          key: "jinbang",
          caption: "道光二十四年武殿试大金榜（卷首）",
        },
      },
      {
        label: "状元卷真容",
        text: "明万历二十六年赵秉忠殿试卷，卷首「第一甲第一名」金书——现存稀见的明代状元卷。",
        image: {
          key: "zhuangyuanjuan",
          caption: "赵秉忠殿试卷卷首「第一甲第一名」",
        },
      },
      {
        label: "五万余分之一",
        text: "明清五百余年共取进士约五万余名，平均每年不足百人。",
      },
    ],
  },
  {
    num: "⑦",
    name: "铨选授官",
    place: "吏部 · 翰林院",
    timing: "会试年五月以后",
    identity: "入仕为官",
    summary: "朝考选庶吉士入翰林，其余进士授部院主事或外放知县——由「读书人」变「官」。",
    details: [
      {
        label: "县衙正堂",
        text: "外放知县是最普遍的去处——内乡县衙正堂即清代州县官理政之所的实例。",
        image: {
          key: "yamen",
          caption: "内乡县衙正堂：清代州县官理政之所",
        },
      },
      {
        label: "授官从七品起步",
        text: "状元授修撰（从六品），二三甲多授主事（正六品）、知县（正七品）。",
      },
      {
        label: "翰林清途",
        text: "庶吉士三年散馆，「非翰林不入内阁」；品级升迁看各朝迁转机制（见下节）。",
      },
    ],
  },
];

/** 读书人晋身之路：每级的人数口径（通行估算），漏斗逐级收窄。 */
export interface FunnelLevel {
  identity: string;
  count: string;
  /** 图形上的人形图标个数（示意，非按比例精确绘制）。 */
  icons: number;
}

export const ADVANCEMENT_FUNNEL: FunnelLevel[] = [
  { identity: "童生", count: "应试者以百万计", icons: 10 },
  { identity: "生员（秀才）", count: "全国存量约五十万", icons: 7 },
  { identity: "举人", count: "每科中额约一千二百名", icons: 4 },
  { identity: "贡士", count: "每科取二三百名", icons: 2 },
  { identity: "进士", count: "一甲只三名", icons: 1 },
];

/** 一科三年的节奏轴：一科跨两年、三年一个轮回。 */
export interface CadenceNode {
  name: string;
  time: string;
}

export const EXAM_CADENCE: CadenceNode[] = [
  { name: "童试", time: "年年可考" },
  { name: "乡试", time: "第一年 · 八月" },
  { name: "会试", time: "第二年 · 二月" },
  { name: "殿试", time: "第二年 · 四月" },
  { name: "朝考授官", time: "第二年 · 五月以后" },
];

/** 图例：一张考卷从备考到授官的六个环节。 */
export interface LegendItem {
  icon: "read" | "enter" | "write" | "review" | "list" | "appoint";
  title: string;
  note: string;
}

export const EXAM_LEGEND: LegendItem[] = [
  { icon: "read", title: "读书", note: "寒窗苦读，以经义为本" },
  { icon: "enter", title: "入场", note: "核验身份，进场入号" },
  { icon: "write", title: "答卷", note: "八股成文，一气呵成" },
  { icon: "review", title: "阅卷", note: "誊录评阅，去名定等" },
  { icon: "list", title: "金榜", note: "张榜公布，天下共知" },
  { icon: "appoint", title: "授官", note: "朝廷铨选，授以官职" },
];

/** 正途之外的异途入仕，阶梯旁的岔路。 */
export const SIDE_ROUTES: {
  title: string;
  note: string;
  routes: { name: string; detail: string }[];
} = {
  title: "岔路 · 正途之外的入仕",
  note: "出身途别决定晋升天花板：同一官品，正途压异途一头。",
  routes: [
    { name: "荫袭", detail: "先人官爵荫及子孙，恩荫、难荫荫生经考试授官。" },
    { name: "捐纳", detail: "出资买官，清代开捐例后成常制，多为候补虚衔。" },
    { name: "吏员", detail: "胥吏考满入流，明清两代品级皆有上限。" },
    { name: "军功", detail: "战功议叙授职，乱世之中晋升最速。" },
  ],
};

/** 页头年份里程碑，与典章制度「科举」条目同一口径。 */
export const EXAM_MILESTONES: ExamMilestone[] = [
  { year: "前134", event: "察举立制" },
  { year: "220", event: "九品中正" },
  { year: "605", event: "进士科创置" },
  { year: "973", event: "殿试定制" },
  { year: "1315", event: "延祐首科" },
  { year: "1905", event: "诏停科举" },
];
