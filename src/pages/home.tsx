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
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { HomeEntranceAnimation } from "../components/home-entrance-animation";
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

export const HOME_ENTRANCE_SESSION_KEY = "home-entrance-scroll-shown";

function hasShownHomeEntrance() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(HOME_ENTRANCE_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function markHomeEntranceShown() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(HOME_ENTRANCE_SESSION_KEY, "true");
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

export function HomePage() {
  const [hasEnteredHome, setHasEnteredHome] = useState(hasShownHomeEntrance);

  useEffect(() => {
    if (!hasEnteredHome) {
      markHomeEntranceShown();
    }
  }, [hasEnteredHome]);

  const enterHome = useCallback(() => {
    markHomeEntranceShown();
    setHasEnteredHome(true);
  }, []);

  return (
    <>
      {hasEnteredHome ? null : <HomeEntranceAnimation onComplete={enterHome} />}

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
              以“已开放可进入、筹备中可预览”的同一套卡片组织材料，方便从朝代脉络延展到制度、
              边疆与交通线索。
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {HOME_ENTRY_ROUTES.map((entry) => {
              const Icon = ENTRY_ICONS[entry.icon];
              const content = (
                <>
                  <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-70" />
                  <Icon className="h-8 w-8 text-vermillion transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  <div className="flex flex-col gap-2 relative z-10">
                    <span className="font-brush text-3xl text-ink">{entry.title}</span>
                    <span className="text-muted-foreground text-sm leading-relaxed">
                      {entry.description}
                    </span>
                  </div>
                  <span className="relative z-10 font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase sm:text-sm">
                    {entry.status === "available" ? "进入" : "筹备中"}
                  </span>
                </>
              );

              return entry.path ? (
                <Link
                  key={entry.title}
                  to={entry.path}
                  className="group index-card relative flex min-h-52 overflow-hidden flex-col justify-between gap-6 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={entry.title}
                  aria-disabled="true"
                  className="group index-card index-card-preview relative flex min-h-52 cursor-default overflow-hidden flex-col justify-between gap-6 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="home-section-panel reveal flex flex-col gap-10"
          style={{ animationDelay: "350ms" }}
        >
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="eyebrow">关于内容</span>
            <h2 className="font-brush text-4xl text-ink">如何阅读中国古代全览</h2>
            <p className="max-w-xl text-muted-foreground">
              阅读区与上方入口共享同一套专题语言：先定位朝代坐标，再对照治国政策，
              最后把筹备中的边疆、制度和交通方向作为后续追问。
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-[auto_1fr] sm:gap-16">
            <span className="eyebrow self-start">内容结构</span>
            <ol className="flex flex-col">
              {ABOUT_CONTENT_ITEMS.map((item, index) => (
                <li
                  key={item.title}
                  className={`flex items-start gap-5 py-5 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <span className="font-display text-2xl font-black text-vermillion">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-brush text-2xl text-ink">{item.title}</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {READING_GUIDES.map(({ icon, title, text }) => {
              const Icon = ENTRY_ICONS[icon];

              return (
                <div key={title} className="guide-card flex flex-col gap-3 p-6">
                  <Icon className="h-6 w-6 text-vermillion" />
                  <span className="font-brush text-xl text-ink">{title}</span>
                  <span className="text-muted-foreground text-sm">{text}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
