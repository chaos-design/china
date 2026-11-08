import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { InstitutionShell } from "./institution-shell";
import { getInstitutionTopic, INSTITUTION_TOPICS } from "./topics";

/**
 * 制度专题页：五个条目共用一版式——左侧条目目录、右侧内容；
 * 沿革以编年体时间轴呈现（竖轴 + 朝代节点），关键条目与关联条目收在轴后。
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
  const spanStart = firstEra.period.split(" — ")[0];
  const spanEnd = lastEra.period.split(" — ").pop();

  return (
    <InstitutionShell
      activeTopicId={topic.id}
      badge={topic.scope}
      description={topic.intro}
      title={topic.name}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <section aria-label="编年沿革时间轴" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="eyebrow">沿革脉络</span>
              <h2 className="font-brush text-3xl text-ink">
                {firstEra.dynasty}到{lastEra.dynasty}：{topic.name}的演变
              </h2>
            </div>
            <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
              {spanStart} — {spanEnd} · {topic.eras.length} 个节点
            </span>
          </div>

          {/* 编年体时间轴：竖轴在左，朱色节点按朝代顺序钉在轴上 */}
          <ol className="relative flex flex-col gap-9 border-ink/15 border-l-2 pl-6 sm:gap-10 sm:pl-10">
            {topic.eras.map((era) => (
              <li className="relative flex flex-col gap-3" key={era.title}>
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-vermillion bg-paper shadow-[0_0_0_3px_hsl(var(--vermillion)/0.1)]"
                  data-era-dot=""
                />
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
                      className="flex items-start gap-3 leading-relaxed text-foreground/90"
                      key={point}
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
          <div className="grid gap-4 sm:grid-cols-2">
            {topic.keyTerms.map((term) => (
              <div className="guide-card flex flex-col gap-2 p-5" key={term.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-brush text-xl text-ink">{term.name}</span>
                  <span className="font-mono-tech text-[0.7rem] tracking-[0.12em] text-muted-foreground">
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
          <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5">
            <span className="eyebrow">关联条目</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {siblings.map((sibling) => (
                <Link
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-vermillion/40"
                  key={sibling.id}
                  to={`/china/institutions/${sibling.slug}`}
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
      </div>
    </InstitutionShell>
  );
}
