import { BadgeCheck, BookOpen, DoorOpen, FileSearch, PenLine, ScrollText } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { cn } from "../../../lib/utils";
import { getDynastyPath, IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { EXAM_IMAGE_CREDITS, EXAM_IMAGES } from "./imperial-exam-images";
import { ImperialExamShell } from "./imperial-exam-shell";
import {
  ADVANCEMENT_FUNNEL,
  EXAM_CADENCE,
  EXAM_LEGEND,
  EXAM_STAGES,
  type LegendItem,
  SIDE_ROUTES,
} from "./ladder";
import { getImperialExamSection } from "./sections";
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

/** 漏斗图例人形：示意个数，不按比例精确绘制。 */
function PersonGlyph() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-2.5 fill-vermillion/60" viewBox="0 0 10 14">
      <circle cx="5" cy="3" r="2.6" />
      <path d="M0.5 14c0-3.6 2-6 4.5-6s4.5 2.4 4.5 6z" />
    </svg>
  );
}

const LEGEND_ICONS: Record<LegendItem["icon"], typeof BookOpen> = {
  read: BookOpen,
  enter: DoorOpen,
  write: PenLine,
  review: FileSearch,
  list: ScrollText,
  appoint: BadgeCheck,
};

/** 放大查看的影像数据：档案记录 + 图注。 */
interface LightboxImage {
  src: string;
  w: number;
  h: number;
  alt: string;
  credit: string;
  caption: string;
}

/**
 * 影像放大层：遮罩即关闭按钮（点击任意处关闭），Escape 关闭；
 * 与政策全览页的放大图同一交互约定（mask 为 button、aria-label「关闭放大图」）。
 */
function ImageLightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <button
      aria-label={`关闭放大图：${image.caption}`}
      className="fixed inset-0 z-[80] flex cursor-zoom-out flex-col items-center justify-center gap-3 bg-ink/85 p-6"
      onClick={onClose}
      type="button"
    >
      <span
        aria-hidden="true"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-paper/30 bg-paper/10 font-body text-2xl text-paper"
      >
        ×
      </span>
      <figure className="flex max-h-full flex-col gap-2">
        <img
          alt={image.alt}
          className="mx-auto h-auto max-h-[76vh] w-auto max-w-[92vw] rounded-lg border border-paper/15 object-contain"
          height={image.h}
          src={image.src}
          width={image.w}
        />
        <figcaption className="text-center text-paper/85 text-xs leading-snug">
          {image.caption}
          <span className="text-paper/55"> · {image.credit}</span>
        </figcaption>
      </figure>
    </button>
  );
}

const PAGE_DESCRIPTION =
  "一千三百年间，读书人怎么走进官场、又靠什么爬上去。登科之阶按「一科三年」的时间轴逻辑逐站铺开明清科举全程，" +
  "以贡院、金榜、殿试卷等真实影像佐证其难度；历代官途逐朝拆解入仕途径与晋升机制，并为每一朝配一份真实官员的履历样本。";

const DEFAULT_DYNASTY_ID = IMPERIAL_EXAM_DYNASTIES[0]?.id ?? "";

