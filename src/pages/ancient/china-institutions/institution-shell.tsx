import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { INSTITUTION_TOPICS } from "./topics";

export interface InstitutionShellProps {
  /** 当前激活的专题 id；null 表示索引/总览。 */
  activeTopicId: string | null;
  /** 页头徽章文案，如「职官 · 品级 · 央地结构」。 */
  badge: string;
  /** 右侧内容区。 */
  children: ReactNode;
  /** 页头说明。 */
  description: string;
  /** 页头主标题（总览为「典章制度索引」，专题页为条目名）。 */
  title: string;
}

interface MenuEntry {
  active: boolean;
  href: string;
  label: string;
  scope: string;
}

/**
 * 「典章制度」的应用式外壳（与图谱页 shell 同一套版式语言）：
 * - 页头钉在顶部，右侧内容滚动时保持可见；
 * - 左侧目录贴住页面左缘、全高侧栏：总览 + 已注册的五类条目，
 *   当前条目以朱色高亮并带 aria-current，窄屏退化为内容在前、目录在后的文档流；
 * - 右侧为内容区，lg 下区域内滚动（<main> 是定高 flex 项，lg:h-full 才能生效，
 *   jsdom 无法验证布局，动这块必须在真浏览器里检查）。
 */
export function InstitutionShell({
  activeTopicId,
  badge,
  children,
  description,
  title,
}: InstitutionShellProps) {
  const menuEntries: readonly MenuEntry[] = [
    {
      active: activeTopicId === null,
      href: "/china/institutions",
      label: "总览",
      scope: "五类条目索引",
    },
    ...INSTITUTION_TOPICS.map((topic) => ({
      active: topic.id === activeTopicId,
      href: `/china/institutions/${topic.slug}`,
      label: topic.name,
      scope: topic.scope,
    })),
  ];

  return (
    <article className="flex min-h-0 flex-col lg:h-full">
      <header className="shrink-0 border-ink/10 border-b px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="font-brush text-3xl text-ink sm:text-4xl">{title}</h1>
          <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-xs tracking-widest text-muted-foreground">
            {badge}
          </span>
          <span className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
            典章制度 · 编年脉络
          </span>
        </div>
        <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink/85">
          {description}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* 左侧条目目录 */}
        <nav
          aria-label="典章制度目录"
          className="flex w-full shrink-0 flex-col border-ink/10 lg:w-64 lg:border-r"
        >
          <div className="min-h-0 flex-1 px-3 py-4 lg:overflow-y-auto">
            <p className="px-1 font-body text-muted-foreground text-xs font-medium tracking-[0.3em]">
              条目导航
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {menuEntries.map((entry) => (
                <li key={entry.href}>
                  <Link
                    aria-current={entry.active ? "page" : undefined}
                    className={cn(
                      "group block rounded-md border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      entry.active
                        ? "border-vermillion/30 bg-vermillion/10"
                        : "border-transparent hover:border-vermillion/25 hover:bg-vermillion/5",
                    )}
                    to={entry.href}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "font-brush text-lg",
                          entry.active ? "text-vermillion" : "text-ink",
                        )}
                      >
                        {entry.label}
                      </span>
                      {entry.active ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full bg-vermillion"
                        />
                      ) : null}
                    </span>
                    <span className="block truncate font-body text-muted-foreground text-xs">
                      {entry.scope}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* 右侧内容区：区域内滚动 */}
        <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2">
          <div className="min-h-0 flex-1 px-4 py-6 sm:px-8 lg:overflow-y-auto lg:px-10">
            {children}
          </div>
        </section>
      </div>
    </article>
  );
}
