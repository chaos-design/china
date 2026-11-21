/**
 * 「科举之路」的数据模型：登科阶梯（明清全程）与逐朝官途
 * （入仕途径 + 晋升机制 + 履历样本）。
 */

/** 入仕途径的门类，决定途径卡上的门类章颜色。 */
export type EntranceKind =
  | "exam"
  | "recommend"
  | "inherit"
  | "merit"
  | "purchase"
  | "clerk"
  | "school";

export const ENTRANCE_KIND_LABELS: Record<EntranceKind, string> = {
  exam: "考试",
  recommend: "荐举",
  inherit: "世荫",
  merit: "军功",
  purchase: "捐纳",
  clerk: "吏途",
  school: "学校",
};

/** 一条入仕途径：先说明门类，再讲清怎么走。 */
export interface EntranceRoute {
  kind: EntranceKind;
  name: string;
  detail: string;
}

/** 晋升机制：考课、磨勘、铨选这一类「怎么上去」的规则。 */
export interface PromotionMechanism {
  name: string;
  detail: string;
}

/** 履历样本中的一步：年份 + 官职（身份）+ 补注。 */
export interface CareerStep {
  year: string;
  role: string;
  note?: string;
}

/** 一个朝代的完整官途画像。 */
export interface DynastyPath {
  id: string;
  name: string;
  period: string;
  /** 一句话特征，对照表里复用。 */
  headline: string;
  /** 怎么做官：入仕之门。 */
  entry: {
    summary: string;
    routes: EntranceRoute[];
  };
  /** 怎么晋升：迁转之阶。 */
  promotion: {
    summary: string;
    mechanisms: PromotionMechanism[];
    /** 一条典型迁转路线，首项是起点、末项是终点。 */
    ladder: string[];
  };
  /** 履历样本：一位真实官员的仕途，出处必须落在正史本传。 */
  career: {
    subject: string;
    subjectIntro: string;
    source: string;
    steps: CareerStep[];
  };
  /** 本朝身份关键词。 */
  terms: { name: string; explanation: string }[];
  sources: string[];
}

/** 页头年份里程碑，与典章制度「科举」条目同一口径。 */
export interface ExamMilestone {
  year: string;
  event: string;
}
