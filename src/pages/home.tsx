import {
  ArrowRight,
  BookOpen,
  Building2,
  Castle,
  Compass,
  Crown,
  FileText,
  Flame,
  Gavel,
  Globe,
  Hammer,
  History,
  Landmark,
  MapIcon,
  Mountain,
  Palette,
  Scale,
  ScrollText,
  Shield,
  Swords,
  Tent,
  TreePine,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { HomeEntryCarousel } from "../components/home-entry-carousel";
import type { HomeOutletContext } from "../components/layout/root-layout";
import { Button } from "../components/ui/button";
import {
  ALL_RESOURCE_DIMENSIONS,
  matchesResourceDimension,
  RESOURCE_DIMENSION_FILTERS,
  type ResourceDimensionFilter,
} from "../lib/resource-dimensions";
import { cn } from "../lib/utils";
import { HOME_ENTRY_ROUTES, type HomeEntryIcon } from "./page-resources";

const ENTRY_ICONS: Record<HomeEntryIcon, typeof Landmark> = {
  "book-open": BookOpen,
  compass: Compass,
  landmark: Landmark,
  map: MapIcon,
  palette: Palette,
  "scroll-text": ScrollText,
  castle: Castle,
  crown: Crown,
  flame: Flame,
  gavel: Gavel,
  globe: Globe,
  hammer: Hammer,
  history: History,
  mountain: Mountain,
  scale: Scale,
  shield: Shield,
  swords: Swords,
  tent: Tent,
  "tree-pine": TreePine,
  users: Users,
  building2: Building2,
  "file-text": FileText,
};

export function HomePage() {
  // 入场门控由 RootLayout 拥有（遮罩、header 显隐、7 天标记都在那里）。
  // 独立渲染（无 Outlet context）时默认视为已进入，正文直接可见。
  const outletContext = useOutletContext<HomeOutletContext | null>();
  const hasEnteredHome = outletContext?.homeEntered ?? true;

  const [dimension, setDimension] = useState<ResourceDimensionFilter>(ALL_RESOURCE_DIMENSIONS);
  // 维度只筛选项，不生成新条目；「全览」仍保持原有顺序与数量。
  const entries = useMemo(
    () =>
      HOME_ENTRY_ROUTES.filter((entry) => matchesResourceDimension(entry.dimensions, dimension)),
    [dimension],
  );
  // 当前维度下的首张截图才是 LCP 候选，切换维度后优先抓取的图随之更新。
  const firstScreenshotIndex = entries.findIndex((entry) => Boolean(entry.screenshot));

  return (
    <div
      className={cn(
        "home-stage mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20 transition-opacity duration-500",
        hasEnteredHome ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="home-china-motif" aria-hidden="true">
        <span className="home-cloud home-cloud-left" />
        <span className="home-cloud home-cloud-right" />
        <span className="home-mountain-line" />
        <span className="home-orbit-mark" />
        <span className="home-seal-mark">史</span>
      </div>

      <header className="flex flex-col gap-7">
        <h1
          className="reveal font-brush text-6xl leading-[1.05] tracking-tight text-ink sm:text-8xl"
          style={{ animationDelay: "70ms" }}
        >
          <span className="ink-underline inline-block mb-2">中国古代全览</span>
          <br />
          <span className="font-brush text-vermillion">以编年为经，通览治乱兴替。</span>
        </h1>

        <p
          className="reveal max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          style={{ animationDelay: "140ms" }}
        >
          汇总中国古代史中的朝代更替、人物政事、制度沿革与边疆民族线索，
          以编年体的视角组织材料，方便在同一脉络下考察兴亡得失与治国方略。
        </p>

        <div
          className="reveal flex flex-wrap items-center gap-4"
          style={{ animationDelay: "210ms" }}
        >
          <Button
            asChild
            className="btn-ink rounded-sm bg-vermillion px-6 font-kai text-sm font-semibold text-primary-foreground hover:bg-vermillion"
          >
            <Link to="/china/timeline">
              进入时间长河
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-sm font-kai text-sm font-semibold text-ink underline-offset-4 hover:bg-transparent hover:underline"
          >
            <Link to="/china/policies">
              <BookOpen className="mr-2 h-4 w-4" />
              查看政策全览
            </Link>
          </Button>
        </div>
      </header>

      <section
        className="home-section-panel reveal flex flex-col gap-8"
        style={{ animationDelay: "280ms" }}
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="font-brush text-4xl text-ink">核心入口与后续专题</h2>
          <p className="max-w-md text-muted-foreground">
            逐一预览各专题的真实页面：每张截图附读图注释，点击可直接进入；筹备中的新专题只作预告。
          </p>
        </div>

        <div aria-label="入口维度" className="home-dimension-tabs" role="tablist">
          {RESOURCE_DIMENSION_FILTERS.map(({ id, label }) => (
            <button
              aria-selected={dimension === id}
              className={cn("home-dimension-tab", dimension === id && "is-active")}
              key={id}
              onClick={() => setDimension(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 维度变化时重挂载：位置、暂停状态与自动播放计时一起归零，
            旧维度的当前页下标不会落进新维度的幻灯片里。 */}
        <HomeEntryCarousel key={dimension} label="核心入口与后续专题">
          {entries.map((entry, index) => {
            const Icon = ENTRY_ICONS[entry.icon];

            // 筹备中条目保持不可点击，用虚线纸页与「筹备中」印明确标示。
            if (entry.status !== "available" || !entry.path) {
              return (
                <article
                  key={entry.title}
                  aria-disabled="true"
                  className="home-feature-card index-card-preview flex flex-col gap-4 p-6 text-left"
                >
                  <span className="self-start rounded-full border border-ink/20 px-2 py-0.5 font-body text-[0.7rem] text-muted-foreground">
                    筹备中
                  </span>
                  <Icon aria-hidden="true" className="h-10 w-10 text-ink/40" />
                  <span className="font-brush text-4xl leading-tight text-ink/70">
                    {entry.title}
                  </span>
                  <span className="text-muted-foreground">{entry.description}</span>
                  <span className="mt-auto font-kai text-xs text-muted-foreground">敬请期待</span>
                </article>
              );
            }

            return (
              <Link
                key={entry.title}
                to={entry.path}
                className="home-feature-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
              >
                <div className="home-feature-shot">
                  {entry.screenshot ? (
                    <img
                      src={`/home-screenshots/${entry.screenshot}`}
                      alt={`${entry.title}页面截图`}
                      decoding="async"
                      fetchPriority={index === firstScreenshotIndex ? "high" : undefined}
                      loading={index === firstScreenshotIndex ? undefined : "lazy"}
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Icon aria-hidden="true" className="h-12 w-12 text-vermillion/50" />
                    </div>
                  )}
                  <span className="home-feature-shot-badge">功能页面截图</span>
                </div>
                <div className="home-feature-body">
                  <span className="font-brush text-4xl leading-tight text-ink">{entry.title}</span>
                  <span className="text-muted-foreground">{entry.description}</span>
                  {entry.note ? (
                    <div className="home-feature-note flex flex-col gap-1">
                      <span className="font-kai text-[0.7rem] text-vermillion">读图注释</span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {entry.note}
                      </span>
                    </div>
                  ) : null}
                  <span className="mt-auto flex items-center gap-1.5 font-kai text-xs text-vermillion sm:text-sm">
                    进入专题
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </HomeEntryCarousel>
      </section>
    </div>
  );
}
