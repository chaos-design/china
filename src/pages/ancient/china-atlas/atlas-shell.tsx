import type { ReactNode } from "react";

export interface AtlasShellProps {
  /** 页头徽章文案，如「首批八条路线 · 汉唐宋元」。 */
  badge: string;
  /** 主内容区（地图 + 详情卡）。 */
  children: ReactNode;
  /** 页头说明。 */
  description: string;
  /** 侧栏的页内菜单，渲染在图谱导航之下、可独立滚动。 */
  menu: ReactNode;
  /** 侧栏的 aria 标签，如「迁徙路线目录」。 */
  menuLabel: string;
  /** 图谱导航：朝代断面切换按钮，不换路由就不会重挂载地图。 */
  nav: ReactNode;
  /** 页头右上角短标语。 */
  tagline: string;
  /** 页头主标题。 */
  title: string;
}

/**
 * 「历史地理图谱」统一功能页的应用式外壳：
 * - 页头（标题区）钉在顶部，不随内容滚动；
 * - 左侧菜单贴住页面左缘、全高侧栏：顶部是朝代断面切换，下方是唯一一张
 *   铺平的可折叠条目菜单（四个专题各一节，节内按朝代分组），独立滚动；
 * - 右侧为内容区，由页面自行组织（弹性分栏、区域内滚动等）。
 * 窄屏退化为纵向文档流（内容在前、菜单在后）。
 */
export function AtlasShell({
  badge,
  children,
  description,
  menu,
  menuLabel,
  nav,
  tagline,
  title,
}: AtlasShellProps) {
  return (
    <article className="flex min-h-0 flex-col lg:h-full">
      {/* 页头：钉在页头顶端，右侧内容滚动时保持可见 */}
      <header className="shrink-0 border-ink/10 border-b px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-kai text-2xl font-black text-ink sm:text-3xl">{title}</h1>
          <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-xs tracking-widest text-muted-foreground">
            {badge}
          </span>
          <span className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
            历史地理图谱 · {tagline}
          </span>
        </div>
        <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink/85">
          {description}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* 左侧菜单：贴左缘全高侧栏；图谱导航置顶，页内菜单独立滚动 */}
        <aside
          aria-label={menuLabel}
          className="flex w-full shrink-0 flex-col border-ink/10 lg:w-72 lg:border-r"
        >
          <nav aria-label="图谱导航" className="shrink-0 border-ink/10 border-b px-4 py-3">
            <p className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
              图谱导航
            </p>
            <div className="mt-1.5 flex flex-col">{nav}</div>
          </nav>
          <div className="min-h-0 flex-1 px-4 py-4 lg:overflow-y-auto">{menu}</div>
        </aside>

        {/* 右侧内容区：由页面自行组织 */}
        <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2">{children}</section>
      </div>
    </article>
  );
}
