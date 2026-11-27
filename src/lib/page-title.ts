/** 浏览器标签标题：页面切换时随之变化，末段统一落到站名。 */
export const SITE_TITLE = "中国古代全览";

const ROUTE_TITLES: Readonly<Record<string, string>> = {
  "/": `${SITE_TITLE} · 水墨编年`,
  "/china": `时间长河 · ${SITE_TITLE}`,
  "/china/timeline": `时间长河 · ${SITE_TITLE}`,
  "/china/policies": `政策全览 · ${SITE_TITLE}`,
  "/china/atlas": `疆域与民族图谱 · ${SITE_TITLE}`,
  "/china/atlas/territory": `疆域变迁 · ${SITE_TITLE}`,
  "/china/atlas/migration": `民族迁徙 · ${SITE_TITLE}`,
  "/china/atlas/frontier": `边疆治理 · ${SITE_TITLE}`,
  "/china/officials": `职官制度 · ${SITE_TITLE}`,
  "/china/officials/structure": `职官图谱 · ${SITE_TITLE}`,
  "/china/officials/grades": `品级对照 · ${SITE_TITLE}`,
  "/china/institutions": `制度沿革 · ${SITE_TITLE}`,
  "/china/imperial-exam": `科举与仕途 · ${SITE_TITLE}`,
  "/china/sunzi-bingfa": `孙子兵法沙盘 · ${SITE_TITLE}`,
};

const PREFIX_TITLES: ReadonlyArray<readonly [string, string]> = [
  ["/china/institutions/", `制度沿革 · ${SITE_TITLE}`],
  ["/china/imperial-exam/", `科举与仕途 · ${SITE_TITLE}`],
];

/**
 * 由路径解析标签标题。HTML 资源页把 metadata 里的条目名作为 `resourceTitle` 传入，
 * 避免让这里依赖代码分割后的 HTML 正文；未收录的路径一律落到 404 标题。
 */
export function pageTitleForPath(pathname: string, resourceTitle?: string): string {
  const exact = ROUTE_TITLES[pathname];
  if (exact) return exact;

  for (const [prefix, title] of PREFIX_TITLES) {
    if (pathname.startsWith(prefix)) return title;
  }

  if (resourceTitle) return `${resourceTitle} · ${SITE_TITLE}`;
  return `页面未找到 · ${SITE_TITLE}`;
}

/** 只在真正变化时写 DOM，避免同值覆盖打断页面内更细粒度的标题。 */
export function setDocumentTitle(title: string): void {
  if (typeof document === "undefined" || document.title === title) return;
  document.title = title;
}
