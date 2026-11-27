import type { ResourceDimension } from "../../lib/resource-dimensions";
import { HOME_ENTRY_ROUTES } from "../../pages/page-resources";

export type { MapZoneId } from "./china-map-geometry";

import type { MapZoneId } from "./china-map-geometry";

/**
 * 菜单分区。沿用「编年 / 疆域 / 文化 / 区域」四条线索，各占一块地图区域。
 *
 * 分组是硬编码的：它表达的是编辑判断（哪些内容属于同一类、该落在地图哪一块），
 * 放进资源元数据反而会让数据层承担分类职责。
 *
 * 扩展约定（后续新增专题时按此办，不要为单个条目新建分组）：
 * - 在对应分组的 items 里追加一条 NavLeaf，路径必须在首页资源里可用；
 * - 新分组只需在此数组追加一个 NavGroup，列数由 site-menu 的
 *   --mega-column-count 驱动，地图高亮由 mapZone 决定，无需改布局代码；
 * - 组名表达「内容对象」，条目名表达「读什么」，两者不得同名词（旧「历史地理」
 *   组与「历史地理图谱」条目重名已按此纠正）。
 */
export interface NavLeaf {
  /** 与首页入口共用的展示维度，菜单按它筛选；缺省条目只在「全部」中出现。 */
  dimensions?: readonly ResourceDimension[];
  /** 右侧面板里的短标签，让条目不止于一句话说明。 */
  highlights: readonly string[];
  label: string;
  to: string;
}

export interface NavGroup {
  /**
   * 只用于判定「当前分组」的路径，不在菜单里渲染链接。
   * 兼容入口（如图谱预设图层、职官制度三个子视图）收敛成一个菜单条目后仍要高亮所属分组。
   */
  activePaths?: readonly string[];
  blurb: string;
  id: string;
  items: readonly NavLeaf[];
  label: string;
  mapZone: MapZoneId;
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    activePaths: [
      "/china/officials/evolution",
      "/china/officials/structure",
      "/china/officials/grades",
      "/china/institutions/taxation",
      "/china/institutions/legal-code",
      "/china/institutions/examinations",
      "/china/institutions/rites",
      "/china/imperial-exam/stages",
      "/china/imperial-exam/dynasties",
      "/china/imperial-exam/compare",
    ],
    blurb:
      "时间与制度两条线：先看朝代怎么更替、边界怎么移动，再看每一朝把制度落在哪些机构与人物身上。长城线以下的北方与中原。",
    id: "chronology",
    items: [
      {
        dimensions: ["历史"],
        highlights: ["3D 朝代浮岛", "更替节点", "民族迁徙线索"],
        label: "历代编年长河",
        to: "/china/timeline",
      },
      {
        dimensions: ["历史", "军事"],
        highlights: ["385 条政策卡片", "按朝代筛选", "机构与人物"],
        label: "历代治国政策",
        to: "/china/policies",
      },
      {
        dimensions: ["历史"],
        highlights: ["沿革 / 职官树 / 品级三视图", "八朝官署与名录", "品秩礼制与章服"],
        label: "职官制度",
        to: "/china/officials",
      },
      {
        dimensions: ["历史"],
        highlights: ["赋役律令科举礼制", "编年沿革", "关键条目表"],
        label: "制度沿革",
        to: "/china/institutions",
      },
      {
        dimensions: ["历史"],
        highlights: ["明清登科全阶", "历代入仕途径", "真实官员履历"],
        label: "科举与仕途",
        to: "/china/imperial-exam",
      },
    ],
    label: "编年与制度",
    mapZone: "north",
  },
  {
    activePaths: ["/china/atlas/territory", "/china/atlas/migration", "/china/atlas/frontier"],
    blurb: "疆域、民族与边疆三条线索合为一张图谱，页内按专题与朝代逐项展开。",
    id: "atlas",
    items: [
      {
        dimensions: ["历史", "军事"],
        highlights: ["三类图谱同图", "按朝代切换疆域", "选中局部放大"],
        label: "疆域与民族图谱",
        to: "/china/atlas",
      },
    ],
    label: "疆域与民族",
    mapZone: "north",
  },
  {
    blurb:
      "手艺与道路：二十项非遗是向内的传承，陆海丝路是向外的往来，两条线在唐宋交汇，也是这批内容最厚的一段。",
    id: "culture",
    items: [
      {
        dimensions: ["非物质文化遗产", "历史"],
        highlights: ["二十项传统技艺", "工序拆解", "匠人与故事"],
        label: "中华非遗技艺",
        to: "/intangible-culture-heritage",
      },
      {
        dimensions: ["历史"],
        highlights: ["陆上丝路", "海上丝路", "海疆经略"],
        label: "丝绸之路与海疆",
        to: "/silk-road",
      },
    ],
    label: "文化与交通",
    mapZone: "culture",
  },
  {
    blurb:
      "一座岛的地形决定了它的走向：中央山脉把岛切成两半，海峡让它自成一体。从大坌坑到甲午割台，再到日治五十年。",
    id: "region",
    items: [
      {
        dimensions: ["历史"],
        highlights: ["五卷分页", "地形剖面与投影地图", "1895—1945 日治"],
        label: "台湾史地",
        to: "/taiwan",
      },
      {
        dimensions: ["军事", "历史"],
        highlights: ["四阶段时间轴", "战役地点与解放区", "进军箭头与行军路线"],
        label: "解放战争沙盘",
        to: "/liberation-war",
      },
    ],
    label: "区域与近代",
    mapZone: "islands",
  },
];

// 只收录首页已经开放、且能解析出路径的条目。
// showInHome: false 与 status: "preview" 的资源不进菜单——
// 未开放的内容不应该出现在导航里，也不应该被键盘 Tab 到。
const AVAILABLE_PATHS = new Set(
  HOME_ENTRY_ROUTES.filter(
    (entry): entry is typeof entry & { path: string; status: "available" } =>
      entry.status === "available" && typeof entry.path === "string",
  ).map((entry) => entry.path),
);

// 校验：分组里出现的路径必须真的有对应资源，否则这条菜单是死链。
for (const group of NAV_GROUPS) {
  for (const item of group.items) {
    if (item.to.startsWith("/china/")) continue;
    if (!AVAILABLE_PATHS.has(item.to)) {
      throw new Error(`导航项 ${group.id}/${item.to} 没有对应的可用资源`);
    }
  }
  if (group.items.length === 0) {
    throw new Error(`导航分组 ${group.id} 没有任何条目`);
  }
}

/** 找到拥有当前路由的分组 id。没有对应分组时返回 undefined（例如首页与 404）。 */
export function findNavGroupId(
  pathname: string,
  matches: (path: string, pathname: string) => boolean,
): string | undefined {
  for (const group of NAV_GROUPS) {
    if (
      group.items.some((item) => matches(item.to, pathname)) ||
      group.activePaths?.some((path) => matches(path, pathname))
    ) {
      return group.id;
    }
  }
  return undefined;
}
