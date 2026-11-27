/** 单个制度专题的沿革阶段：一个朝代（或时期）内的一组制度形态。 */
export interface InstitutionEra {
  dynasty: string;
  /** 被什么继承或取代，一句话点出沿革去向。 */
  legacy: string;
  period: string;
  points: readonly string[];
  summary: string;
  title: string;
}

/** 关键条目：制度名、所处时期与一句话解释。 */
export interface InstitutionTerm {
  era: string;
  explanation: string;
  name: string;
}

export interface InstitutionTopic {
  description: string;
  eras: readonly InstitutionEra[];
  id: string;
  intro: string;
  keyTerms: readonly InstitutionTerm[];
  name: string;
  scope: string;
  slug: string;
}
