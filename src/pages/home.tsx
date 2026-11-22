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
import { Link, useOutletContext } from "react-router-dom";

import { HomeEntryCarousel } from "../components/home-entry-carousel";
import type { HomeOutletContext } from "../components/layout/root-layout";
import { Button } from "../components/ui/button";
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
            className="btn-ink rounded-sm bg-vermillion px-6 font-mono-tech text-sm font-semibold tracking-wide text-primary-foreground uppercase hover:bg-vermillion"
          >
            <Link to="/china/timeline">
              进入时间长河
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-sm font-mono-tech text-sm font-semibold tracking-wide text-ink uppercase underline-offset-4 hover:bg-transparent hover:underline"
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
          <span className="eyebrow">内容入口</span>
          <h2 className="font-brush text-4xl text-ink">核心入口与后续专题</h2>
          <p className="max-w-md text-muted-foreground">
            逐一预览各专题的真实页面：每张截图附读图注释，点击可直接进入；筹备中的新专题只作预告。
          </p>
        </div>

        <HomeEntryCarousel label="核心入口与后续专题">
          {HOME_ENTRY_ROUTES.map((entry) => {
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
                  <span className="mt-auto font-mono-tech text-xs tracking-[0.25em] text-muted-foreground uppercase">
                    敬请期待
                  </span>
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
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Icon aria-hidden="true" className="h-12 w-12 text-vermillion/50" />
                    </div>
                  )}
                  <span className="home-feature-shot-badge">功能页面截图</span>
                </div>
                <div className="home-feature-body">
                  <span className="eyebrow">专题预览</span>
                  <span className="font-brush text-4xl leading-tight text-ink">{entry.title}</span>
                  <span className="text-muted-foreground">{entry.description}</span>
                  {entry.note ? (
                    <div className="home-feature-note flex flex-col gap-1">
                      <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
                        读图注释
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {entry.note}
                      </span>
                    </div>
                  ) : null}
                  <span className="mt-auto flex items-center gap-1.5 font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase sm:text-sm">
                    进入专题
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
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
