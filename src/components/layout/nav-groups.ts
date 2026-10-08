import { HOME_ENTRY_ROUTES } from "../../pages/page-resources";

export type { MapZoneId } from "./china-map-geometry";

import type { MapZoneId } from "./china-map-geometry";

/**
 * 菜单分区。三条线索各占一块地图区域：长城与中原、丝路与江南、海南与台湾。
 *
 * 分组是硬编码的：它表达的是编辑判断（哪些内容属于同一类、该落在地图哪一块），
 * 放进资源元数据反而会让数据层承担分类职责。
 */
export interface NavLeaf {
  /** 右侧面板里的短标签，让条目不止于一句话说明。 */
  highlights: readonly string[];
  label: string;
  to: string;
}

export interface NavGroup {
  blurb: string;
  id: string;
  items: readonly NavLeaf[];
  label: string;
  mapZone: MapZoneId;
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    blurb:
      "时间与制度两条线：先看朝代怎么更替、边界怎么移动，再看每一朝把制度落在哪些机构与人物身上。长城线以下的北方与中原。",
    id: "chronology",
    items: [
      {
        highlights: ["3D 朝代浮岛", "更替节点", "民族迁徙线索"],
        label: "朝代时间长河",
        to: "/china/timeline",
      },
      {
        highlights: ["385 条政策卡片", "按朝代筛选", "机构与人物"],
        label: "朝代政策全览",
        to: "/china/policies",
      },
    ],
    label: "编年与制度",
    mapZone: "north",
  },
  {
    blurb:
      "手艺与道路：二十项非遗是向内的传承，陆海丝路是向外的往来，两条线在唐宋交汇，也是这批内容最厚的一段。",
    id: "culture",
    items: [
      {
        highlights: ["二十项传统技艺", "工序拆解", "匠人与故事"],
        label: "中华非遗瑰宝",
        to: "/intangible-culture-heritage",
      },
      {
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
        highlights: ["五卷分页", "地形剖面与投影地图", "1895—1945 日治"],
        label: "台湾专题",
        to: "/taiwan",
      },
    ],
    label: "地域与近代",
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
    if (group.items.some((item) => matches(item.to, pathname))) {
      return group.id;
    }
  }
  return undefined;
}
