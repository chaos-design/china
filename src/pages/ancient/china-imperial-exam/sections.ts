/** 「科举之路」的子页条目：左册目录与路由共用这一份注册表。 */
export interface ImperialExamSection {
  id: "stages" | "dynasties" | "compare";
  name: string;
  /** 目录里的短说明。 */
  scope: string;
}

export const IMPERIAL_EXAM_SECTIONS: readonly ImperialExamSection[] = [
  { id: "stages", name: "登科之阶", scope: "明清科举全程 · 七站" },
  { id: "dynasties", name: "历代官途", scope: "八朝入仕与晋升" },
  { id: "compare", name: "对照一览", scope: "一张表看官途" },
];

/** 按 id 取子页；未知 id 返回 undefined。 */
export function getImperialExamSection(sectionId: string): ImperialExamSection | undefined {
  return IMPERIAL_EXAM_SECTIONS.find((section) => section.id === sectionId);
}
