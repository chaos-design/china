import type { BoardPoint } from "./board-geometry";
import type { BattleStep, MapScene, PrincipleId, River, Unit, UnitBranch } from "./types";

/**
 * 三十六计的沙盘不是史书里的某一场战斗：除柏举、桂陵、马陵三役外，
 * 其余各计按原书的用兵机理生成一张军事沙盘（地形、布阵、示形、决胜、收局）。
 * 页面明确标为「机理示意」，不冒充战史复原，也不编造兵力数字与坐标考据。
 */
type PatternId =
  | "feint"
  | "rescue"
  | "proxy"
  | "wait"
  | "exploit"
  | "flank"
  | "sacrifice"
  | "probe"
  | "retreat"
  | "encircle"
  | "ally"
  | "infiltrate";

interface Pattern {
  name: string;
  terrain: "plain" | "river" | "mountain" | "city";
  feint: BoardPoint;
  main: BoardPoint;
  reply: BoardPoint;
  branch: UnitBranch;
  phases: readonly [string, string, string];
  principle: PrincipleId;
}

const P: Record<PatternId, Pattern> = {
  feint: {
    name: "声东击西",
    terrain: "plain",
    feint: [0.34, 0.24],
    main: [0.68, 0.55],
    reply: [0.42, 0.3],
    branch: "cavalry",
    phases: [
      "先在一翼张扬旗鼓，把敌方注意引向假方向。",
      "主力从另一侧穿过要冲，插入敌方侧后。",
      "假象撤销时敌方已回救不及，布势就此崩解。",
    ],
    principle: "shape",
  },
  rescue: {
    name: "攻其必救",
    terrain: "city",
    feint: [0.5, 0.7],
    main: [0.72, 0.3],
    reply: [0.6, 0.42],
    branch: "chariot",
    phases: [
      "不直接解围，先确认敌方不得不救的要点。",
      "轻兵疾趋该点，迫使对方撤开原有正面。",
      "回师途中截击，围自解而敌自弊。",
    ],
    principle: "void",
  },
  proxy: {
    name: "借势于第三力",
    terrain: "city",
    feint: [0.4, 0.3],
    main: [0.66, 0.36],
    reply: [0.5, 0.5],
    branch: "chariot",
    phases: [
      "敌方已明，先辨明第三方尚未定下的态度。",
      "以行动引导第三方出手，己方保存实力。",
      "敌方被两面牵制，局势自然转向。",
    ],
    principle: "lead",
  },
  wait: {
    name: "以静制动",
    terrain: "river",
    feint: [0.42, 0.5],
    main: [0.6, 0.62],
    reply: [0.7, 0.4],
    branch: "infantry",
    phases: [
      "先占住通路，不急着与对方决战。",
      "让对方走完路程、消耗锐气，再整阵相接。",
      "劳逸易位，胜势在会战一刻兑现。",
    ],
    principle: "wait",
  },
  exploit: {
    name: "乘隙取利",
    terrain: "plain",
    feint: [0.36, 0.4],
    main: [0.7, 0.48],
    reply: [0.6, 0.56],
    branch: "cavalry",
    phases: [
      "敌方内部出现裂痕，先看清漏洞所在。",
      "以快兵切入其最弱的一段，不与其主力纠缠。",
      "小隙累积成大势，动作即告完成。",
    ],
    principle: "void",
  },
  flank: {
    name: "迂回偷渡",
    terrain: "river",
    feint: [0.44, 0.36],
    main: [0.7, 0.44],
    reply: [0.54, 0.4],
    branch: "navy",
    phases: [
      "故意留在正面，让对方以为攻击方向不变。",
      "主力从对方想不到的道路绕到其后。",
      "正面与侧后同时压上，防线失去意义。",
    ],
    principle: "void",
  },
  sacrifice: {
    name: "舍局部以全势",
    terrain: "mountain",
    feint: [0.3, 0.46],
    main: [0.64, 0.36],
    reply: [0.5, 0.34],
    branch: "infantry",
    phases: [
      "计算必然的损失，选定可舍弃的一角。",
      "用局部牵制换取全局的空间与时间。",
      "换取的目标达成，局部代价不再追耗。",
    ],
    principle: "void",
  },
  probe: {
    name: "先探后动",
    terrain: "mountain",
    feint: [0.4, 0.28],
    main: [0.64, 0.5],
    reply: [0.56, 0.44],
    branch: "crossbow",
    phases: [
      "有疑先侦察，不凭臆测发兵。",
      "以试探性动作引出对方真实部署。",
      "摸清底细后主力才进入决定性位置。",
    ],
    principle: "know",
  },
  retreat: {
    name: "全师而退",
    terrain: "river",
    feint: [0.36, 0.6],
    main: [0.5, 0.72],
    reply: [0.62, 0.6],
    branch: "navy",
    phases: [
      "形势不利时先保住建制，不被迫决战。",
      "退却中保持阵形，让对方追不到把柄。",
      "脱离接触，留待下一次有利时机。",
    ],
    principle: "lead",
  },
  encircle: {
    name: "围而歼之",
    terrain: "plain",
    feint: [0.4, 0.34],
    main: [0.7, 0.46],
    reply: [0.66, 0.56],
    branch: "cavalry",
    phases: [
      "先断其退路，不使其突围远逸。",
      "两面合围，把对方压在有限空间里。",
      "包围圈收拢，战斗在预先选定的地点结束。",
    ],
    principle: "lead",
  },
  ally: {
    name: "远交近攻",
    terrain: "city",
    feint: [0.34, 0.3],
    main: [0.62, 0.44],
    reply: [0.7, 0.34],
    branch: "chariot",
    phases: [
      "先稳住远处，避免多线同时受敌。",
      "集中力量攻取相邻的目标。",
      "近处得手后，远方的格局随之改变。",
    ],
    principle: "void",
  },
  infiltrate: {
    name: "易形而入",
    terrain: "city",
    feint: [0.38, 0.42],
    main: [0.72, 0.4],
    reply: [0.58, 0.52],
    branch: "infantry",
    phases: [
      "先改变自己的形态，使对方放松戒备。",
      "趁间隙插足，控制对方的关节。",
      "由客变主，主动权转移而不经大战。",
    ],
    principle: "shape",
  },
};

