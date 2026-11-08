import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { getInstitutionTopic, INSTITUTION_TOPICS } from "./topics";

/**
 * 制度专题页的共享渲染器：五个条目共用同一版式（沿革脉络 + 关键条目 + 关联条目），
 * 数据在 topics/ 下按条目一份，路由在 routes.tsx 中按 slug 显式注册。
 */
export function InstitutionTopicPage({ topicId }: { topicId: string }) {
  const topic = getInstitutionTopic(topicId);

  if (!topic) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-20">
        <span className="eyebrow">典章制度</span>
        <h1 className="font-brush text-4xl text-ink sm:text-5xl">条目尚未收录</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          这一条目还没有对应专题页。可以回到典章制度索引，查看已开放的条目。
        </p>
        <Link
          className="font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase hover:underline"
          to="/china/institutions"
        >
          ← 返回典章制度索引
        </Link>
      </section>
    );
  }

  const siblings = INSTITUTION_TOPICS.filter((sibling) => sibling.id !== topic.id);
  const firstEra = topic.eras[0];
  const lastEra = topic.eras[topic.eras.length - 1];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="eyebrow">典章制度 · {topic.name}</span>
          <Link
            className="font-mono-tech text-muted-foreground text-xs tracking-[0.25em] uppercase transition-colors hover:text-vermillion"
            to="/china/institutions"
          >
            ← 典章制度索引
          </Link>
        </div>
        <h1 className="font-brush text-5xl leading-tight text-ink sm:text-6xl">
          <span className="ink-underline inline-block pb-1">{topic.name}</span>
        </h1>
        <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.22em] uppercase">
          {topic.scope}
        </span>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {topic.intro}
        </p>
      </header>

      <section className="home-section-panel flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">沿革脉络</span>
          <h2 className="font-brush text-3xl text-ink">
            {firstEra.dynasty}到{lastEra.dynasty}：{topic.name}的演变
          </h2>
        </div>
        <ol className="flex flex-col">
          {topic.eras.map((era, index) => (
            <li
              key={era.title}
              className={`flex flex-col gap-3 py-6 ${index > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="rounded-sm bg-vermillion/10 px-2.5 py-1 font-brush text-lg text-vermillion">
                  {era.dynasty}
                </span>
                <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
                  {era.period}
                </span>
                <h3 className="font-brush text-2xl text-ink">{era.title}</h3>
              </div>
              <p className="text-pretty leading-relaxed text-muted-foreground">{era.summary}</p>
              <ul className="flex flex-col gap-2">
                {era.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 leading-relaxed text-foreground/90"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-vermillion/70"
                    />
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
              <p className="flex flex-wrap items-baseline gap-2 text-muted-foreground text-sm">
                <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
                  沿革
                </span>
                <span>{era.legacy}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">关键条目</span>
          <h2 className="font-brush text-3xl text-ink">{topic.name}关键词</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topic.keyTerms.map((term) => (
            <div key={term.name} className="guide-card flex flex-col gap-2 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-brush text-xl text-ink">{term.name}</span>
                <span className="font-mono-tech text-muted-foreground text-[0.7rem] tracking-[0.12em]">
                  {term.era}
                </span>
              </div>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {term.explanation}
              </span>
            </div>
          ))}
        </div>
      </section>

      {siblings.length > 0 ? (
        <aside className="home-section-panel flex flex-col gap-5">
          <span className="eyebrow">关联条目</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                to={`/china/institutions/${sibling.slug}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-vermillion/40"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-brush text-lg text-ink">{sibling.name}</span>
                  <span className="truncate text-muted-foreground text-xs">{sibling.scope}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-vermillion transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
