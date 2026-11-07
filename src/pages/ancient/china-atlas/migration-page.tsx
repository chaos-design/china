import { useState } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { ATLAS_DYNASTIES } from "./dynasties";
import { MIGRATION_EVENTS } from "./migration-events";
import { MigrationMap } from "./migration-map";
import { getAtlasTopic, getOtherAtlasTopics } from "./topics";

/**
 * 民族迁徙页（图谱首个正式页面）：
 * 左侧是按朝代分组的迁徙事件菜单，右侧是真实省界底图上的路线图与详情。
 * 选中任一条路线，地图即以画线 + 流动圆点模拟该次迁徙的去向；
 * 「全部路线」保留全局的迁徙密度感。
 */
export function MigrationAtlasPage() {
  const topic = getAtlasTopic("migration");
  const [selectedId, setSelectedId] = useState<string | null>(MIGRATION_EVENTS[0]?.id ?? null);
  const selected = MIGRATION_EVENTS.find((event) => event.id === selectedId) ?? null;
  const otherTopics = getOtherAtlasTopics(topic.id);

  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <header className="border-ink/10 border-b pb-8">
        <p className="font-body text-xs font-medium tracking-[0.3em] text-vermillion">
          疆域与民族图谱 · {topic.tagline}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-kai text-3xl font-black text-ink sm:text-4xl">{topic.label}</h1>
          <span
            className={cn(
              "rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5",
              "font-body text-xs tracking-widest text-muted-foreground",
            )}
          >
            首批八条路线 · 汉唐宋元
          </span>
        </div>
        <p className="mt-4 max-w-3xl font-body text-base leading-relaxed text-ink/85">
          {topic.description}
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* 左侧：按朝代分组的迁徙事件菜单 */}
        <aside aria-label="迁徙路线目录" className="order-2 flex flex-col gap-5 lg:order-1">
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

          <p className="font-body text-xs leading-relaxed text-muted-foreground">
            路线为主流向的示意走廊：同一次迁徙往往分几波、走几条道。底图采用真实省界投影，与丝绸之路、解放战争两图同源。
          </p>
        </aside>

        {/* 右侧：真实底图 + 选中路线详情 */}
        <section aria-label="迁徙路线图" className="order-1 lg:order-2">
          <div className="rounded-2xl border border-ink/10 bg-paper/70 p-3 sm:p-4">
            <MigrationMap events={MIGRATION_EVENTS} selectedId={selectedId} />
            <div
              aria-hidden="true"
              className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 font-body text-xs text-muted-foreground"
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
        </section>
      </div>

      <section className="pt-10">
        <h2 className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          图谱其他入口
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {otherTopics.map((other) => (
            <NavLink
              className={cn(
                "rounded-full border border-ink/15 bg-paper/80 px-4 py-2 font-kai text-base text-ink",
                "transition-colors hover:border-primary/40 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              key={other.id}
              to={other.path}
            >
              {other.label}
              <span className="ml-2 font-body text-xs text-muted-foreground">{other.tagline}</span>
            </NavLink>
          ))}
        </div>
      </section>
    </article>
  );
}