const STRATAGEM_PATTERN: Readonly<Record<number, PatternId>> = {
  1: "feint",
  2: "rescue",
  3: "proxy",
  4: "wait",
  5: "exploit",
  6: "feint",
  7: "infiltrate",
  8: "flank",
  9: "wait",
  10: "feint",
  11: "sacrifice",
  12: "exploit",
  13: "probe",
  14: "proxy",
  15: "probe",
  16: "probe",
  17: "probe",
  18: "rescue",
  19: "sacrifice",
  20: "exploit",
  21: "retreat",
  22: "encircle",
  23: "ally",
  24: "flank",
  25: "infiltrate",
  26: "infiltrate",
  27: "feint",
  28: "sacrifice",
  29: "feint",
  30: "infiltrate",
  31: "feint",
  32: "feint",
  33: "infiltrate",
  34: "feint",
  35: "encircle",
  36: "retreat",
};

export const PATTERN_LABEL: Record<PatternId, string> = Object.fromEntries(
  Object.entries(P).map(([id, pattern]) => [id, pattern.name]),
) as Record<PatternId, string>;

export function patternOf(number: number): PatternId {
  return STRATAGEM_PATTERN[number] ?? "feint";
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(point: BoardPoint, jitter: () => number): BoardPoint {
  return [
    Math.round(point[0] * 1000 + (jitter() - 0.5) * 18),
    Math.round(point[1] * 640 + (jitter() - 0.5) * 18),
  ];
}

const A_START: BoardPoint = [0.2, 0.62];
const A_RESERVE: BoardPoint = [0.16, 0.74];
const B_START: BoardPoint = [0.76, 0.44];
const B_RESERVE: BoardPoint = [0.82, 0.58];

const REGIONS = [
  {
    id: "r-west",
    label: "左阵",
    points: [
      [60, 360],
      [360, 330],
      [400, 540],
      [100, 580],
    ],
  },
  {
    id: "r-center",
    label: "要冲",
    points: [
      [380, 200],
      [640, 190],
      [660, 450],
      [390, 470],
    ],
  },
  {
    id: "r-north",
    label: "隘口",
    points: [
      [420, 80],
      [620, 80],
      [640, 210],
      [430, 220],
    ],
  },
  {
    id: "r-east",
    label: "右阵",
    points: [
      [660, 250],
      [950, 230],
      [960, 520],
      [670, 500],
    ],
  },
] as const;

function terrainRivers(terrain: Pattern["terrain"]): River[] {
  if (terrain === "river" || terrain === "plain") {
    return [
      {
        id: "main-river",
        points: [
          [80, 300],
          [300, 330],
          [520, 300],
          [760, 340],
          [940, 300],
        ] as BoardPoint[],
      },
    ];
  }
  return [
    {
      id: "main-ridge",
      points: [
        [140, 240],
        [340, 200],
        [540, 250],
        [740, 210],
        [920, 260],
      ] as BoardPoint[],
    },
  ];
}

function terrainPlaces(terrain: Pattern["terrain"]) {
  const suffix = terrain === "mountain" ? "山道" : terrain === "river" ? "渡口" : "要道";
  return [
    { id: "a-camp", kind: "capital", name: "本营", x: 190, y: 400 },
    { id: "cross", kind: "city", name: suffix, x: 510, y: 330 },
    { id: "b-camp", kind: "capital", name: "敌营", x: 790, y: 280 },
    { id: "pass", kind: "pass", name: "隘口", x: 520, y: 150 },
  ] as const;
}

/** Generated once per stratagem; pure inputs, deterministic output. */
export function buildStratagemScene(number: number, name: string): MapScene {
  const pattern = P[patternOf(number)];
  const jitter = mulberry32(number * 2654435761);
  const startA = normalize(A_START, jitter);
  const reserveA = normalize(A_RESERVE, jitter);
  const startB = normalize(B_START, jitter);
  const reserveB = normalize(B_RESERVE, jitter);
  const feint = normalize(pattern.feint, jitter);
  const main = normalize(pattern.main, jitter);
  const reply = normalize(pattern.reply, jitter);

  const forces = [
    { id: "a", name: "我军", side: "a" as const, hint: "主动一方" },
    { id: "b", name: "敌军", side: "b" as const, hint: "被动一方" },
  ];
  const unitsA = [
    { id: "a", label: "我军", side: "a" as const, branch: "infantry" as const },
    { id: "a2", label: "奇兵", side: "a" as const, branch: pattern.branch },
  ];
  const unitsB = [
    { id: "b", label: "敌军", side: "b" as const, branch: "chariot" as const },
    { id: "b2", label: "守军", side: "b" as const, branch: "infantry" as const },
  ];

  const makeStep = (
    id: string,
    title: string,
    situation: string,
    decision: string,
    outcome: string,
    units: readonly Unit[],
    moves: BattleStep["moves"],
    held: readonly string[],
  ): BattleStep => ({
    id,
    title,
    situation,
    decision,
    outcome,
    principleId: pattern.principle,
    units,
    moves,
    held,
  });

  return {
    id: `stratagem-${number}`,
    name,
    forces,
    regions: REGIONS.map((region) => ({
      ...region,
      points: region.points as unknown as BoardPoint[],
    })),
    rivers: terrainRivers(pattern.terrain),
    places: terrainPlaces(pattern.terrain).map((place) => ({ ...place })),
    steps: [
      makeStep(
        "formation",
        "布势",
        `两军沿${pattern.name}所需的地形相持，先看清通路与退路。`,
        `按「${name}」的机理布阵，取得先手的一方尚未出手。`,
        "阵势展开，主动权尚未分出。",
        [
          { ...unitsA[0], x: startA[0], y: startA[1] },
          { ...unitsA[1], x: reserveA[0], y: reserveA[1] },
          { ...unitsB[0], x: startB[0], y: startB[1] },
          { ...unitsB[1], x: reserveB[0], y: reserveB[1] },
        ],
        [],
        ["r-west"],
      ),
      makeStep(
        "signal",
        "示形",
        pattern.phases[0],
        `以机动制造对方判断上的偏差，这是「${name}」的第一层。`,
        "对方被假象牵动，阵形出现缝隙。",
        [
          { ...unitsA[0], x: startA[0], y: startA[1] },
          { ...unitsA[1], x: feint[0], y: feint[1] },
          { ...unitsB[0], x: startB[0], y: startB[1] },
          { ...unitsB[1], x: reserveB[0], y: reserveB[1] },
        ],
        [{ id: "m1", from: reserveA, kind: "feint", side: "a", to: feint }],
        ["r-west"],
      ),
      makeStep(
        "decisive",
        "决胜",
        pattern.phases[1],
        `主力切入要冲，把「${name}」的机理落到兵力移动上。`,
        "要冲易手，敌方退路受制。",
        [
          { ...unitsA[0], x: main[0], y: main[1] },
          { ...unitsA[1], x: feint[0], y: feint[1] },
          { ...unitsB[0], x: reply[0], y: reply[1] },
          { ...unitsB[1], x: reserveB[0], y: reserveB[1] },
        ],
        [
          { id: "m1", from: startA, kind: "advance", side: "a", to: main },
          { id: "m2", from: startB, kind: "advance", side: "b", to: reply },
        ],
        ["r-west", "r-center"],
      ),
      makeStep(
        "settle",
        "收局",
        pattern.phases[2],
        `顺势扩大战果，让「${name}」的效果在地图上看得见。`,
        "敌方失去布势，计谋收效。",
        [
          { ...unitsA[0], x: startB[0], y: startB[1] },
          { ...unitsA[1], x: main[0], y: main[1] },
          { ...unitsB[0], x: reserveB[0], y: reserveB[1] },
          { ...unitsB[1], x: reserveB[0], y: reserveB[1] + 30 },
        ],
        [
          { id: "m1", from: main, kind: "pursuit", side: "a", to: startB },
          { id: "m2", from: feint, kind: "advance", side: "a", to: main },
        ],
        ["r-west", "r-center", "r-north", "r-east"],
      ),
    ],
  };
}

const SCENE_CACHE = new Map<number, MapScene>();

export function stratagemScene(number: number, name: string): MapScene {
  const cached = SCENE_CACHE.get(number);
  if (cached) return cached;
  const scene = buildStratagemScene(number, name);
  SCENE_CACHE.set(number, scene);
  return scene;
}
