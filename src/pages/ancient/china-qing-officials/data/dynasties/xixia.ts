import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 西夏：蕃汉并用，蕃官以党项旧号掌军政，汉官仿宋制治州县。 */
export const xixia: DynastyAtlas = {
  id: "xixia",
  name: "西夏",
  period: "1038 — 1227",
  system: "蕃汉并用 · 因俗设官",
  source: "《宋史·夏国传》《契丹国志》",
  intro:
    "西夏蕃官以党项旧号掌军政与王族事务，汉官仿宋制置中书、枢密、御史台及六部，并行科举取士；监军司分掌诸路军务，蕃汉两套系统并立于皇帝之下。",
  root: { title: "皇帝", note: "党项旧号与宋制汉官并用，蕃官多掌军政、汉官理州县" },
  honorary: [
    {
      id: "xixia-honor-fanhao",
      rank: "超品（王族尊号）",
      title: "兀卒 · 宁令",
      children: [
        node("xixia-wuzu", "兀卒", {
          note: "党项王族尊号，地位在诸蕃官之上，常由嗣主或宗室重臣称之。",
        }),
        node("xixia-ningling", "宁令", {
          note: "党项旧号显官，掌军政要务，多由王族与党项豪酋任之。",
        }),
        node("xixia-moningling", "谟宁令", { note: "宁令之次，佐掌部族军政与王族事务。" }),
      ],
    },
  ],
  branches: [
    branch(
      "xixia-fan",
      "蕃",
      "蕃官",
      "以党项旧号命官，多由王族、豪酋任之，掌军政要务与部落事务，地位往往在汉官之上。",
      [
        node("xixia-fanguan", "蕃官", {
          note: "党项旧号如「兀卒」「宁令」「谟宁令」等，掌军政要务与部落事务。",
        }),
        node("xixia-jianjunsi", "监军司", {
          note: "西夏地方军政机构，分掌诸路军务、屯戍与部众，为方面统兵之职，多以蕃官任之。",
        }),
      ],
    ),
    branch(
      "xixia-han",
      "汉",
      "汉官",
      "仿宋制设中书、枢密、御史台与六部，多用汉人及通汉文之士，分掌州县民政、文书与礼制。",
      [
        node("xixia-zhongshu", "中书省", { note: "仿宋制置中书令、丞相，掌全国政务与文书诏令。" }),
        node("xixia-shumi", "枢密院", { note: "掌军政、兵籍与边防将帅，长官多由蕃官贵胄兼领。" }),
        node("xixia-yushitai", "御史台", { note: "掌监察百官、纠劾不法，制度仿唐宋御史台。" }),
        node("xixia-liubu", "六部", { note: "隶于中书，分掌选官、财赋、礼教、军政、刑名与营造。" }),
        node("xixia-keju", "科举", {
          note: "以汉文、番文取士，录取名额兼顾蕃汉，为汉官与部分蕃官的出身之途。",
        }),
      ],
    ),
    branch(
      "xixia-local",
      "地",
      "州县",
      "汉地州县置知州、县令、县丞、主簿、县尉，分掌民政赋役与捕盗，另受监军司节制。",
      [
        node("xixia-zhou", "州", { note: "置知州、通判，掌一州民政、赋役与刑狱。" }),
        node("xixia-xian", "县", {
          children: [
            node("xixia-xianling", "县令", { note: "一县长官，掌赋役、狱讼、劝农与教化。" }),
            node("xixia-xiancheng", "县丞 · 主簿 · 县尉", {
              note: "分掌文书簿籍、印钥勾检与捕盗巡徼。",
            }),
          ],
        }),
      ],
    ),
  ],
  hierarchyNote:
    "蕃官以党项旧号掌军政与王族事务，汉官仿宋制理州县、文书与礼制；监军司为地方军政之职，蕃汉两套系统各归其属。",
  rankSystemLabel: "九品参用 · 蕃汉异制",
  rankIntro:
    "西夏品秩仿宋九品正从，蕃官以旧号叙位、汉官依品阶定等；同品之中，蕃汉职掌、出身与升迁之途往往不同。",
  levels: sequence([
    level("一品", "正", "兀卒、宁令、中书令", {
      order: 1,
      salary: 100,
      hat: "金花毡冠",
      hatColor: "#8a6d1f",
      robe: "紫袍金带",
      robeColor: "#5b3a66",
      salaryLabel: "食封户 · 岁赐最厚",
    }),
    level("从一品", "从", "谟宁令、枢密使", {
      order: 2,
      salary: 92,
      hat: "金花毡冠",
      hatColor: "#987b2a",
      robe: "紫袍金带",
      robeColor: "#66446f",
    }),
    level("二品", "正", "御史大夫、六部尚书", {
      order: 3,
      salary: 82,
      hat: "金饰幞头",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("三品", "正", "监军司、翰林学士", {
      order: 4,
      salary: 70,
      hat: "金饰幞头",
      hatColor: "#b89e50",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("四品 — 五品", "从", "六部侍郎、知州", {
      order: 5,
      salary: 56,
      hat: "银饰幞头",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "县令、通判、科举出身官", {
      order: 6,
      salary: 38,
      hat: "幞头",
      hatColor: "#cab978",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "县丞、主簿、县尉", {
      order: 7,
      salary: 18,
      hat: "幞头",
      hatColor: "#d2c389",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品 · 从一品", "兀卒、宁令、中书令、枢密使", [1, 2]),
    ladder("二品 · 三品", "御史大夫、六部尚书、监军司", [3, 4]),
    ladder("四品 — 五品", "六部侍郎、知州", [5]),
    ladder("六品 — 七品", "县令、通判、科举出身官", [6]),
    ladder("八品 — 九品", "县丞、主簿、县尉", [7]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "补子为明清定制，西夏无补子之制；参用唐宋服色，不以禽兽补纹分文武。",
  notes: {
    rank: "品秩仿宋九品正从，蕃官以旧号叙位、汉官依品阶定等，同品而职掌、出身悬殊。",
    hat: "以毡冠、金花与幞头之别辨贵贱，蕃官多存党项旧服。",
    robe: "紫、绯、绿、青参用唐宋服色，不以禽兽补纹分文武。",
    salary: "俸禄依品秩厚薄，兼有分地、食封户与岁赐，蕃官贵族多食封户、征赋自给。",
    ritual: "朝会班序依品秩与族属而别，蕃官、汉官各依本俗与宋制之仪列班。",
    badge: "补子未兴，以鱼袋、金带与服色辨尊卑文武。",
  },
  ritual: {
    title: "蕃汉并列 · 各依本俗",
    text: "西夏朝会，蕃官以党项旧号与世系叙位，汉官依宋制品阶列班，两套秩序同朝并存。",
    left: "蕃官 · 旧号",
    right: "汉官 · 宋制",
  },
  footnote:
    "西夏官制蕃汉并用，本文品秩为参照九品之制的示意梳理；官名据《宋史·夏国传》《契丹国志》。",
};
