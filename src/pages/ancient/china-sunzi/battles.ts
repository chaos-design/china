import type { BattleScenario } from "./types";

/**
 * 三役均为示意重绘：地名、河流与推进线取自史书梗概的相对关系，
 * 不作测绘，也不给兵力实数——古代战报的数字在各版本间差异极大。
 * 每役四幕，让「兵力怎么走 / 决策怎么变 / 结果怎么翻」在同一张图上可见。
 */
export const BATTLES: readonly BattleScenario[] = [
  {
    id: "baju",
    name: "柏举之战",
    period: "公元前506年",
    commander: "孙武与吴王阖闾",
    summary: "吴军弃舟登陆，绕开楚军正面防线，五战而入郢都。",
    sources:
      "据《左传·定公四年》「舍舟于淮汭」「战于柏举」「五战及郢」与《史记·吴太伯世家》大意重绘。",
    forces: [
      { id: "wu", name: "吴军", side: "a", hint: "远来兵少" },
      { id: "chu", name: "楚军", side: "b", hint: "本土兵众" },
    ],
    places: [
      { id: "gusu", kind: "capital", name: "姑苏", x: 130, y: 470 },
      { id: "huaixui", kind: "city", name: "淮汭", x: 330, y: 300 },
      { id: "dabie", kind: "pass", name: "大别隘", x: 520, y: 235 },
      { id: "hanshui", kind: "city", name: "汉水", x: 690, y: 310 },
      { id: "baju", kind: "city", name: "柏举", x: 650, y: 385 },
      { id: "ying", kind: "capital", name: "郢都", x: 840, y: 430 },
    ],
    regions: [
      {
        id: "r-wu",
        label: "吴",
        points: [
          [70, 360],
          [330, 340],
          [360, 470],
          [250, 560],
          [80, 540],
        ],
      },
      {
        id: "r-pass",
        label: "隘口",
        points: [
          [340, 150],
          [540, 140],
          [560, 300],
          [380, 320],
        ],
      },
      {
        id: "r-han",
        label: "汉水防线",
        points: [
          [560, 220],
          [740, 210],
          [760, 420],
          [570, 430],
        ],
      },
      {
        id: "r-ying",
        label: "楚都",
        points: [
          [760, 300],
          [940, 290],
          [950, 520],
          [750, 520],
        ],
      },
    ],
    rivers: [
      {
        id: "huai",
        points: [
          [230, 210],
          [350, 275],
          [455, 255],
          [560, 300],
        ],
      },
      {
        id: "han",
        points: [
          [700, 100],
          [688, 250],
          [742, 385],
          [720, 560],
        ],
      },
    ],
    steps: [
      {
        id: "land",
        title: "弃舟登陆",
        situation: "楚军沿汉水列阵，等着吴军从江面正面而来。",
        decision: "吴军在淮汭弃舟登岸，把水路换成山地行军，避开对方准备好的战场。",
        outcome: "楚军的沿江防线落空，吴军出现在它侧后方。",
        principleId: "void",
        units: [
          { id: "wu", label: "吴军", side: "a", x: 285, y: 350, branch: "navy" },
          { id: "chu", label: "楚军", side: "b", x: 715, y: 320, branch: "chariot" },
        ],
        moves: [{ id: "m1", from: [160, 445], kind: "advance", side: "a", to: [315, 315] }],
        held: ["r-wu"],
      },
      {
        id: "pass",
        title: "穿隘疾进",
        situation: "楚军掉头回防，队伍在汉水与隘口之间来回拉扯。",
        decision: "以一部牵制正面，主力越过大别隘口，抢在楚军合围前继续北进。",
        outcome: "主动权易手：楚军开始跟着吴军的路线走。",
        principleId: "lead",
        units: [
          { id: "wu", label: "吴军", side: "a", x: 505, y: 245, branch: "infantry" },
          { id: "chu", label: "楚军", side: "b", x: 690, y: 330, branch: "chariot" },
        ],
        moves: [
          { id: "m1", from: [315, 315], kind: "flank", side: "a", to: [525, 235] },
          { id: "m2", from: [715, 320], kind: "advance", side: "b", to: [610, 305] },
        ],
        held: ["r-wu", "r-pass"],
      },
      {
        id: "decide",
        title: "柏举决战",
        situation: "两军在柏举相接，楚军阵列尚未收拢。",
        decision: "不攻坚垒，先击阵列中最薄的一段，把决战压在对方立足未稳之时。",
        outcome: "楚军前部溃散，退路被吴军的推进切断。",
        principleId: "speed",
        units: [
          { id: "wu", label: "吴军", side: "a", x: 615, y: 370, branch: "infantry" },
          { id: "chu", label: "楚军", side: "b", x: 705, y: 395, branch: "infantry" },
        ],
        moves: [
          { id: "m1", from: [525, 235], kind: "advance", side: "a", to: [640, 380] },
          { id: "m2", from: [690, 330], kind: "feint", side: "b", to: [760, 360] },
        ],
        held: ["r-wu", "r-pass", "r-han"],
      },
      {
        id: "ying",
        title: "五战入郢",
        situation: "楚军失去序列，郢都暴露在吴军的追击线上。",
        decision: "不在战场停留清点战果，沿溃退方向连续追击。",
        outcome: "吴军五战入郢，楚都失守；速决胜负被扩展到战略结果。",
        principleId: "speed",
        units: [
          { id: "wu", label: "吴军", side: "a", x: 835, y: 425, branch: "infantry" },
          { id: "chu", label: "楚军", side: "b", x: 895, y: 490, branch: "infantry" },
        ],
        moves: [{ id: "m1", from: [640, 380], kind: "pursuit", side: "a", to: [830, 425] }],
        held: ["r-wu", "r-pass", "r-han", "r-ying"],
      },
    ],
  },
  {
    id: "guiling",
    name: "桂陵之战",
    period: "公元前354年",
    commander: "孙膑与田忌",
    summary: "齐军不赴邯郸解围，直奔魏都大梁，把围城者变成被截击者。",
    sources: "据《史记·孙子吴起列传》与《资治通鉴·周纪二》大意重绘。",
    forces: [
      { id: "qi", name: "齐军", side: "a", hint: "救赵之师" },
      { id: "wei", name: "魏军", side: "b", hint: "围邯郸之师" },
    ],
    places: [
      { id: "linzi", kind: "capital", name: "临淄", x: 150, y: 250 },
      { id: "guiling", kind: "city", name: "桂陵", x: 470, y: 175 },
      { id: "daliang", kind: "capital", name: "大梁", x: 590, y: 340 },
      { id: "handan", kind: "capital", name: "邯郸", x: 845, y: 205 },
      { id: "front", kind: "city", name: "魏军前线", x: 745, y: 255 },
    ],
    regions: [
      {
        id: "r-qi",
        label: "齐",
        points: [
          [70, 130],
          [330, 120],
          [350, 330],
          [90, 360],
        ],
      },
      {
        id: "r-guiling",
        label: "桂陵",
        points: [
          [380, 90],
          [620, 100],
          [640, 250],
          [390, 260],
        ],
      },
      {
        id: "r-wei",
        label: "魏",
        points: [
          [500, 280],
          [720, 290],
          [730, 500],
          [510, 500],
        ],
      },
      {
        id: "r-zhao",
        label: "赵",
        points: [
          [750, 100],
          [950, 110],
          [960, 300],
          [760, 290],
        ],
      },
    ],
    rivers: [
      {
        id: "huang",
        points: [
          [110, 380],
          [350, 350],
          [570, 390],
          [780, 400],
          [930, 370],
        ],
      },
    ],
    steps: [
      {
        id: "siege",
        title: "魏围邯郸",
        situation: "魏军兵临赵都，赵国向齐国求救。",
        decision: "齐军不急着自己上场，先判断魏军的软肋不在城下，而在其本国。",
        outcome: "齐军按兵不动，魏军继续把兵力压在邯郸。",
        principleId: "know",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 170, y: 255, branch: "infantry" },
          { id: "wei", label: "魏军", side: "b", x: 810, y: 220, branch: "chariot" },
        ],
        moves: [{ id: "m1", from: [700, 280], kind: "advance", side: "b", to: [825, 210] }],
        held: ["r-wei", "r-zhao"],
      },
      {
        id: "daliang",
        title: "直趋大梁",
        situation: "魏军久攻不下，后方空虚。",
        decision: "齐军绕开邯郸，直奔魏都大梁，打对方不得不回救的地方。",
        outcome: "魏军被迫撤围，赵国之围不解自解。",
        principleId: "void",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 575, y: 335, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 780, y: 245, branch: "chariot" },
        ],
        moves: [{ id: "m1", from: [180, 250], kind: "flank", side: "a", to: [585, 330] }],
        held: ["r-qi", "r-guiling"],
      },
      {
        id: "ambush",
        title: "回师截击",
        situation: "魏军昼夜回撤，齐军已先占住桂陵一线。",
        decision: "不迎着疲惫的魏军硬撞，让对方走完路程，自己以整阵待其至。",
        outcome: "魏军在桂陵被截，首尾不能相顾。",
        principleId: "wait",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 470, y: 180, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 605, y: 250, branch: "chariot" },
        ],
        moves: [
          { id: "m1", from: [780, 245], kind: "advance", side: "b", to: [600, 270] },
          { id: "m2", from: [585, 330], kind: "flank", side: "a", to: [475, 178] },
        ],
        held: ["r-qi", "r-guiling", "r-zhao"],
      },
      {
        id: "result",
        title: "桂陵解围",
        situation: "魏军阵势已乱，退路被齐军压住。",
        decision: "趁其回师未稳展开追击，把解围做成一次实实在在的歼击。",
        outcome: "魏师败于桂陵，赵围得解；「救」变成了「攻其必救」。",
        principleId: "lead",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 585, y: 200, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 700, y: 285, branch: "chariot" },
        ],
        moves: [{ id: "m1", from: [475, 178], kind: "pursuit", side: "a", to: [615, 215] }],
        held: ["r-qi", "r-guiling", "r-zhao", "r-wei"],
      },
    ],
  },
  {
    id: "maling",
    name: "马陵之战",
    period: "公元前341年",
    commander: "孙膑与田忌",
    summary: "齐军逐日减灶示弱，把庞涓诱入马陵道，再以伏兵决战。",
    sources:
      "据《史记·孙子吴起列传》与《资治通鉴·周纪二》大意重绘；马陵地望有元城、鄄城、郯城诸说，本页只作示意。",
    forces: [
      { id: "qi", name: "齐军", side: "a", hint: "示弱诱敌" },
      { id: "wei", name: "魏军", side: "b", hint: "轻装追击" },
    ],
    places: [
      { id: "linzi", kind: "capital", name: "临淄", x: 135, y: 390 },
      { id: "ruwei", kind: "city", name: "齐军入魏", x: 310, y: 345 },
      { id: "maling", kind: "pass", name: "马陵道", x: 495, y: 230 },
      { id: "xinzheng", kind: "capital", name: "新郑", x: 805, y: 300 },
      { id: "daliang", kind: "capital", name: "大梁", x: 655, y: 375 },
    ],
    regions: [
      {
        id: "r-qi",
        label: "齐",
        points: [
          [70, 290],
          [300, 280],
          [330, 480],
          [90, 520],
        ],
      },
      {
        id: "r-maling",
        label: "马陵",
        points: [
          [390, 130],
          [600, 140],
          [620, 300],
          [400, 310],
        ],
      },
      {
        id: "r-wei",
        label: "魏",
        points: [
          [560, 290],
          [760, 300],
          [770, 520],
          [570, 520],
        ],
      },
      {
        id: "r-han",
        label: "韩",
        points: [
          [760, 170],
          [950, 180],
          [960, 360],
          [770, 350],
        ],
      },
    ],
    rivers: [
      {
        id: "ji",
        points: [
          [170, 190],
          [340, 255],
          [510, 235],
          [670, 300],
          [830, 280],
        ],
      },
    ],
    steps: [
      {
        id: "han",
        title: "韩求救于齐",
        situation: "魏军攻韩，韩向齐国求救，齐军进入魏境。",
        decision: "齐军不和魏军正面决战，先把战场选在回国必经的狭道上。",
        outcome: "魏军仍按自己的节奏推进，对齐军的意图判断不清。",
        principleId: "know",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 190, y: 355, branch: "infantry" },
          { id: "wei", label: "魏军", side: "b", x: 755, y: 300, branch: "infantry" },
        ],
        moves: [{ id: "m1", from: [660, 375], kind: "advance", side: "b", to: [800, 300] }],
        held: ["r-wei", "r-han"],
      },
      {
        id: "stove",
        title: "减灶示弱",
        situation: "齐军营地灶数逐日减少，庞涓判断齐军逃亡过半。",
        decision: "把撤退做成溃退的样子，让对手放弃步兵、轻装疾追。",
        outcome: "魏军甩开后队，一头扎进孙膑算好的时间与地点。",
        principleId: "shape",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 355, y: 330, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 585, y: 320, branch: "cavalry" },
        ],
        moves: [
          { id: "m1", from: [290, 350], kind: "feint", side: "a", to: [440, 300] },
          { id: "m2", from: [755, 300], kind: "advance", side: "b", to: [600, 315] },
        ],
        held: ["r-qi", "r-wei", "r-han"],
      },
      {
        id: "maling",
        title: "马陵设伏",
        situation: "孙膑度魏军暮时当至马陵，夹道伏弩已列。",
        decision: "以道路两侧伏兵接战，把狭道本身变成兵力优势。",
        outcome: "魏军进入伏击圈，首尾被截断，阵势无从展开。",
        principleId: "wait",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 495, y: 230, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 545, y: 265, branch: "cavalry" },
        ],
        moves: [
          { id: "m1", from: [440, 300], kind: "flank", side: "a", to: [500, 232] },
          { id: "m2", from: [600, 315], kind: "advance", side: "b", to: [545, 265] },
        ],
        held: ["r-qi", "r-maling", "r-han"],
      },
      {
        id: "fall",
        title: "魏军败没",
        situation: "万弩齐发，魏军大乱，庞涓败亡。",
        decision: "不在伏击成功后收兵，顺势扩大战果，打掉魏国的机动主力。",
        outcome: "魏国由盛转衰；一场伏击改变了此后的列国格局。",
        principleId: "lead",
        units: [
          { id: "qi", label: "齐军", side: "a", x: 480, y: 235, branch: "crossbow" },
          { id: "wei", label: "魏军", side: "b", x: 620, y: 300, branch: "cavalry" },
        ],
        moves: [{ id: "m1", from: [500, 232], kind: "pursuit", side: "a", to: [625, 300] }],
        held: ["r-qi", "r-maling", "r-wei", "r-han"],
      },
    ],
  },
];
