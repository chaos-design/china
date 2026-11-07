import { useState } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { ATLAS_DYNASTIES } from "./dynasties";
import { MIGRATION_EVENTS } from "./migration-events";
import { MigrationMap, prefersReducedMotion } from "./migration-map";
import { getAtlasTopic, getOtherAtlasTopics } from "./topics";

/**
 * 民族迁徙页（图谱首个正式页面），应用式布局：
 * - 页头（标题区）钉在页头顶端，不随内容滚动；
 * - 左侧菜单贴住页面左缘、全高侧栏：条目列表独立滚动，
 *   「图谱入口」（疆域变迁 / 边疆治理）作为菜单项收在侧栏底部；
 * - 右侧地图 + 详情卡：地图限高以一屏呈现，超出时区域内滚动。
 * 窄屏退化为纵向文档流（地图在前、菜单在后）。
 * 选中任一条路线，地图即以画线 + 流动圆点模拟该次迁徙的去向；
 * 「全部路线」保留全局的迁徙密度感。流动动画可用开关手动停驻。
 */
export function MigrationAtlasPage() {
  const topic = getAtlasTopic("migration");
  const [selectedId, setSelectedId] = useState<string | null>(MIGRATION_EVENTS[0]?.id ?? null);
  // 初始值尊重系统「减少动态效果」偏好；用户仍可用开关手动开/停。
  const [animated, setAnimated] = useState(() => !prefersReducedMotion());
  const selected = MIGRATION_EVENTS.find((event) => event.id === selectedId) ?? null;
  const otherTopics = getOtherAtlasTopics(topic.id);

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
            首批八条路线 · 汉唐宋元
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
        {/* 左侧菜单：贴左缘全高侧栏；列表独立滚动，图谱入口收在底部菜单 */}
        <aside
          aria-label="迁徙路线目录"
          className="flex w-full shrink-0 flex-col border-ink/10 lg:w-72 lg:border-r"
        >
          <div className="min-h-0 flex-1 px-4 py-4 lg:overflow-y-auto">
            <button
              aria-pressed={selectedId === null}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-left font-kai text-base transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selectedId === null
                  ? "border-primary/50 bg-vermillion/8 text-ink"
                  : "border-ink/12 bg-paper/70 text-ink/75 hover:border-primary/30 hover:text-ink",
              )}
              onClick={() => setSelectedId(null)}
              type="button"
            >
              全览 · 全部路线
            </button>

            <div className="mt-4 flex flex-col gap-4">
              {ATLAS_DYNASTIES.map((dynasty) => {
                const events = MIGRATION_EVENTS.filter((event) => event.dynastyId === dynasty.id);
                if (events.length === 0) return null;
                return (
                  <section key={dynasty.id}>
                    <h2 className="flex items-baseline justify-between border-ink/8 border-b pb-1.5">
                      <span className="font-kai text-lg font-bold text-ink">{dynasty.label}</span>
                      <span className="font-mono-tech text-xs text-muted-foreground">
                        {dynasty.period}
                      </span>
                    </h2>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {events.map((event) => {
                        const isSelected = event.id === selectedId;
                        return (
                          <li key={event.id}>
                            <button
                              aria-pressed={isSelected}
                              className={cn(
                                "-mx-1 w-[calc(100%+0.5rem)] rounded-lg px-2.5 py-2 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected
                                  ? "bg-vermillion/10 text-ink"
                                  : "text-ink/80 hover:bg-ink/4 hover:text-ink",
                              )}
                              onClick={() => setSelectedId(event.id)}
                              type="button"
                            >
                              <span className="block font-kai text-base">
                                {event.group}
                                <span className="font-body text-xs text-muted-foreground">
                                  {" "}
                                  · {event.from}→{event.to}
                                </span>
                              </span>
                              <span className="mt-0.5 block font-body text-xs text-muted-foreground">
                                {event.period}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>

            <p className="mt-4 font-body text-xs leading-relaxed text-muted-foreground">
              路线为主流向的示意走廊：同一次迁徙往往分几波、走几条道。底图采用真实省界投影，与丝绸之路、解放战争两图同源。
            </p>
          </div>

          {/* 图谱入口：原页面底部的按钮改为侧栏底部的菜单项 */}
          <nav aria-label="图谱其他入口" className="shrink-0 border-ink/10 border-t px-4 py-3">
            <p className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
              图谱入口
            </p>
            <div className="mt-1.5 flex flex-col">
              {otherTopics.map((other) => (
                <NavLink
                  className={cn(
                    "-mx-2 rounded-lg px-2 py-2 font-kai text-base text-ink transition-colors",
                    "hover:bg-ink/4 hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  )}
                  key={other.id}
                  to={other.path}
                >
                  {other.label}
                  <span className="ml-2 font-body text-xs text-muted-foreground">
                    {other.tagline}
                  </span>
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>

        {/* 右侧：真实底图 + 选中路线详情；地图限高一屏，超出时区域内滚动 */}
        <section
          aria-label="迁徙路线图"
          className="order-1 min-h-0 flex-1 lg:order-2 lg:overflow-y-auto"
        >
          <div className="px-4 py-4 lg:px-6">
            <div className="rounded-2xl border border-ink/10 bg-paper/70 p-3 sm:p-4">
              <MigrationMap
                animated={animated}
                className="lg:max-h-[calc(100vh-16rem)]"
                events={MIGRATION_EVENTS}
                selectedId={selectedId}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
                <div
                  aria-hidden="true"
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                      <circle
                        cx="5"
                        cy="5"
                        fill="none"
                        r="3.4"
                        stroke="hsl(var(--vermillion))"
                        strokeWidth="1.4"
                      />
                    </svg>
                    起点
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                      <circle cx="5" cy="5" fill="hsl(var(--vermillion))" r="3.4" />
                    </svg>
                    终点
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg aria-hidden="true" height="6" viewBox="0 0 24 6" width="24">
                      <path
                        d="M0,3 C8,1 16,5 24,3"
                        fill="none"
                        stroke="hsl(var(--vermillion))"
                        strokeWidth="1.6"
                      />
                    </svg>
                    迁徙去向（流动方向）
                  </span>
                </div>
                <button
                  aria-pressed={animated}
                  className={cn(
                    "rounded-full border border-ink/15 bg-paper/80 px-3 py-1 font-body text-xs transition-colors",
                    "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    animated ? "text-ink" : "text-muted-foreground",
                  )}
                  onClick={() => setAnimated((value) => !value)}
                  type="button"
                >
                  流动动画 · {animated ? "开" : "关"}
                </button>
              </div>
            </div>

            {selected ? (
              <div
                className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-4"
                key={selected.id}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-kai text-xl font-bold text-ink">
                    {selected.group} · {selected.from} → {selected.to}
                  </h2>
                  <span className="font-mono-tech text-xs text-muted-foreground">
                    {selected.period}
                  </span>
                </div>
                <p className="mt-2.5 font-body text-sm leading-relaxed text-ink/85">
                  {selected.description}
                </p>
                <ul className="mt-3 flex flex-col gap-1 border-ink/8 border-t pt-2.5">
                  {selected.sources.map((source) => (
                    <li className="font-body text-xs text-muted-foreground" key={source}>
                      资料出处 · {source}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 px-5 py-4 font-body text-sm text-muted-foreground">
                淡墨为全部八条路线的主流向。选择左侧任一条目，查看具体路线、时段与资料出处。
              </p>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