/** 子页一：登科之阶——七站链 + 晋身漏斗 + 一科三年节奏轴 + 岔路。 */
function StagesSection() {
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  return (
    <section aria-label="登科之阶" className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">第一程 · 明清科举全程</span>
          <h2 className="font-brush text-3xl text-ink">一张考卷，怎样换来一顶官帽</h2>
        </div>
        <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
          七站走完读书人晋身之路 · 一科三年
        </span>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
        {/* 左：七站链，按一科三年的时序逐站走 */}
        <ol className="flex flex-col gap-8">
          {EXAM_STAGES.map((stage, index) => {
            const mainDetailIndex = stage.details.findIndex((detail) => detail.image);
            const mainDetail = mainDetailIndex >= 0 ? stage.details[mainDetailIndex] : undefined;
            const mainImage = mainDetail?.image ? EXAM_IMAGES[mainDetail.image.key] : undefined;
            const mainImageCaption = mainDetail?.image?.caption;
            const cells = mainDetail
              ? [
                  { label: mainDetail.label, text: mainDetail.text, image: undefined },
                  ...stage.details.filter((_, i) => i !== mainDetailIndex),
                ]
              : stage.details;

            return (
              <li className="relative" key={stage.name}>
                {index < EXAM_STAGES.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[19px] top-14 hidden w-px bg-vermillion/25 sm:block"
                  />
                ) : null}
                <div className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-vermillion/45 bg-paper font-brush text-xl text-vermillion shadow-[0_0_0_4px_hsl(var(--paper))]"
                  >
                    {stage.num}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-ink/15 bg-card/90 p-4 shadow-[0_10px_28px_hsl(var(--ink)/0.08)] sm:p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                      <h3 className="font-brush text-ink text-2xl">{stage.name}</h3>
                      <span className="rounded-sm bg-ink/5 px-2 py-0.5 font-body text-muted-foreground text-xs">
                        {stage.place}
                      </span>
                      <span className="rounded-sm bg-vermillion/10 px-2 py-0.5 font-mono-tech text-vermillion text-[0.7rem] tracking-[0.1em]">
                        {stage.timing}
                      </span>
                      <span className="rounded-full border border-ochre/45 bg-ochre/10 px-2.5 py-0.5 text-ochre text-[0.72rem]">
                        {stage.identity}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{stage.summary}</p>
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ink/10 bg-paper/60 px-3 py-2">
                      <span className="font-mono-tech text-muted-foreground text-[0.65rem] tracking-[0.2em]">
                        环节
                      </span>
                      {stage.flow.map((step, stepIndex) => (
                        <Fragment key={step}>
                          {stepIndex > 0 ? (
                            <span aria-hidden="true" className="text-vermillion/50">
                              →
                            </span>
                          ) : null}
                          <span className="rounded border border-ink/15 bg-card px-1.5 py-0.5 text-foreground/90 text-[0.72rem]">
                            {step}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                    {stage.exam ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-ink/10 bg-paper/60 p-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-brush text-vermillion text-sm">考试科目</span>
                            <span className="font-mono-tech text-muted-foreground text-[0.62rem] tracking-[0.2em]">
                              考什么
                            </span>
                          </div>
                          <ul className="mt-1.5 flex flex-col gap-1.5">
                            {stage.exam.subjects.map((subject) => (
                              <li className="flex flex-col gap-0.5" key={subject.name}>
                                <span className="text-ink text-[0.78rem] font-medium">
                                  {subject.name}
                                </span>
                                <span className="text-muted-foreground text-[0.72rem] leading-relaxed">
                                  {subject.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-ink/10 bg-paper/60 p-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-brush text-vermillion text-sm">考试方式</span>
                            <span className="font-mono-tech text-muted-foreground text-[0.62rem] tracking-[0.2em]">
                              怎么考
                            </span>
                          </div>
                          <ul className="mt-1.5 flex flex-col gap-1.5">
                            {stage.exam.methods.map((method) => (
                              <li className="flex flex-col gap-0.5" key={method.name}>
                                <span className="text-ink text-[0.78rem] font-medium">
                                  {method.name}
                                </span>
                                <span className="text-muted-foreground text-[0.72rem] leading-relaxed">
                                  {method.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                      {mainImage && mainImageCaption ? (
                        <figure className="flex flex-col gap-1.5">
                          <button
                            aria-label={`放大查看：${mainImageCaption}`}
                            className="block w-full cursor-zoom-in overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() =>
                              setLightbox({
                                src: mainImage.src,
                                w: mainImage.w,
                                h: mainImage.h,
                                alt: mainImage.alt,
                                credit: mainImage.credit,
                                caption: mainImageCaption,
                              })
                            }
                            type="button"
                          >
                            <img
                              alt={mainImage.alt}
                              className="h-auto w-full border-ink/10 object-cover"
                              height={mainImage.h}
                              loading="lazy"
                              src={mainImage.src}
                              width={mainImage.w}
                            />
                          </button>
                          <figcaption className="text-muted-foreground text-[0.7rem] leading-snug">
                            {mainImageCaption}
                            <span className="text-ink/45"> · {mainImage.credit}</span>
                          </figcaption>
                        </figure>
                      ) : null}
                      <div className="flex flex-col gap-2">
                        {cells.map((detail) => {
                          const detailImage = detail.image;
                          const thumb = detailImage ? EXAM_IMAGES[detailImage.key] : undefined;

                          return (
                            <div
                              className="rounded-lg border border-dashed border-ink/15 bg-paper/60 p-3"
                              key={detail.label}
                            >
                              <span className="font-brush text-vermillion text-sm">
                                {detail.label}
                              </span>
                              <p className="mt-1 text-foreground/85 text-[0.8rem] leading-relaxed">
                                {detail.text}
                              </p>
                              {thumb && detailImage ? (
                                <figure className="mt-2">
                                  <button
                                    aria-label={`放大查看：${detailImage.caption}`}
                                    className="block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    onClick={() =>
                                      setLightbox({
                                        src: thumb.src,
                                        w: thumb.w,
                                        h: thumb.h,
                                        alt: thumb.alt,
                                        credit: thumb.credit,
                                        caption: detailImage.caption,
                                      })
                                    }
                                    type="button"
                                  >
                                    <img
                                      alt={thumb.alt}
                                      className="h-24 w-full object-cover"
                                      height={thumb.h}
                                      loading="lazy"
                                      src={thumb.src}
                                      width={thumb.w}
                                    />
                                  </button>
                                  <figcaption className="mt-1 text-muted-foreground text-[0.68rem] leading-snug">
                                    {detailImage.caption}
                                  </figcaption>
                                </figure>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* 右：读书人晋身之路（漏斗）——lg 下吸顶，不受七站链滚动影响；
            高度不足时卡片内部滚动兜底 */}
        <aside
          aria-label="读书人晋身之路"
          className="flex flex-col gap-3 rounded-xl border border-ink/15 bg-card p-5 lg:sticky lg:top-0 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto"
        >
          <h3 className="font-brush text-ink text-xl">读书人晋身之路</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            从百万童生到三年三百进士：每级人数取通行估算口径。
          </p>
          <ol className="flex flex-col gap-3">
            {ADVANCEMENT_FUNNEL.map((level, index) => {
              const funnelImage = EXAM_IMAGES[level.image.key];

              return (
                <li className="flex flex-col gap-1.5" key={level.identity}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-brush text-ink">{level.identity}</span>
                    <span aria-hidden="true" className="flex gap-[3px]">
                      {Array.from({ length: level.icons }, (_, iconIndex) => (
                        <PersonGlyph key={iconIndex} />
                      ))}
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-1.5 rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-vermillion/70"
                      style={{ width: `${Math.max(12, 100 - index * 22)}%` }}
                    />
                  </div>
                  <span className="font-mono-tech text-muted-foreground text-[0.7rem]">
                    {level.count}
                  </span>
                  <figure className="flex flex-col gap-1">
                    <button
                      aria-label={`放大查看：${level.image.caption}`}
                      className="block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() =>
                        setLightbox({
                          src: funnelImage.src,
                          w: funnelImage.w,
                          h: funnelImage.h,
                          alt: funnelImage.alt,
                          credit: funnelImage.credit,
                          caption: level.image.caption,
                        })
                      }
                      type="button"
                    >
                      <img
                        alt={funnelImage.alt}
                        className="h-24 w-full object-cover"
                        height={funnelImage.h}
                        loading="lazy"
                        src={funnelImage.src}
                        width={funnelImage.w}
                      />
                    </button>
                    <figcaption className="text-muted-foreground text-[0.68rem] leading-snug">
                      {level.image.caption}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ol>
          <p className="border-ink/15 border-t border-dashed pt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            人形为示意个数，不按比例精确绘制；进士每科约二三百名，一甲只三人。
          </p>
        </aside>
      </div>

      {/* 一科三年的节奏轴 */}
      <div className="flex flex-col gap-4 rounded-xl border border-ink/15 bg-card/80 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-brush text-ink text-xl">科举之路时间线 · 每三年一科</h3>
          <span className="font-mono-tech text-muted-foreground text-[0.7rem] tracking-[0.15em]">
            一科跨两年 · 三年一个轮回 · 落第者从乡试再来一遍
          </span>
        </div>
        <ol className="flex flex-col gap-5 sm:flex-row sm:gap-2">
          {EXAM_CADENCE.map((node, index) => (
            <li className="relative flex flex-1 flex-col" key={node.name}>
              <span
                aria-hidden="true"
                className="z-10 h-3 w-3 shrink-0 rounded-full border-2 border-vermillion bg-paper"
              />
              {index < EXAM_CADENCE.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-4 h-full w-px bg-vermillion/30 sm:left-[7px] sm:top-[5px] sm:h-px sm:w-[calc(100%-14px)]"
                />
              ) : null}
              <span className="mt-2 flex flex-col gap-0.5 sm:mt-3">
                <span className="font-brush text-ink text-lg">{node.name}</span>
                <span className="font-mono-tech text-muted-foreground text-[0.7rem] tracking-[0.12em]">
                  {node.time}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-3 gap-3 border-ink/15 border-t border-dashed pt-4 sm:grid-cols-6">
          {EXAM_LEGEND.map((item) => {
            const Icon = LEGEND_ICONS[item.icon];

            return (
              <div className="flex flex-col items-center gap-1 text-center" key={item.title}>
                <Icon aria-hidden="true" className="h-5 w-5 text-vermillion" strokeWidth={1.6} />
                <span className="font-brush text-ink">{item.title}</span>
                <span className="text-[0.68rem] leading-snug text-muted-foreground">
                  {item.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="rounded-xl border border-dashed border-ochre/45 bg-ochre/5 p-5">
        <h3 className="font-brush text-ink text-xl">{SIDE_ROUTES.title}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SIDE_ROUTES.routes.map((route) => (
            <div className="flex flex-col gap-1" key={route.name}>
              <span className="font-brush text-lg text-ink">{route.name}</span>
              <span className="text-muted-foreground text-sm leading-relaxed">{route.detail}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-dashed border-ochre/40 pt-3 text-muted-foreground text-sm">
          {SIDE_ROUTES.note}
        </p>
      </aside>

      <footer className="flex flex-col gap-3 border-ink/20 border-t border-dashed pt-5">
        <h2 className="font-brush text-ink text-xl">图片出处</h2>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {EXAM_IMAGE_CREDITS.map((image) => (
            <li className="text-muted-foreground text-xs leading-relaxed" key={image.src}>
              <a
                className="text-foreground/80 underline decoration-dotted underline-offset-2 transition-colors hover:text-vermillion"
                href={image.url}
                rel="noreferrer"
                target="_blank"
              >
                {image.credit}
              </a>
              <span aria-hidden="true"> — </span>
              {image.caption}
            </li>
          ))}
        </ul>
      </footer>

      {lightbox ? <ImageLightbox image={lightbox} onClose={() => setLightbox(null)} /> : null}
    </section>
  );
}

/** 子页二：历代官途——逐朝拆解入仕与晋升 + 履历样本。 */
function DynastiesSection() {
  const [activeId, setActiveId] = useState(DEFAULT_DYNASTY_ID);
  const activeDynasty = getDynastyPath(activeId) ?? IMPERIAL_EXAM_DYNASTIES[0];

  return (
    <section aria-label="历代官途" className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-6">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">第二程 · 逐朝拆解</span>
        <h2 className="font-brush text-3xl text-ink">历代官途：怎么做官，怎么晋升</h2>
      </div>

      {/* 朝代选择吸顶：主滚动容器是 <main>（站点头占独立布局空间，top-0 即其下缘）；
          背景带横负边距外扩，滚动时卡片不至于从 chips 缝隙里透出来 */}
      <fieldset
        aria-label="朝代选择"
        className="sticky top-0 z-10 -mx-3 my-0 flex min-w-0 flex-wrap gap-2 border-0 bg-paper p-3 shadow-[0_1px_0_0_hsl(var(--ink)/0.08)]"
      >
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
  );
}

/** 子页三：对照一览——横向对照表 + 资料出处。 */
function CompareSection() {
  return (
    <section
      aria-label="历代官途对照"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 pt-6"
    >
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

      <footer className="mt-4 flex flex-col gap-3 border-ink/20 border-t border-dashed pt-5">
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
    </section>
  );
}

/**
 * 科举之路：三个子页共用一版式——左侧条目目录、右侧内容；
 * 沿革与链路拆分为 登科之阶 / 历代官途 / 对照一览 三个条目。
 */
export function ImperialExamPage({ sectionId }: { sectionId: string }) {
  const section = getImperialExamSection(sectionId);

  if (!section) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-20">
        <span className="eyebrow">科举之路</span>
        <h1 className="font-brush text-4xl text-ink sm:text-5xl">条目尚未收录</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          这一条目还没有对应专题页。可以从「全览地图」进入已开放的条目。
        </p>
      </section>
    );
  }

  return (
    <ImperialExamShell activeSectionId={section.id} description={PAGE_DESCRIPTION}>
      {section.id === "stages" ? <StagesSection /> : null}
      {section.id === "dynasties" ? <DynastiesSection /> : null}
      {section.id === "compare" ? <CompareSection /> : null}
    </ImperialExamShell>
  );
}
