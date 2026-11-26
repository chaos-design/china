/**
 * 维度直接取自顶栏「全览地图」的既有四个分组：分组 id 就是维度 id，分组名就是维度名。
 *
 * 这样「按维度浏览」等价于「按菜单分组浏览」：首页入口按它对应的菜单项标注维度，
 * 菜单自身按分组 id 过滤。两处共用同一份词表与标签，不再另造分类。
 * 维度只是展示层筛选，HTML 资源正文与既有页面文案都不改。
 */

/** 分组名是维度的唯一来源，菜单列标题与筛选按钮都读这里。 */
export const RESOURCE_DIMENSION_LABELS = {
  atlas: "历史地理",
  chronology: "编年与制度",
  culture: "文化与交通",
  region: "地域与近代",
} as const;

export type ResourceDimensionId = keyof typeof RESOURCE_DIMENSION_LABELS;

export const RESOURCE_DIMENSIONS: readonly ResourceDimensionId[] = [
  "chronology",
  "atlas",
  "culture",
  "region",
];

export const ALL_RESOURCE_DIMENSIONS = "all";

export type ResourceDimensionFilter = ResourceDimensionId | typeof ALL_RESOURCE_DIMENSIONS;

export interface ResourceDimensionOption {
  id: ResourceDimensionFilter;
  label: string;
}

/** 「全览」对应全部内容；其余选项与菜单四列同名同序。 */
export const RESOURCE_DIMENSION_FILTERS: readonly ResourceDimensionOption[] = [
  { id: ALL_RESOURCE_DIMENSIONS, label: "全览" },
  ...RESOURCE_DIMENSIONS.map((id) => ({ id, label: RESOURCE_DIMENSION_LABELS[id] })),
];

/** 「全览」放行所有条目；具体维度只放行显式标注该分组的条目。 */
export function matchesResourceDimension(
  dimensions: readonly ResourceDimensionId[] | undefined,
  filter: ResourceDimensionFilter,
): boolean {
  return filter === ALL_RESOURCE_DIMENSIONS || Boolean(dimensions?.includes(filter));
}

/** 菜单分组按 id 参与同一套筛选。 */
export function matchesResourceDimensionId(
  groupId: ResourceDimensionId,
  filter: ResourceDimensionFilter,
): boolean {
  return filter === ALL_RESOURCE_DIMENSIONS || groupId === filter;
}
