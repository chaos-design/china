import type { PolicyFigureId } from "./policy-figures";

export type GlossaryType =
  | "人物"
  | "制度"
  | "事件"
  | "政策"
  | "工程"
  | "文献"
  | "国策"
  | "机构"
  | "盛世"
  | "现象"
  | "科技"
  | "新法"
  | "货币"
  | "职官";

export interface GlossaryTerm {
  type: GlossaryType;
  title: string;
  body: string;
}

export type Glossary = Record<string, GlossaryTerm>;

export interface PolicyCard {
  title: string;
  bg?: string;
  content?: string;
  steps?: string[];
  impact?: string;
  figure?: PolicyFigureId;
  cap?: string;
}

export interface Dynasty {
  id: string;
  name: string;
  fullName: string;
  era: string;
  intro: string;
  dimensions: Record<string, PolicyCard[]>;
}
