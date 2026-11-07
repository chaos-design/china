import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { ATLAS_TOPICS } from "./topics";
import type { AtlasTopic } from "./types";

export interface AtlasShellProps {
  /** 页头徽章文案，如「首批八条路线 · 汉唐宋元」。 */
  badge: string;
  /** 主内容区（地图 + 详情卡）。 */
  children: ReactNode;
  /** 侧栏的页内菜单（如按朝代分组的条目），渲染在图谱导航之下、可独立滚动。 */
  menu: ReactNode;
  /** 侧栏的 aria 标签，如「迁徙路线目录」。 */
  menuLabel: string;
  /** 当前页对应的图谱主题。 */
  topic: AtlasTopic;
}

/**
 * 「疆域与民族图谱」各内容页共享的应用式外壳：
 * - 页头（标题区）钉在页头顶端，不随内容滚动；
 * - 左侧菜单贴住页面左缘、全高侧栏：顶部是三条图谱主题的导航
 *   （在页面之间切换时菜单始终在场，不丢失），下方是本页自己的条目菜单，
 *   独立滚动；
 * - 右侧为内容区，由各页自行组织（弹性分栏、区域内滚动等）。
 * 窄屏退化为纵向文档流（内容在前、菜单在后）。
 */
export function AtlasShell({ badge, children, menu, menuLabel, topic }: AtlasShellProps) {
  return (
    <article className="flex min-h-0 flex-col lg:h-full">
      {/* 页头：钉在页头顶端，右侧内容滚动时保持可见 */}
      <header className="shrink-0 border-ink/10 border-b px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-kai text-2xl font-black text-ink sm:text-3xl">{topic.label}</h1>
          <span
            className={cn(
              "rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5",
              "font-body text-xs tracking-widest text-muted-foreground",
            )}
          >
            {badge}
          </span>
          <span className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
            疆域与民族图谱 · {topic.tagline}
          </span>
        </div>
        <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink/85">
          {topic.description}
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
            <div className="mt-1.5 flex flex-col">
              {ATLAS_TOPICS.map((candidate) => {
                const isCurrent = candidate.id === topic.id;
                return (
                  <NavLink
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "-mx-2 rounded-lg px-2 py-2 font-kai text-base transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isCurrent
                        ? "bg-vermillion/10 font-bold text-ink"
                        : "text-ink/80 hover:bg-ink/4 hover:text-primary",
                    )}
                    key={candidate.id}
                    to={candidate.path}
                  >
                    {candidate.label}
                    <span className="ml-2 font-body text-xs text-muted-foreground">
                      {candidate.tagline}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
          <div className="min-h-0 flex-1 px-4 py-4 lg:overflow-y-auto">{menu}</div>
        </aside>

        {/* 右侧内容区：由各页自行组织 */}
        <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2">{children}</section>
      </div>
    </article>
  );
}
