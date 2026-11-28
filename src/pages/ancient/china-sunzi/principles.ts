import type { Principle, PrincipleId, ThreadEntry } from "./types";

export const PRINCIPLES: readonly Principle[] = [
  {
    id: "know",
    name: "知彼知己",
    quote: "知彼知己，百战不殆",
    source: "《孙子兵法·谋攻篇》",
    plain: "先看清对方的部署与将性，再决定自己的动作；情报不是背景，是决策的前提。",
  },
  {
    id: "shape",
    name: "形人而我无形",
    quote: "形人而我无形，则我专而敌分",
    source: "《孙子兵法·虚实篇》",
    plain: "让对手暴露形状，自己不露底牌；对方越是多处设防，越能在一点上形成优势。",
  },
  {
    id: "void",
    name: "避实击虚",
    quote: "兵之胜，避实而击虚",
    source: "《孙子兵法·虚实篇》",
    plain: "不与对方的坚固正面较劲，去找它不得不救、又来不及救的薄弱处。",
  },
  {
    id: "wait",
    name: "以逸待劳",
    quote: "以近待远，以佚待劳",
    source: "《孙子兵法·军争篇》",
    plain: "让对手先跑完路程，自己占住要道；体力与主动权会在会战那一刻同时兑现。",
  },
  {
    id: "speed",
    name: "兵贵神速",
    quote: "兵之情主速，乘人之不及",
    source: "《孙子兵法·九地篇》",
    plain: "速度本身就是战斗力：赶在对手完成动员之前抵达决定性的地点。",
  },
  {
    id: "lead",
    name: "致人而不致于人",
    quote: "故善战者，致人而不致于人",
    source: "《孙子兵法·虚实篇》",
    plain: "调动敌人，而不是被敌人调动；谁决定交战的时间地点，谁就掌握胜负的框架。",
  },
];

export const PRINCIPLE_BY_ID: Record<PrincipleId, Principle> = Object.fromEntries(
  PRINCIPLES.map((principle) => [principle.id, principle]),
) as Record<PrincipleId, Principle>;

/** The through-line: each battle's decisive moment, stated once and reused by the explain rail. */
export const THREAD: readonly ThreadEntry[] = [
  { battle: "柏举之战", moment: "弃舟穿隘", principleId: "speed" },
  { battle: "桂陵之战", moment: "直趋大梁", principleId: "void" },
  { battle: "马陵之战", moment: "减灶设伏", principleId: "shape" },
  { battle: "三役共有", moment: "避开正面，打其必救", principleId: "lead" },
  { battle: "三役共有", moment: "先知其将，再定其败", principleId: "know" },
  { battle: "三役共有", moment: "先到战场者先得势", principleId: "wait" },
];
