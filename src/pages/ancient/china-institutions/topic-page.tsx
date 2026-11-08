import { InstitutionShell } from "./institution-shell";
import { getInstitutionTopic } from "./topics";

/**
 * 制度专题页：五个条目共用一版式——左侧条目目录、右侧内容；
 * 沿革以编年体时间轴呈现：竖轴在左，每个朝代阶段是一张钉在轴上的节点卡，
 * 卡片与轴线之间用朱色连接线衔接；关键条目表收在轴后。
 */
export function InstitutionTopicPage({ topicId }: { topicId: string }) {
  const topic = getInstitutionTopic(topicId);

  if (!topic) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-20">
        <span className="eyebrow">典章制度</span>
        <h1 className="font-brush text-4xl text-ink sm:text-5xl">条目尚未收录</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          这一条目还没有对应专题页。可以从左侧目录选择已开放的条目。
        </p>
      </section>
    );
  }

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

          {/* 编年体时间轴：竖轴在左，每个阶段一张节点卡，连接线把卡片钉回轴线 */}
          <ol className="relative flex flex-col gap-8 border-ink/15 border-l-2 pl-6 sm:pl-8">
            {topic.eras.map((era) => (
              <li className="relative" key={era.title}>
                {/* 节点与连接件：朱点钉在轴线上，横线把卡片牵回轴线 */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-7 z-10 h-3.5 w-3.5 rounded-full border-2 border-vermillion bg-paper shadow-[0_0_0_3px_hsl(var(--paper))]"
                  data-era-dot=""
                />
                <span
                  aria-hidden="true"
                  className="absolute -left-8 top-[37px] hidden h-px w-8 bg-vermillion/35 sm:block"
                />
                <div className="relative flex flex-col gap-3 rounded-xl border border-ink/15 bg-card/90 p-5 shadow-[0_10px_28px_hsl(var(--ink)/0.08)] transition-shadow duration-300 hover:shadow-[0_14px_34px_hsl(var(--ink)/0.12)]">
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
                  <p className="flex flex-wrap items-baseline gap-2 border-t border-dashed border-ink/15 pt-3 text-muted-foreground text-sm">
                    <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
                      沿革
                    </span>
                    <span>{era.legacy}</span>
                  </p>
                </div>
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
      </div>
    </InstitutionShell>
  );
}
