import { NavLink } from "react-router-dom";

import { cn } from "../../../lib/utils";
import { ATLAS_DYNASTIES } from "./dynasties";
import { getOtherAtlasTopics } from "./topics";
import type { AtlasTopic } from "./types";

/**
 * 「疆域与民族图谱」的占位页外壳：三个主题各渲染一份，只换 topic 元信息。
 *
 * 占位页的职责是把「这里将有什么」讲清楚——模块定位、规划中的图谱形态、
 * 按朝代展开的路线图——而不是模拟正式页面的交互。后续某条主题正式落地时，
 * 把对应的 *-page.tsx 从本组件切换到真正的图谱实现即可，路由与导航不动。
 */
export function AtlasPlaceholderPage({ topic }: { topic: AtlasTopic }) {
  const otherTopics = getOtherAtlasTopics(topic.id);

  return (
    <article className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
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
            建设中 · 骨架预留
          </span>
        </div>
        <p className="mt-4 max-w-3xl font-body text-base leading-relaxed text-ink/85">
          {topic.description}
        </p>
      </header>

      <section className="pt-10">
        <h2 className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          规划中的图谱形态
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topic.plannedFeatures.map((feature) => (
            <li
              className="rounded-xl border border-ink/10 bg-paper/70 px-4 py-3 font-body text-sm leading-relaxed text-ink/90"
              key={feature}
            >
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-10">
        <h2 className="font-body text-xs font-medium tracking-[0.3em] text-muted-foreground">
          按朝代展开的规划
        </h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          数据按朝代成章、按变迁节点成目。以下为首批朝代骨架，后续逐朝填充。
        </p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ATLAS_DYNASTIES.map((dynasty) => {
            const plan = dynasty.planned[topic.id];
            return (
              <li
                className="flex flex-col rounded-xl border border-ink/10 bg-paper/70 px-4 py-4"
                key={dynasty.id}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-kai text-xl font-bold text-ink">{dynasty.label}</span>
                  <span className="font-mono-tech text-xs text-muted-foreground">
                    {dynasty.period}
                  </span>
                </div>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink/85">
                  {plan ?? "该主题暂未规划到这一朝，待首批内容落地后补充。"}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

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
