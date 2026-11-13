import { examinationsTopic } from "./examinations";
import { legalCodeTopic } from "./legal-code";
import { officialSystemTopic } from "./official-system";
import { ritesTopic } from "./rites";
import { taxationTopic } from "./taxation";
import type { InstitutionTopic } from "./types";

/**
 * 已实现的制度专题注册表：新增条目时在此追加数据文件并补一条路由
 * （routes.tsx）与索引页卡片，卡片的「筹备中」占位即可翻转为可进入。
 */
export const INSTITUTION_TOPICS: readonly InstitutionTopic[] = [
  officialSystemTopic,
  taxationTopic,
  legalCodeTopic,
  examinationsTopic,
  ritesTopic,
];

export function getInstitutionTopic(topicId: string): InstitutionTopic | undefined {
  return INSTITUTION_TOPICS.find((topic) => topic.id === topicId);
}

export type { InstitutionTopic } from "./types";
