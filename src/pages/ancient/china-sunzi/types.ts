import type { BoardPoint } from "./board-geometry";

export type Side = "a" | "b";

export type PrincipleId = "know" | "shape" | "void" | "wait" | "speed" | "lead";

export interface ForceMeta {
  id: string;
  name: string;
  side: Side;
  /**  qualitative hint, never a troop count */
  hint: string;
}

export interface Place {
  id: string;
  kind: "capital" | "city" | "pass";
  name: string;
  x: number;
  y: number;
}

export interface Region {
  id: string;
  label: string;
  points: readonly BoardPoint[];
}

export interface River {
  id: string;
  points: readonly BoardPoint[];
}

export type UnitBranch = "infantry" | "chariot" | "cavalry" | "crossbow" | "navy";

export const BRANCH_LABEL: Record<UnitBranch, string> = {
  cavalry: "骑兵",
  chariot: "车兵",
  crossbow: "弩手",
  infantry: "步卒",
  navy: "水师",
};

export interface Unit {
  branch: UnitBranch;
  id: string;
  label: string;
  side: Side;
  x: number;
  y: number;
}

export interface Move {
  id: string;
  from: BoardPoint;
  kind: "advance" | "flank" | "feint" | "pursuit";
  side: Side;
  to: BoardPoint;
}

export interface BattleStep {
  id: string;
  title: string;
  situation: string;
  decision: string;
  outcome: string;
  principleId: PrincipleId;
  units: readonly Unit[];
  moves: readonly Move[];
  /** region ids held by side a; every other region is held by side b */
  held: readonly string[];
}

export interface BattleScenario {
  id: string;
  name: string;
  period: string;
  commander: string;
  summary: string;
  /** verified primary sources for this battle, shown in the reading rail */
  sources: string;
  forces: readonly ForceMeta[];
  places: readonly Place[];
  regions: readonly Region[];
  rivers: readonly River[];
  steps: readonly BattleStep[];
}

export interface Principle {
  id: PrincipleId;
  name: string;
  plain: string;
  quote: string;
  source: string;
}

export interface ThreadEntry {
  battle: string;
  moment: string;
  principleId: PrincipleId;
}
