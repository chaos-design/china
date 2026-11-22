import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { EXAM_MILESTONES } from "./ladder";
import { IMPERIAL_EXAM_SECTIONS } from "./sections";

export interface ImperialExamShellProps {
  /** 当前激活的子页 id（stages / dynasties / compare）。 */
  activeSectionId: string;
  /** 右侧内容区。 */
  children: ReactNode;
  /** 页头说明。 */
  description: string;
}

/**
 * 「科举之路」的应用式外壳（与典章制度/图谱页同一套版式语言）：
 * - 页头钉在顶部（标题 + 徽章 + 说明 + 制度里程碑），右侧内容滚动时保持可见；
 * - 左侧子页目录贴住页面左缘、全高侧栏，当前条目朱色高亮并带 aria-current；
 * - 右侧为内容区，lg 下区域内滚动（<main> 是定高 flex 项，lg:h-full 才能生效，
 *   jsdom 无法验证布局，动这块必须在真浏览器里检查），窄屏退化为文档流。
 */
export function ImperialExamShell({
  activeSectionId,
  children,
  description,
}: ImperialExamShellProps) {
  return (
    <article className="flex min-h-0 flex-col lg:h-full">
      <header className="shrink-0 border-ink/10 border-b px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="font-brush text-3xl text-ink sm:text-4xl">科举之路</h1>
          <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-muted-foreground text-xs tracking-widest">
            入仕 · 晋升 · 官途
          </span>
          <span className="font-body font-medium text-vermillion text-xs tracking-[0.3em]">
            官制专题 · 编年脉络
          </span>
        </div>
        <p className="mt-2 max-w-3xl font-body text-ink/85 text-sm leading-relaxed">
          {description}
        </p>
        <ul aria-label="制度里程碑" className="mt-3 flex flex-wrap gap-2">
          {EXAM_MILESTONES.map((milestone) => (
            <li
              className="rounded-md border border-ink/10 bg-card/80 px-3 py-1.5 font-mono-tech text-muted-foreground text-xs tracking-[0.12em]"
              key={milestone.year}
            >
              <span className="text-vermillion">{milestone.year}</span>
              <span aria-hidden="true"> · </span>
              {milestone.event}
            </li>
          ))}
        </ul>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* 左侧子页目录 */}
        <nav
          aria-label="科举之路目录"
          className="flex w-full shrink-0 flex-col border-ink/10 lg:w-64 lg:border-r"
        >
          <div className="min-h-0 flex-1 px-3 py-4 lg:overflow-y-auto">
            <p className="px-1 font-body font-medium text-muted-foreground text-xs tracking-[0.3em]">
              条目导航
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {IMPERIAL_EXAM_SECTIONS.map((section) => {
                const active = section.id === activeSectionId;

                return (
                  <li key={section.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group block rounded-md border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active
                          ? "border-vermillion/30 bg-vermillion/10"
                          : "border-transparent hover:border-vermillion/25 hover:bg-vermillion/5",
                      )}
                      to={`/china/imperial-exam/${section.id}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-brush text-lg",
                            active ? "text-vermillion" : "text-ink",
                          )}
                        >
                          {section.name}
                        </span>
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-full bg-vermillion"
                          />
                        ) : null}
                      </span>
                      <span className="block truncate font-body text-muted-foreground text-xs">
                        {section.scope}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* 右侧内容区：区域内滚动。顶部 padding 由各子页自带（pt-6）——
            sticky 吸顶带钉在窗格顶缘时，窗格自身的 padding 会在其上方留出
            一条漏出滚动内容的缝隙，因此 padding 不能放在这里 */}
        <section className="order-1 flex min-h-0 flex-1 flex-col lg:order-2">
          <div className="min-h-0 flex-1 px-4 pb-6 sm:px-8 lg:overflow-y-auto lg:px-10">
            {children}
          </div>
        </section>
      </div>
    </article>
  );
}
