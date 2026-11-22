export type HomeEntryIcon =
  | "book-open"
  | "compass"
  | "landmark"
  | "map"
  | "palette"
  | "scroll-text"
  | "castle"
  | "crown"
  | "flame"
  | "gavel"
  | "globe"
  | "hammer"
  | "history"
  | "mountain"
  | "scale"
  | "shield"
  | "swords"
  | "tent"
  | "tree-pine"
  | "users"
  | "building2"
  | "file-text";

export interface HomeEntryRoute {
  description: string;
  icon: HomeEntryIcon;
  /** 针对该页面截图的读图注释，替代原先脱离上下文的「如何阅读」长段。 */
  note?: string;
  path?: string;
  /** public/home-screenshots/ 下的文件名，首页轮播用它做功能预览。 */
  screenshot?: string;
  status: "available" | "preview";
  title: string;
}

export interface AboutContentItem {
  text: string;
  title: string;
}

export interface ReadingGuideItem {
  icon: HomeEntryIcon;
  text: string;
  title: string;
}

export interface PageResourceConfig {
  aboutItems?: AboutContentItem[];
  homeEntries?: HomeEntryRoute[];
  readingGuides?: ReadingGuideItem[];
  showInHome?: boolean;
}

interface PageResourceModule {
  default: PageResourceConfig;
}

interface PageResourceBundle {
  path: string;
  resource: PageResourceConfig;
  sortKey: string;
}

const resourceModules = import.meta.glob<PageResourceModule>(
  ["./**/*.resource.ts", "./**/resource.ts"],
  {
    eager: true,
  },
);

function getResourceSortKey(path: string) {
  const pathParts = path.split("/");
  const fileName = pathParts[pathParts.length - 1] ?? path;

  if (fileName === "resource.ts") {
    return pathParts[pathParts.length - 2] ?? fileName;
  }

  return fileName.replace(/\.resource\.ts$/, "");
}

const pageResources = Object.entries(resourceModules)
  .map<PageResourceBundle>(([path, module]) => ({
    path,
    resource: module.default,
    sortKey: getResourceSortKey(path),
  }))
  .sort(
    (first, second) =>
      first.sortKey.localeCompare(second.sortKey, "zh-CN", { numeric: true }) ||
      first.path.localeCompare(second.path, "zh-CN", { numeric: true }),
  );

function collectHomeItems<T>(selectItems: (resource: PageResourceConfig) => T[] | undefined) {
  return pageResources.flatMap(({ resource }) =>
    resource.showInHome === false ? [] : (selectItems(resource) ?? []),
  );
}

function getHomeEntryOrderRank(entry: HomeEntryRoute) {
  if (entry.path && entry.status === "available") {
    return 0;
  }

  if (entry.path) {
    return 1;
  }

  if (entry.status === "available") {
    return 2;
  }

  return 3;
}

export const HOME_ENTRY_ROUTES = collectHomeItems((resource) => resource.homeEntries).sort(
  (first, second) => getHomeEntryOrderRank(first) - getHomeEntryOrderRank(second),
);
