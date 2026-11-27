/**
 * 资源维度的统一词表。
 *
 * 首页入口轮播与顶栏全览菜单共用这一组维度，保证「军事 / 历史 / 非物质文化遗产」
 * 在两处指向同一批内容。维度只作展示层筛选：资源 HTML 正文、标题与描述文案一律不改。
 * 未标注维度的条目在「全部」下照常出现，避免旧资源因缺字段而消失。
 */
export const RESOURCE_DIMENSIONS = ["军事", "历史", "非物质文化遗产"] as const;

export type ResourceDimension = (typeof RESOURCE_DIMENSIONS)[number];

export const ALL_RESOURCE_DIMENSIONS = "全部";

export type ResourceDimensionFilter = ResourceDimension | typeof ALL_RESOURCE_DIMENSIONS;

export const RESOURCE_DIMENSION_FILTERS: readonly ResourceDimensionFilter[] = [
  ALL_RESOURCE_DIMENSIONS,
  ...RESOURCE_DIMENSIONS,
];

/** 「全部」放行所有条目；具体维度只放行显式标注该维度的条目。 */
export function matchesResourceDimension(
  dimensions: readonly ResourceDimension[] | undefined,
  filter: ResourceDimensionFilter,
): boolean {
  return filter === ALL_RESOURCE_DIMENSIONS || Boolean(dimensions?.includes(filter));
}
