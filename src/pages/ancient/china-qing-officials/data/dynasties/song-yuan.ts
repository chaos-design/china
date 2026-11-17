import { branch, ladder, level, node, sequence } from "../builders";
import type { DynastyAtlas } from "../types";

/** 宋：寄禄官、职、差遣分离，二府三司分权。 */
export const song: DynastyAtlas = {
  id: "song",
  name: "宋",
  period: "960 — 1279",
  system: "寄禄官制 · 官职差遣",
  source: "《宋史·职官志》《宋会要辑稿》",
  intro:
    "宋设官分职与任事分离：寄禄官定品秩俸禄，职为荣衔，差遣才是实权；中书门下与枢密院分掌文武，三司总理财政。",
  root: { title: "皇帝", note: "二府三司分权，官、职、差遣分离" },
  honorary: [
    {
      id: "song-three-gong",
      rank: "正一品",
      title: "三公",
      children: [
        node("song-taishi", "太师"),
        node("song-taifu", "太傅"),
        node("song-taibao", "太保"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "二府三司", "中书门下掌政、枢密院掌军、三司掌财，权分而相权弱。", [
      node("song-zhongshu", "中书门下", { note: "政事堂，宰相办公之所，掌全国政务。" }),
      node("song-shumiyuan", "枢密院", { note: "掌军政军令，与中书门下对掌文武，称「二府」。" }),
      node("song-sansi", "三司", { note: "盐铁、度支、户部，总理财政，称「计相」。" }),
    ]),
    branch("assistant", "佐", "台谏与六部", "御史台、谏院掌监察封驳；六部渐成虚署，实权归差遣。", [
      node("song-censorate", "御史台", { note: "御史中丞、侍御史掌纠弹。" }),
      node("song-remonstrance", "谏院", { note: "谏官掌规谏、封驳诏令。" }),
      node("song-six-boards", "六部", { note: "吏、户、礼、兵、刑、工，尚书、侍郎多为寄禄虚衔。" }),
    ]),
    branch("local", "地", "路州县", "路设帅、漕、宪、仓四司分权，州置通判牵制知州。", [
      node("song-circuit", "路", { note: "转运司、提点刑狱司、安抚司、提举常平司分掌财刑军仓。" }),
      node("song-prefecture", "州 / 府", {
        children: [
          node("song-governor", "知州 / 知府", { note: "带「通判」同签文书，互相牵制。" }),
          node("song-vice", "通判"),
        ],
      }),
      node("song-county", "县", {
        children: [node("song-magistrate", "知县"), node("song-aide", "县丞、主簿、县尉")],
      }),
    ]),
  ],
  hierarchyNote: "宋代「官」定品禄、「差遣」掌实权，图中品级为寄禄官品，非实权高下。",
  rankSystemLabel: "寄禄官阶",
  rankIntro: "宋以寄禄官定品秩俸禄，职为荣衔、差遣任事；元丰改制后复以阶官代寄禄。",
  levels: sequence([
    level("一品", "正", "太师、太傅、太保、亲王", {
      order: 1,
      salary: 100,
      hat: "进贤冠",
      hatColor: "#8a6d1f",
      robe: "紫袍",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "枢密使、太子太师", {
      order: 1,
      salary: 93,
      hat: "进贤冠",
      hatColor: "#987b2a",
      robe: "紫袍",
      robeColor: "#66446f",
    }),
    level("二品", "正", "宰相、参知政事、六部尚书", {
      order: 2,
      salary: 82,
      hat: "进贤冠",
      hatColor: "#a68a37",
      robe: "紫袍",
      robeColor: "#715078",
    }),
    level("三品", "正", "翰林学士、御史中丞、侍郎", {
      order: 3,
      salary: 68,
      hat: "进贤冠",
      hatColor: "#b89e50",
      robe: "紫袍",
      robeColor: "#835f86",
    }),
    level("四品 — 五品", "从", "给事中、中书舍人、郎中", {
      order: 4,
      salary: 52,
      hat: "进贤冠",
      hatColor: "#c0aa62",
      robe: "绯袍",
      robeColor: "#8a3a37",
    }),
    level("六品 — 七品", "从", "员外郎、太常博士、知县", {
      order: 6,
      salary: 34,
      hat: "进贤冠",
      hatColor: "#cab978",
      robe: "绿袍",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "主簿、县尉、诸司属官", {
      order: 8,
      salary: 16,
      hat: "进贤冠",
      hatColor: "#d2c389",
      robe: "青袍",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品", "三公、亲王、枢密使", [1]),
    ladder("二品 · 三品", "宰相、参知政事、翰林学士", [2, 3]),
    ladder("四品 — 七品", "给事中、郎中、知县", [4, 5, 6, 7]),
    ladder("八品 — 九品", "主簿、县尉、属官", [8, 9]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "宋以紫、绯、绿、青服色与鱼袋别品，补子尚未出现。",
  notes: {
    rank: "寄禄官定品秩，差遣掌实权，二者常不相称。",
    hat: "以冠帽与簪笏别尊卑。",
    robe: "紫、绯、绿、青依寄禄官品而服。",
    salary: "寄禄官品决定俸禄厚薄。",
    ritual: "朝会班序以寄禄官品为准。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "官品与实权相离",
    text: "朝会位次依寄禄官品，实权则视差遣而定，二者常不一致。",
    left: "高品",
    right: "低品",
  },
  footnote: "宋代官、职、差遣分离，品级指寄禄官；官名据《宋史·职官志》。",
};

/** 元：中书一省总揽，九品等差，行省制度发端。 */
export const yuan: DynastyAtlas = {
  id: "yuan",
  name: "元",
  period: "1271 — 1368",
  system: "中书一省 · 九品等差",
  source: "《元史·百官志》《经世大典》",
  intro:
    "元以中书省总揽政务、枢密院掌兵、御史台掌监察，地方设行中书省；官分九品、各别正从，色目与汉人官员各有等差。",
  root: { title: "皇帝", note: "中书一省总政，行省分治地方" },
  honorary: [
    {
      id: "yuan-three-gong",
      rank: "正一品",
      title: "三公",
      children: [
        node("yuan-taishi", "太师"),
        node("yuan-taifu", "太傅"),
        node("yuan-taibao", "太保"),
      ],
    },
  ],
  branches: [
    branch("central", "中", "中书省", "中书省为最高政务机构，右丞相、左丞相总领百官。", [
      node("yuan-zhongshu", "中书省", { note: "置右丞相、左丞相、平章政事、左右丞、参知政事。" }),
      node("yuan-shumiyuan", "枢密院", { note: "掌全国军务，长官多由皇太子兼领。" }),
      node("yuan-yushitai", "御史台", { note: "掌监察纠弹，设行御史台分察各地。" }),
    ]),
    branch("assistant", "佐", "六部与诸院", "六部隶中书省，另有宣政院、太禧宗禋院等特设机构。", [
      node("yuan-six-boards", "六部", {
        children: ["吏部", "户部", "礼部", "兵部", "刑部", "工部"].map((title, i) =>
          node(`yuan-board-${i}`, title),
        ),
      }),
      node("yuan-xuanzheng", "宣政院", { note: "掌佛教与吐蕃地区军政事务。" }),
      node("yuan-hanlin", "翰林院", { note: "掌诏敕、史册与译写。" }),
    ]),
    branch(
      "local",
      "地",
      "行省路府州县",
      "行中书省为地方最高机构，下辖路、府、州、县，品级依次而降。",
      [
        node("yuan-province", "行中书省", { note: "掌一省军政财赋，为后世「省」之滥觞。" }),
        node("yuan-route", "路 / 府 / 州", {
          children: [
            node("yuan-darughachi", "达鲁花赤", {
              note: "各路府州县皆置，位在长官之上，多由蒙古人任之。",
            }),
            node("yuan-governor", "总管 / 知府 / 知州"),
          ],
        }),
        node("yuan-county", "县", {
          children: [node("yuan-magistrate", "县尹"), node("yuan-aide", "县丞、主簿、县尉")],
        }),
      ],
    ),
  ],
  hierarchyNote: "元代各路府州县皆置达鲁花赤，位在汉人长官之上，体现民族分治。",
  rankSystemLabel: "九品等差",
  rankIntro: "元官分九品、各别正从，一品至九品共十八级，另有流外杂职。",
  levels: sequence([
    level("正一品", "正", "太师、太傅、太保、右丞相", {
      order: 1,
      salary: 100,
      hat: "宝顶冠帽",
      hatColor: "#8a6d1f",
      robe: "紫罗",
      robeColor: "#5b3a66",
    }),
    level("从一品", "从", "左丞相、平章政事", {
      order: 1,
      salary: 94,
      hat: "宝顶冠帽",
      hatColor: "#987b2a",
      robe: "紫罗",
      robeColor: "#66446f",
    }),
    level("正二品", "正", "左右丞、行省平章", {
      order: 2,
      salary: 84,
      hat: "宝顶冠帽",
      hatColor: "#a68a37",
      robe: "紫罗",
      robeColor: "#715078",
    }),
    level("从二品", "从", "参知政事、行省右丞", {
      order: 2,
      salary: 79,
      hat: "宝顶冠帽",
      hatColor: "#ae9443",
      robe: "紫罗",
      robeColor: "#7b5a80",
    }),
    level("正三品", "正", "六部尚书、御史中丞", {
      order: 3,
      salary: 68,
      hat: "宝顶冠帽",
      hatColor: "#b89e50",
      robe: "绯罗",
      robeColor: "#8a3a37",
    }),
    level("四品 — 五品", "从", "侍郎、郎中、路总管", {
      order: 4,
      salary: 52,
      hat: "宝顶冠帽",
      hatColor: "#c0aa62",
      robe: "绯罗",
      robeColor: "#97473f",
    }),
    level("六品 — 七品", "从", "员外郎、知府、知州", {
      order: 6,
      salary: 32,
      hat: "宝顶冠帽",
      hatColor: "#cab978",
      robe: "绿罗",
      robeColor: "#3d6b4c",
    }),
    level("八品 — 九品", "从", "县尹、主簿、县尉", {
      order: 8,
      salary: 15,
      hat: "宝顶冠帽",
      hatColor: "#d2c389",
      robe: "青罗",
      robeColor: "#3f5d78",
    }),
  ]),
  ladderGroups: [
    ladder("一品", "太师、右丞相、左丞相", [1]),
    ladder("二品", "平章、左右丞、参知政事", [2]),
    ladder("三品", "六部尚书、御史中丞", [3]),
    ladder("四品 — 七品", "侍郎、路总管、知府州", [4, 5, 6, 7]),
    ladder("八品 — 九品", "县尹、主簿、县尉", [8, 9]),
  ],
  badgesAvailable: false,
  civilBadges: [],
  militaryBadges: [],
  badgeNote: "元代以冠帽宝顶与罗服颜色别品，补子尚未出现。",
  notes: {
    rank: "官分九品、各别正从，共十八级。",
    hat: "以冠帽宝顶材质别品。",
    robe: "紫、绯、绿、青罗服依品而别。",
    salary: "品级越高，俸禄越厚。",
    ritual: "朝会位次依品级排定。",
    badge: "补子尚未出现。",
  },
  ritual: {
    title: "以品级定朝位",
    text: "朝会、宴飨的班序依品级与身份排定。",
    left: "一品",
    right: "九品",
  },
  footnote: "元制官分九品十八级，各路达鲁花赤位在长官之上；官名据《元史·百官志》。",
};
