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
import {
  ABOUT_CONTENT_ITEMS,
  HOME_ENTRY_ROUTES,
  type HomeEntryIcon,
  READING_GUIDES,
} from "./page-resources";

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
            左右翻阅各专题入口：已开放的内容可直接进入，筹备中的新专题只作预告，不打断阅读动线。
          </p>
        </div>

        <HomeEntryCarousel label="核心入口与后续专题">
          {HOME_ENTRY_ROUTES.map((entry) => {
            const Icon = ENTRY_ICONS[entry.icon];

            // 筹备中条目留在同一卷轴里，但用虚线纸页与「筹备中」印标明确保持不可点击。
            if (entry.status !== "available" || !entry.path) {
              return (
                <article
                  key={entry.title}
                  aria-disabled="true"
                  className="index-card index-card-preview group relative flex min-h-52 flex-col gap-4 overflow-hidden p-6 text-left"
                >
                  <span className="absolute right-5 top-5 rounded-full border border-ink/20 px-2 py-0.5 font-body text-[0.7rem] text-muted-foreground">
                    筹备中
                  </span>
                  <Icon aria-hidden="true" className="h-8 w-8 text-ink/40" />
                  {/* 标题恒占两行、描述恒占三行：与已开放卡片保持同一基线 */}
                  <div className="flex flex-col gap-2">
                    <span className="line-clamp-2 min-h-[2.5em] font-brush text-3xl leading-[1.25] text-ink/70">
                      {entry.title}
                    </span>
                    <span
                      className="line-clamp-3 min-h-[4.5em] text-muted-foreground/80 text-sm leading-[1.5]"
                      title={entry.description}
                    >
                      {entry.description}
                    </span>
                  </div>
                  <span className="relative z-10 mt-auto font-mono-tech text-xs tracking-[0.25em] text-muted-foreground uppercase">
                    敬请期待
                  </span>
                </article>
              );
            }

            return (
              <Link
                key={entry.title}
                to={entry.path}
                className="group index-card relative flex min-h-52 flex-col gap-4 overflow-hidden p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
              >
                <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-70" />
                <Icon className="h-8 w-8 text-vermillion transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                <div className="flex flex-col gap-2">
                  <span className="line-clamp-2 min-h-[2.5em] font-brush text-3xl leading-[1.25] text-ink">
                    {entry.title}
                  </span>
                  <span
                    className="line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm leading-[1.5]"
                    title={entry.description}
                  >
                    {entry.description}
                  </span>
                </div>
                <span className="relative z-10 mt-auto flex items-center gap-1.5 font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase sm:text-sm">
                  进入
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </HomeEntryCarousel>
      </section>

      <section
        className="home-section-panel reveal flex flex-col gap-12"
        style={{ animationDelay: "350ms" }}
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="eyebrow">关于内容</span>
          <h2 className="font-brush text-4xl text-ink">如何阅读中国古代全览</h2>
          <p className="max-w-xl text-muted-foreground">
            全览按「先立朝代坐标、再读治国制度、后及边疆与交通」的次第展开。沿下面的路径逐层深入，
            可把分散的专题读成一条线索。
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow">内容结构</span>
            <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
              沿次第逐层深入
            </span>
          </div>
          <ol className="reading-path-list">
            {ABOUT_CONTENT_ITEMS.map((item, index) => (
              <li key={item.title} className="reading-path-step">
                <span className="reading-path-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="reading-path-body">
                  <span className="font-brush text-2xl text-ink">{item.title}</span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{item.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow">读法提示</span>
            <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
              按图索骥 · 随题追问
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {READING_GUIDES.map(({ icon, title, text }, index) => {
              const Icon = ENTRY_ICONS[icon];

              return (
                <div key={title} className="guide-card flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
                      读法 {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon aria-hidden="true" className="h-6 w-6 text-vermillion" />
                  </div>
                  <span className="font-brush text-xl text-ink">{title}</span>
                  <span className="text-muted-foreground text-sm">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
