import { Fragment, useState } from "react";

import { cn } from "../../../lib/utils";
import { getDynastyPath, IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { EXAM_MILESTONES, IMPERIAL_EXAM_LADDER, SIDE_ROUTES } from "./ladder";
import { ENTRANCE_KIND_LABELS, type EntranceKind } from "./types";

/** 入仕门类章的配色：考试朱、荐举赭、世荫与学校青，其余墨色。 */
const KIND_STYLES: Record<EntranceKind, string> = {
  exam: "border-vermillion/40 bg-vermillion/10 text-vermillion",
  recommend: "border-ochre/45 bg-ochre/10 text-ochre",
  inherit: "border-blueprint/40 bg-blueprint/10 text-blueprint",
  school: "border-blueprint/30 bg-blueprint/5 text-blueprint",
  merit: "border-ink/25 bg-ink/5 text-ink/80",
  purchase: "border-ink/25 bg-ink/5 text-ink/80",
  clerk: "border-ink/25 bg-ink/5 text-ink/80",
};

const DEFAULT_DYNASTY_ID = IMPERIAL_EXAM_DYNASTIES[0]?.id ?? "";

/**
 * 科举之路：登科之阶（明清全程）+ 历代官途（逐朝入仕与晋升 + 履历样本）
 * + 横向对照表 + 资料出处。
 */
export function ImperialExamPage() {
  const [activeId, setActiveId] = useState(DEFAULT_DYNASTY_ID);
  const activeDynasty = getDynastyPath(activeId) ?? IMPERIAL_EXAM_DYNASTIES[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5">
        <span className="eyebrow">官制专题 · 仕途全览</span>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <h1 className="font-brush text-5xl text-ink sm:text-6xl">科举之路</h1>
          <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-1 font-body text-xs tracking-widest text-muted-foreground">
            入仕 · 晋升 · 官途
          </span>
        </div>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground">
          一千三百年间，读书人怎么走进官场、又靠什么爬上去。登科之阶按明清定型的科举全程铺开；
          历代官途逐朝拆解入仕途径与晋升机制，并为每一朝配一份真实官员的履历样本。
        </p>
        <ul aria-label="制度里程碑" className="flex flex-wrap gap-2">
          {EXAM_MILESTONES.map((milestone) => (
            <li
              className="rounded-md border border-ink/10 bg-card/80 px-3 py-1.5 font-mono-tech text-xs tracking-[0.12em] text-muted-foreground"
              key={milestone.year}
            >
              <span className="text-vermillion">{milestone.year}</span>
              <span aria-hidden="true"> · </span>
              {milestone.event}
            </li>
          ))}
        </ul>
      </header>

      {/* 第一程：登科之阶 */}
      <section aria-label="登科之阶" className="flex flex-col gap-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">第一程 · 明清科举全程</span>
            <h2 className="font-brush text-3xl text-ink">登科之阶：从童生到翰林</h2>
          </div>
          <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
            五道关卡 · 六个身份 · 一条独木桥
          </span>
        </div>

        <ol className="relative flex flex-col gap-7 border-ink/15 border-l-2 pl-8">
          {IMPERIAL_EXAM_LADDER.map((step) => (
            <li className="relative" key={step.station}>
              {/* 节点与连接件：朱点钉在轴线上，横线把卡片牵回轴线（与典章制度时间轴同一几何） */}
              <span
                aria-hidden="true"
                className="absolute -left-[40px] top-7 z-10 h-3.5 w-3.5 rounded-full border-2 border-vermillion bg-paper shadow-[0_0_0_3px_hsl(var(--paper))]"
              />
              <span
                aria-hidden="true"
                className="absolute -left-[33px] top-[35px] hidden h-px w-[33px] bg-vermillion/35 sm:block"
              />
              <div className="relative flex flex-col gap-3 rounded-xl border border-ink/15 bg-card/90 p-5 shadow-[0_10px_28px_hsl(var(--ink)/0.08)] transition-shadow duration-300 hover:shadow-[0_14px_34px_hsl(var(--ink)/0.12)]">
                {step.gate ? (
                  <div className="rounded-lg border border-dashed border-vermillion/35 bg-vermillion/5 p-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono-tech text-vermillion text-[0.68rem] tracking-[0.22em]">
                        关卡 · 考试
                      </span>
                      <span className="font-brush text-vermillion text-lg">
                        {step.gate.name}
                        {step.gate.alias ? `（${step.gate.alias}）` : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 text-foreground/85 text-sm leading-relaxed">
                      {step.gate.detail}
                    </p>
                    {step.gate.odds ? (
                      <p className="mt-1.5 font-mono-tech text-[0.7rem] tracking-[0.08em] text-ochre">
                        {step.gate.odds}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h3 className="font-brush text-ink text-2xl">{step.station}</h3>
                  {step.tag ? (
                    <span className="rounded-sm bg-ink/5 px-2 py-0.5 font-body text-muted-foreground text-xs">
                      {step.tag}
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground leading-relaxed">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="rounded-xl border border-dashed border-ochre/45 bg-ochre/5 p-5">
          <h3 className="font-brush text-ink text-xl">{SIDE_ROUTES.title}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SIDE_ROUTES.routes.map((route) => (
              <div className="flex flex-col gap-1" key={route.name}>
                <span className="font-brush text-lg text-ink">{route.name}</span>
                <span className="text-muted-foreground text-sm leading-relaxed">
                  {route.detail}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-dashed border-ochre/40 pt-3 text-muted-foreground text-sm">
            {SIDE_ROUTES.note}
          </p>
        </aside>
      </section>

      {/* 第二程：历代官途 */}
      <section aria-label="历代官途" className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">第二程 · 逐朝拆解</span>
          <h2 className="font-brush text-3xl text-ink">历代官途：怎么做官，怎么晋升</h2>
        </div>

        <fieldset aria-label="朝代选择" className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
          {IMPERIAL_EXAM_DYNASTIES.map((dynasty) => {
            const isActive = dynasty.id === activeDynasty.id;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-4 py-1.5 font-brush text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "border-vermillion bg-vermillion text-paper shadow-[0_6px_16px_hsl(var(--vermillion)/0.25)]"
                    : "border-ink/15 bg-card/80 text-ink hover:border-vermillion/40 hover:text-vermillion",
                )}
                key={dynasty.id}
                onClick={() => setActiveId(dynasty.id)}
                type="button"
              >
                {dynasty.name}
              </button>
            );
          })}
        </fieldset>

        {activeDynasty ? (
          <article aria-label={`${activeDynasty.name}官途`} className="flex flex-col gap-10">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h3 className="font-brush text-vermillion text-2xl">{activeDynasty.name}</h3>
              <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
                {activeDynasty.period}
              </span>
              <span className="text-foreground/80 text-sm">{activeDynasty.headline}</span>
            </div>

            {/* 怎么入仕 */}
            <div className="flex flex-col gap-4">
              <h4 className="font-brush text-ink text-xl">怎么入仕</h4>
              <p className="max-w-3xl text-muted-foreground leading-relaxed">
                {activeDynasty.entry.summary}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeDynasty.entry.routes.map((route) => (
                  <div className="guide-card flex flex-col gap-2 p-4" key={route.name}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-brush text-ink text-lg">{route.name}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[0.7rem]",
                          KIND_STYLES[route.kind],
                        )}
                      >
                        {ENTRANCE_KIND_LABELS[route.kind]}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm leading-relaxed">
                      {route.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 怎么晋升 */}
            <div className="flex flex-col gap-4">
              <h4 className="font-brush text-ink text-xl">怎么晋升</h4>
              <p className="max-w-3xl text-muted-foreground leading-relaxed">
                {activeDynasty.promotion.summary}
              </p>
              <div className="flex flex-col gap-2">
                {activeDynasty.promotion.mechanisms.map((mechanism) => (
                  <div
                    className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-card/70 p-3.5 sm:flex-row sm:items-baseline sm:gap-4"
                    key={mechanism.name}
                  >
                    <span className="shrink-0 font-brush text-vermillion text-lg sm:w-36">
                      {mechanism.name}
                    </span>
                    <span className="text-foreground/85 text-sm leading-relaxed">
                      {mechanism.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink/10 bg-paper/60 p-4">
                <span className="mr-2 font-mono-tech text-muted-foreground text-[0.7rem] tracking-[0.2em]">
                  典型迁转
                </span>
                {activeDynasty.promotion.ladder.map((stage, index) => {
                  const isLast = index === activeDynasty.promotion.ladder.length - 1;

                  return (
                    <Fragment key={stage}>
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-vermillion/60">
                          →
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-sm",
                          isLast
                            ? "border-vermillion/45 bg-vermillion/10 text-vermillion"
                            : "border-ink/15 bg-card/85 text-foreground/90",
                        )}
                      >
                        {stage}
                      </span>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* 履历样本 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h4 className="font-brush text-ink text-xl">一位官员的履历样本</h4>
                <span className="font-brush text-vermillion text-lg">
                  {activeDynasty.career.subject}
                </span>
                <span className="text-muted-foreground text-sm">
                  {activeDynasty.career.subjectIntro}
                </span>
                <span className="rounded-full border border-blueprint/35 bg-blueprint/10 px-2.5 py-0.5 font-mono-tech text-blueprint text-[0.7rem]">
                  {activeDynasty.career.source}
                </span>
              </div>
              <ol className="relative flex flex-col gap-4 border-ink/15 border-l pl-6">
                {activeDynasty.career.steps.map((step) => (
                  <li className="relative flex flex-col gap-0.5" key={`${step.year}-${step.role}`}>
                    <span
                      aria-hidden="true"
                      className="absolute -left-[28px] top-1.5 h-2 w-2 rounded-full bg-vermillion/80"
                    />
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="font-mono-tech text-vermillion text-xs tracking-[0.1em]">
                        {step.year}
                      </span>
                      <span className="font-body font-medium text-ink text-sm">{step.role}</span>
                    </div>
                    {step.note ? (
                      <span className="text-muted-foreground text-sm leading-relaxed">
                        {step.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            {/* 身份关键词 */}
            <div className="flex flex-col gap-3">
              <h4 className="font-brush text-ink text-xl">身份关键词</h4>
              <dl className="grid gap-3 sm:grid-cols-2">
                {activeDynasty.terms.map((term) => (
                  <div className="guide-card flex flex-col gap-1.5 p-4" key={term.name}>
                    <dt className="font-brush text-ink text-lg">{term.name}</dt>
                    <dd className="text-muted-foreground text-sm leading-relaxed">
                      {term.explanation}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ) : null}
      </section>

      {/* 第三程：横向对照 */}
      <section aria-label="历代官途对照" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">第三程 · 横向对照</span>
          <h2 className="font-brush text-3xl text-ink">一张表看清历代官途</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink/15 bg-card/80">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-ink/15 border-b bg-ink/5">
                <th className="px-4 py-3 font-brush text-ink text-lg" scope="col">
                  朝代
                </th>
                <th className="px-4 py-3 font-brush text-ink text-lg" scope="col">
                  怎么进门
                </th>
                <th className="px-4 py-3 font-brush text-ink text-lg" scope="col">
                  怎么上去
                </th>
                <th className="px-4 py-3 font-brush text-ink text-lg" scope="col">
                  一句话特征
                </th>
              </tr>
            </thead>
            <tbody>
              {IMPERIAL_EXAM_DYNASTIES.map((dynasty) => (
                <tr className="border-ink/10 border-b last:border-b-0" key={dynasty.id}>
                  <th
                    className="whitespace-nowrap px-4 py-3 align-top font-brush text-vermillion text-lg"
                    scope="row"
                  >
                    {dynasty.name}
                  </th>
                  <td className="px-4 py-3 align-top text-foreground/85 text-sm">
                    {dynasty.entry.routes.map((route) => route.name).join("、")}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground/85 text-sm">
                    {dynasty.promotion.mechanisms.map((mechanism) => mechanism.name).join("、")}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground text-sm">
                    {dynasty.headline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-ink/20 border-t border-dashed pt-6">
        <h2 className="font-brush text-ink text-xl">资料出处</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {IMPERIAL_EXAM_DYNASTIES.map((dynasty) => (
            <li className="text-muted-foreground text-sm" key={dynasty.id}>
              <span className="font-brush text-ink">{dynasty.name}</span>
              <span aria-hidden="true"> — </span>
              {dynasty.sources.join("；")}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs leading-relaxed">
          名额与录取率均取教科书通行口径，估算数字以「约」标示；历官细节以正史本传为准。
        </p>
      </footer>
    </div>
  );
}
