import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 五代：梁唐晋汉周，使职差遣侵蚀职事官，九品三十阶沿唐制而实权归使职与武人。 */
export const wudai: DynastyAtlas = {
  id: "wudai",
  name: "五代",
  period: "907 — 960",
  system: "九品三十阶 · 使职差遣",
  source: "《旧五代史》《新五代史》《资治通鉴》《五代会要》",
  intro:
    "五代（907—960）梁、唐、晋、汉、周递嬗，承唐末藩镇牙兵拥立之弊，武人擅权、皇权不振。同中书门下平章事掌行政，枢密院掌军政、三司使总财赋，并立分权；殿前司与侍卫亲军都指挥使典禁军，为王朝更迭所系。使职差遣日盛，侵蚀职事官，九品三十阶虽沿唐制，品秩渐成虚文，实权尽归使职与武将。后周世宗整饬禁军、省并州县、厘革积弊，为宋制奠基。",
  root: {
    title: "皇帝",
    note: "五代更迭频仍，皇权倚禁军、枢密院与三司，使职差遣侵蚀职事官，武人往往干政。",
  },
  honorary: [
    {
      id: "wudai-three-gong",
      rank: "正一品 · 尊位",
      title: "三公",
      children: [
        node("wudai-taishi", "太师", {
          rank: "正一品",
          note: "沿唐制为最高荣衔，多赠予宰辅、勋臣。",
        }),
        node("wudai-taifu", "太傅", {
          rank: "正一品",
          note: "三公之一，多为加官、赠官，不预实政。",
        }),
        node("wudai-taibao", "太保", {
          rank: "正一品",
          note: "三公之一，位尊而无实职，常作为武将加衔。",
        }),
      ],
    },
    {
      id: "wudai-jianxiao-guan",
      rank: "荣衔",
      title: "检校官",
      children: [
        node("wudai-jianxiao-taishi", "检校太师", {
          note: "武臣、藩镇加衔之最高等，标榜军功与位望，非职事官。",
        }),
        node("wudai-jianxiao-taifu", "检校太傅", { note: "节度使、禁军将帅常带此衔，以示尊宠。" }),
        node("wudai-jianxiao-taiwei", "检校太尉", { note: "武将普遍加带，与兼官、勋爵相叠加。" }),
        node("wudai-jianxiao-situ", "检校司徒", { note: "次一等检校官，多授刺史、团练使等武职。" }),
      ],
    },
  ],
  branches: [
    branch(
      "central",
      "中",
      "中书门下与枢密三司",
      "同中书门下平章事掌行政，枢密院掌军政，三司使总财赋，三者并立；尚书省沿唐制而实权渐移。",
      [
        node("wudai-zhongshu", "中书门下", {
          rank: "正二品 — 正三品",
          note: "唐末宰相议政之所，长官为同中书门下平章事，掌全国政务；然军权、财权分别为枢密院与三司所分。",
        }),
        node("wudai-shumiyuan", "枢密院", {
          note: "唐末始置，五代掌军政军令，枢密使多由武臣或帝王亲信充任，与中书门下对掌文武，权势极重。",
        }),
        node("wudai-sansi", "三司使", {
          note: "后唐以来合盐铁、度支、户部为三司，三司使总理全国财赋，称「计相」，直接对皇帝负责。",
        }),
        node("wudai-shangshu", "尚书省", {
          note: "沿唐制置尚书令、左右仆射总领六部，然实权渐归使职差遣，尚书令、仆射多为荣誉虚衔。",
        }),
      ],
    ),
    branch(
      "assistant",
      "佐",
      "清望与职事",
      "翰林学士、端明殿学士掌诏敕顾问，六部、御史台沿唐旧制，然职事官多为虚衔，清望之职反近机要。",
      [
        node("wudai-hanlin", "翰林学士", {
          note: "掌草拟诏敕、备皇帝顾问，为清望要职；唐末以来常由此途擢拜宰相。",
        }),
        node("wudai-duanming", "端明殿学士", {
          note: "后唐始置，位在翰林学士之上，备侍从顾问、参议机政，多为宰辅与重臣所带荣衔。",
        }),
        node("wudai-six-boards", "六部", {
          note: "吏、户、礼、兵、刑、工六部沿唐制，尚书、侍郎多为寄禄虚衔，实权归差遣与诸使。",
          children: ["吏部", "户部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
            node(`wudai-board-${i}`, title, { note: "沿唐制置尚书、侍郎，五代时多为虚衔。" }),
          ),
        }),
        node("wudai-censorate", "御史台", {
          note: "御史大夫、御史中丞掌监察弹劾，沿唐制而风格渐为武臣所抑。",
        }),
      ],
    ),
    branch(
      "military",
      "禁",
      "禁军",
      "殿前司与侍卫亲军分掌禁军，殿前都点检、侍卫亲军都指挥使为军中要职，禁军向背足以决定王朝兴替。",
      [
        node("wudai-dianqian", "殿前司", {
          note: "掌殿前诸班禁军，为皇帝亲军核心；后周世宗整饬禁军后，殿前司地位尤重。",
          children: [
            node("wudai-dianqian-dudianjian", "殿前都点检", {
              rank: "禁军要职",
              note: "后周置，为殿前司最高长官，统殿前诸班，赵匡胤后周时曾任此职，握兵权重。",
            }),
            node("wudai-dianqian-fududianjian", "殿前副都点检", {
              note: "殿前都点检之副，佐统殿前禁军，亦为军中高位。",
            }),
          ],
        }),
        node("wudai-shiwei", "侍卫亲军", {
          note: "统侍卫亲军马步诸军，与殿前司并为禁军两大系统。",
          children: [
            node("wudai-shiwei-duzhihuishi", "侍卫亲军都指挥使", {
              rank: "禁军要职",
              note: "侍卫亲军最高长官，掌马步禁军，多为武臣重任，与枢密院相表里。",
            }),
            node("wudai-shiwei-fuduzhihuishi", "侍卫亲军副都指挥使", {
              note: "都指挥使之副，分统侍卫亲军马军、步军。",
            }),
          ],
        }),
      ],
    ),
    branch(
      "local",
      "地",
      "藩镇州县",
      "节度使、观察使、刺史分镇州县，藩镇牙兵拥立主帅，武人擅权；县令以下沿唐制而受制于藩镇。",
      [
        node("wudai-jiedushi", "节度使", {
          note: "藩镇最高长官，掌一道军政财赋，唐末以来拥兵自重，五代多由武人充任，常兼枢密、禁军之职。",
        }),
        node("wudai-guanchashi", "观察使", {
          note: "位亚于节度使，掌一道军政民政，或由节度使兼领，为藩镇体系要职。",
        }),
        node("wudai-cishi", "刺史", {
          note: "州长官，沿唐制，五代时多由武人兼领，实际军政受节度使节制。",
        }),
        node("wudai-yabing", "藩镇牙兵", {
          note: "藩镇亲兵，唐末以来屡屡拥立、废逐主帅，五代皇权更迭背后多有牙兵与禁军之力。",
        }),
        node("wudai-county", "县", {
          note: "县分等第，品级随等第而差；后周世宗省并州县，裁汰冗滥。",
          children: [
            node("wudai-xianling", "县令", {
              rank: "正五品上 — 从七品下",
              note: "县之长吏，掌民政赋役，沿唐制而受藩镇节制。",
            }),
            node("wudai-xian-aide", "县丞、主簿、县尉", {
              note: "县之佐贰与属官，分掌文书、簿籍、捕盗。",
            }),
          ],
        }),
      ],
    ),
  ],
  hierarchyNote:
    "唐末以来，藩镇牙兵拥立主帅、节度使割据一方；朝廷以枢密院分宰相军权、以三司使总财赋，殿前司与侍卫亲军典禁军，官、职、差遣渐相分离。九品三十阶沿唐制而实权归使职与武将，图中品级为职事官品，非实权高下；后周世宗整顿禁军、省并州县，稍收其权。",
  rankSystemLabel: "九品三十阶",
  rankIntro:
    "五代沿唐九品三十阶：九品各分正从、四品以下再分上下阶，流外另为一途。然使职差遣侵蚀职事官，枢密、三司、禁军与藩镇以差遣握实权，品秩多成虚文；后周世宗厘革积弊，宋初渐以寄禄官代之。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保、太尉", {
      order: 1,
      salary: 100,
      hat: "进贤冠",
      hatColor: "#8a6d1f",
      robe: "紫袍 · 金鱼袋",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "枢密使、检校太师、太子太师", {
      order: 2,
      salary: 94,
      hat: "进贤冠",
      hatColor: "#987b2a",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("正二品", "正", "同中书门下平章事、六部尚书", {
      order: 3,
      salary: 86,
      hat: "进贤冠",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("正三品", "正", "翰林学士、端明殿学士、御史大夫", {
      order: 4,
      salary: 72,
      hat: "进贤冠",
      hatColor: "#b89e50",
      robe: "紫袍",
      robeColor: "#835f86",
    }),
    level("正四品", "正", "六部侍郎、观察使、刺史", {
      order: 5,
      salary: 56,
      hat: "进贤冠",
      hatColor: "#c0aa62",
      robe: "绯袍 · 银鱼袋",
      robeColor: "#8a3a37",
    }),
    level("正五品", "正", "郎中、县令", {
      order: 6,
      salary: 44,
      hat: "进贤冠",
      hatColor: "#cab978",
      robe: "绯袍",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "员外郎、县丞、主簿", {
      order: 7,
      salary: 30,
      hat: "进贤冠",
      hatColor: "#d2c389",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "县尉、录事、诸司吏员", {
      order: 8,
      salary: 16,
      hat: "进贤冠",
      hatColor: "#dacd9b",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品", "太师、太傅、太保、枢密使", [1, 2]),
    ladder("二品 · 三品", "平章事、六部尚书、翰林学士、端明殿学士", [3, 4]),
    ladder("四品 — 五品", "侍郎、观察使、刺史、县令", [5, 6]),
    ladder("六品 — 七品", "员外郎、县丞、主簿", [7]),
    ladder("八品 — 九品", "县尉、录事、诸司吏员", [8]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "补子为明清定制，五代无补子之制，以九品品秩与紫、绯、绿、青服色及鱼袋别尊卑。",
  notes: {
    rank: "五代沿唐九品三十阶，九品各分正从、四品以下分上下阶；然使职差遣侵蚀职事官，品秩多为虚文，实权归枢密院、三司、禁军与藩镇。",
    hat: "以进贤冠等冠制与簪笏别尊卑，武将则多用幞头、武冠。",
    robe: "三品以上紫、四五品绯、六七品绿、八九品青，沿唐制；武臣加检校官、兼带职，服色常逾本品。",
    salary: "品阶定禄米厚薄，然武将兼领藩镇财赋、职田与赏赐，所得常远逾正俸。",
    ritual: "朝会班序依品阶排定，然枢密使、禁军将帅与藩镇节度使以军功居前，品秩与实权常不相称。",
    badge: "补子为明清定制，五代未设，以品秩与服色、鱼袋别尊卑。",
  },
  ritual: {
    title: "品秩与实权相离",
    text: "朝会、大典班序依九品品阶排定，然五代武人擅权，枢密使、禁军都指挥使与藩镇节度使虽品秩或卑，实权反居宰辅之上。",
    left: "品秩",
    right: "实权",
  },
  footnote:
    "五代承唐末之弊，九品三十阶沿唐《六典》之制；官名与故事据《旧五代史》《新五代史》《资治通鉴》《五代会要》，使职差遣与品秩分离处随文说明。",
};
