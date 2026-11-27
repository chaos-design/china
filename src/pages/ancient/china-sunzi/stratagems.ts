/**
 * 《三十六计》全文（佚名，约明清成书）六套三十六计。
 * 解语据维基文库《三十六计》与古文岛全文逐条录入；「走为上」在维基文库作「走为上策」，
 * 通行本多作「走为上计」，此处从通行本并在页面上注明异文，避免把异文当成定本。
 * 出处语源见《南齐书·王敬则传》「檀公三十六策，走是上计」。
 */

export type StratagemSet = "胜战计" | "敌战计" | "攻战计" | "混战计" | "并战计" | "败战计";

export interface Stratagem {
  id: string;
  number: number;
  name: string;
  plain: string;
  set: StratagemSet;
  verse: string;
  /** only linked where the source text genuinely matches one of the three battles */
  link?: { battleId: string; stepId: string };
}

export const STRATAGEM_SETS: readonly { id: StratagemSet; label: string; scope: string }[] = [
  { id: "胜战计", label: "胜战计", scope: "优势时用计" },
  { id: "敌战计", label: "敌战计", scope: "相持时用计" },
  { id: "攻战计", label: "攻战计", scope: "进攻时用计" },
  { id: "混战计", label: "混战计", scope: "混战时用计" },
  { id: "并战计", label: "并战计", scope: "并吞时用计" },
  { id: "败战计", label: "败战计", scope: "劣势时用计" },
];

export const STRATAGEMS: readonly Stratagem[] = [
  {
    id: "s1",
    number: 1,
    name: "瞒天过海",
    set: "胜战计",
    verse: "备周而意怠，常见则不疑，阴在阳之内，不在阳之对。太阳，太阴。",
    plain: "防备最周密时最容易松懈，看惯的事不再起疑；机密藏在公开的形式里，而不是与公开相对。",
  },
  {
    id: "s2",
    number: 2,
    name: "围魏救赵",
    set: "胜战计",
    verse: "共敌不如分敌，敌阳不如敌阴。",
    plain: "与敌正面硬碰不如先分散它，攻其正面不如攻其后方必救之处。",
    link: { battleId: "guiling", stepId: "daliang" },
  },
  {
    id: "s3",
    number: 3,
    name: "借刀杀人",
    set: "胜战计",
    verse: "敌已明，友未定，引友杀敌，不出自力，以损推演。",
    plain: "敌人已明确而友方态度未定，引导友方去消耗敌人，自己不出力。",
  },
  {
    id: "s4",
    number: 4,
    name: "以逸待劳",
    set: "胜战计",
    verse: "困敌之势，不以战，损刚益柔。",
    plain: "先让敌人的势头受困，不急着决战；以静制动，使刚者自损。",
    link: { battleId: "maling", stepId: "maling" },
  },
  {
    id: "s5",
    number: 5,
    name: "趁火打劫",
    set: "胜战计",
    verse: "敌之害大，就势取利，刚决柔也。",
    plain: "敌方陷于大患时顺势取利，用优势击其虚弱。",
  },
  {
    id: "s6",
    number: 6,
    name: "声东击西",
    set: "胜战计",
    verse: "乱志乱萃，不虞坤下兑上之象；利其不自主而取之。",
    plain: "制造假方向使敌人判断失控，趁其无法自主时取之。",
  },
  {
    id: "s7",
    number: 7,
    name: "无中生有",
    set: "敌战计",
    verse: "诳也，非诳也，实其所诳也。少阴，太阴，太阳。",
    plain: "先用假象起始，但不假到底；让假象逐步转成真象，掩护真实意图。",
  },
  {
    id: "s8",
    number: 8,
    name: "暗渡陈仓",
    set: "敌战计",
    verse: "示之以动，利其静而有主，益动而巽。",
    plain: "故意亮出正面动作，利用敌方固守的空隙，暗中从另一路突进。",
  },
  {
    id: "s9",
    number: 9,
    name: "隔岸观火",
    set: "敌战计",
    verse: "阳乖序乱，阴以待逆，暴戾恣睢，其势自毙。顺以动豫，豫顺以动。",
    plain: "敌人内部乱作一团时按兵不动，等它自行崩坏，再顺其变而动。",
  },
  {
    id: "s10",
    number: 10,
    name: "笑里藏刀",
    set: "敌战计",
    verse: "信而安之，阴以图之，备而后动，勿使有变：刚中柔外也。",
    plain: "让对方相信并松懈，暗中准备，条件成熟才动手：外表柔和，内里刚硬。",
  },
  {
    id: "s11",
    number: 11,
    name: "李代桃僵",
    set: "敌战计",
    verse: "势必有损，损阴以益阳。",
    plain: "局势注定要有损失时，舍局部以保全局。",
  },
  {
    id: "s12",
    number: 12,
    name: "顺手牵羊",
    set: "敌战计",
    verse: "微隙在所必乘，微利在所必得。少阴，少阳。",
    plain: "敌方再小的漏洞也要利用，再小的利益也要取得。",
  },
  {
    id: "s13",
    number: 13,
    name: "打草惊蛇",
    set: "攻战计",
    verse: "疑为叩实，察而后动，复者，阴之媒也。",
    plain: "有疑就先侦察落实，摸清再动；反复试探是发现暗藏之敌的手段。",
  },
  {
    id: "s14",
    number: 14,
    name: "借尸还魂",
    set: "攻战计",
    verse: "有用者不可借，不能用者，求借，借不能用者而用之。匪我求童蒙，童蒙求我。",
    plain: "能被控制的形式才可借用；借看似无用的名义来达成自己的目的。",
  },
  {
    id: "s15",
    number: 15,
    name: "调虎离山",
    set: "攻战计",
    verse: "待天以困之，用人以诱之，往蹇来返。",
    plain: "等天时使敌方受困，再用人为的假象把它诱离有利地形。",
  },
  {
    id: "s16",
    number: 16,
    name: "欲擒故纵",
    set: "攻战计",
    verse: "逼则反兵，走则减势，紧随勿迫。累其气力，消其斗志，散而后擒。兵不血刃，需，有孚光。",
    plain: "逼得太紧会遭到反扑，放其逃走反而削弱其势；跟随而不紧逼，待其力竭松散再擒。",
  },
  {
    id: "s17",
    number: 17,
    name: "抛砖引玉",
    set: "攻战计",
    verse: "类以诱之，击蒙也。",
    plain: "用类似的东西诱敌上当，乘其懵懂时击之。",
  },
  {
    id: "s18",
    number: 18,
    name: "擒贼擒王",
    set: "攻战计",
    verse: "摧其坚，夺其魁，以解其体；龙战于野，其道穷也。",
    plain: "摧毁其核心、抓住其首脑，整支力量就会瓦解。",
  },
  {
    id: "s19",
    number: 19,
    name: "釜底抽薪",
    set: "混战计",
    verse: "不敌其力，而消其势，兑下乾上之象。",
    plain: "力量不足以硬胜，就先削弱它赖以逞强的根本。",
  },
  {
    id: "s20",
    number: 20,
    name: "混水摸鱼",
    set: "混战计",
    verse: "乘其阴乱，利其弱而无主，随，以向晦入宴息。",
    plain: "趁敌方内部混乱、弱而无所适从时下手。",
  },
  {
    id: "s21",
    number: 21,
    name: "金蝉脱壳",
    set: "混战计",
    verse: "存其形，完其势；友不疑，敌不动；巽而上蛊。",
    plain: "保留原有的阵形与声势，使友军不疑、敌军不动，自己暗中抽身。",
  },
  {
    id: "s22",
    number: 22,
    name: "关门捉贼",
    set: "混战计",
    verse: "小敌困之，剥，不利有攸往。",
    plain: "对弱小之敌应围而歼之；放它逃走再去远追反而不利。",
  },
  {
    id: "s23",
    number: 23,
    name: "远交近攻",
    set: "混战计",
    verse: "形禁势格，利以近取。害以远隔，上火下泽。",
    plain: "受地形所限时先取近处，与远处保持距离；火上泽下，各得其宜。",
  },
  {
    id: "s24",
    number: 24,
    name: "假道伐虢",
    set: "混战计",
    verse: "两大之间，敌胁以从，我假以势，困，有言不信。",
    plain: "夹在两大之间的小国被敌方胁迫时，借救援之名出兵，空言不足以取信。",
  },
  {
    id: "s25",
    number: 25,
    name: "偷梁换柱",
    set: "并战计",
    verse: "频更其阵，抽其劲旅，待其自败，而后乘之，曳其轮也。",
    plain: "多次变动敌方阵容，把它的主力调开，等其自败再乘机进攻。",
  },
  {
    id: "s26",
    number: 26,
    name: "指桑骂槐",
    set: "并战计",
    verse: "大凌小者，警以诱之。刚中而应，行险而顺。",
    plain: "强者慑服弱者，用警戒的方式诱导；刚强得当，行险而顺。",
  },
  {
    id: "s27",
    number: 27,
    name: "假痴不癫",
    set: "并战计",
    verse: "宁伪作不知不为，不伪作假知妄为，静不露机，云雷屯也。",
    plain: "宁可装作不知不动，不可装懂而妄动；静默不泄露机谋。",
  },
  {
    id: "s28",
    number: 28,
    name: "上屋抽梯",
    set: "并战计",
    verse: "假之以便，唆之使前，断其援应，陷之死地，遇毒，位不当也。",
    plain: "先给敌人方便诱其深入，再断其接应，把它置于死地。",
  },
  {
    id: "s29",
    number: 29,
    name: "树上开花",
    set: "并战计",
    verse: "借局布势，力小势大；鸿渐于陆，其羽可用为仪也。",
    plain: "借既成的局面布阵列势，兵力虽小却显得声势浩大。",
  },
  {
    id: "s30",
    number: 30,
    name: "反客为主",
    set: "并战计",
    verse: "乘隙插足，扼其主机，渐之进也。",
    plain: "抓住空隙插足进去，控制其关键，逐步由客变主。",
  },
  {
    id: "s31",
    number: 31,
    name: "美人计",
    set: "败战计",
    verse: "兵强者，攻其将。将智者，伐其情。将弱兵颓，其势自萎。利用御寇，顺相保也。",
    plain: "敌方兵强就攻其将，将帅明智就扰乱其情；将弱兵颓，其势自衰。",
  },
  {
    id: "s32",
    number: 32,
    name: "空城计",
    set: "败战计",
    verse: "虚者虚之，疑中生疑；刚柔之际，奇而复奇。",
    plain: "空虚就让它显得更空，使疑心再生疑心；虚实相济，奇上加奇。",
  },
  {
    id: "s33",
    number: 33,
    name: "反间计",
    set: "败战计",
    verse: "疑中之疑，比之向内，不自失也。",
    plain: "在敌人的疑心之上再加一层疑心，借其内部力量，自己不受损失。",
  },
  {
    id: "s34",
    number: 34,
    name: "苦肉计",
    set: "败战计",
    verse: "人不自害，受害必真。假真真假，间以得行。童蒙之吉，顺以巽也。",
    plain: "人不会自害，所以受苦显得真实；以真假相混的方式让间谍得以活动。",
  },
  {
    id: "s35",
    number: 35,
    name: "连环计",
    set: "败战计",
    verse: "将多兵众，不可以敌，使其自累，以杀其势。在师中吉，承天宠也。",
    plain: "敌方将多兵众不可硬抗，设法让它自相牵累，以削弱其势。",
  },
  {
    id: "s36",
    number: 36,
    name: "走为上计",
    set: "败战计",
    verse: "全师避敌，在次无咎，未失常也。",
    plain: "保全军队避开强敌，退却不是失败，而是待机再战的正当战法。",
  },
];

export const STRATAGEM_BY_NUMBER: Record<number, Stratagem> = Object.fromEntries(
  STRATAGEMS.map((stratagem) => [stratagem.number, stratagem]),
);

/** 文本异文与史料出处，页面「文献」栏逐条可查。 */
export const STRATAGEM_SOURCES = [
  {
    label: "《三十六计》佚名本（约明清）",
    detail: "六套三十六计、总说与跋。现存较早为 1941 年成都兴华印刷所土纸翻印本，1961 年后流传。",
    url: "https://zh.wikisource.org/zh-hans/%E4%B8%89%E5%8D%81%E5%85%AD%E8%A8%88",
  },
  {
    label: "《南齐书·王敬则传》",
    detail:
      "「檀公三十六策，走是上计，汝父子唯应急走耳」——「三十六策」语源，《南史》《资治通鉴》亦载。",
    url: "https://zh.wikisource.org/wiki/%E5%8D%97%E9%BD%8A%E6%9B%B8",
  },
  {
    label: "《三十六计》全文（古文岛）",
    detail: "逐计解语全文，用于核校本页收录的原文；「假痴不癫」「走为上计」等异文已注明。",
    url: "https://m.gushiwen.cn/guwen/book_e11903fd10cd.aspx",
  },
] as const;
