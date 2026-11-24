import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "../lib/utils";

const AUTOPLAY_MS = 6500;

function matchesMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}

function prefersReducedMotion(): boolean {
  // 检测不到媒体查询能力时保守处理：宁可不自动播放，也不强加动效。
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface HomeEntryCarouselProps {
  children: ReactNode;
  label: string;
}

/**
 * 首页「核心入口」的大图轮播：一次只呈现一张功能预览，靠透明度缓慢交替，
 * 不做横向整屏滑动。箭头、分页点与方向键复用同一当前位置；自动播放间隔
 * 较长，并在悬停、聚焦与减少动态效果偏好下暂停。
 *
 * 所有幻灯片常驻 DOM 且不设 inert / aria-hidden：它们是导航链接，键盘与
 * 读屏器需要一次拿到全部入口；非当前页靠 :focus-within 浮出以便 Tab 可达。
 * 当前页的分页点（窄屏则是控件条细线）带一条自动播放进度，暂停、聚焦与
 * 减少动效时卸载，恢复时重新挂载，让进度与定时器从同一起点走。
 */
export function HomeEntryCarousel({ children, label }: HomeEntryCarouselProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const total = slides.length;

  const [active, setActive] = useState(0);
  const [showDots, setShowDots] = useState(() => matchesMedia("(min-width: 640px)"));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaLists = [
      window.matchMedia("(min-width: 640px)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    ];
    const sync = () => {
      setShowDots(matchesMedia("(min-width: 640px)"));
      setReducedMotion(prefersReducedMotion());
    };
    for (const mediaList of mediaLists) {
      mediaList.addEventListener?.("change", sync);
    }
    return () => {
      for (const mediaList of mediaLists) {
        mediaList.removeEventListener?.("change", sync);
      }
    };
  }, []);

  const goTo = useCallback(
    (target: number) => {
      if (total === 0) {
        return;
      }
      setActive(((target % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(active + 1), [goTo, active]);
  const previous = useCallback(() => goTo(active - 1), [goTo, active]);

  // 进度条只在「真的会自动翻页」时出现。暂停 / 减少动效 / 单张时卸载，
  // 恢复时重新挂载，动画从 0 开始，正好对上 setInterval 的重启。
  const isPlaying = total > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (total <= 1 || paused || reducedMotion) {
      return;
    }
    const timer = window.setInterval(() => goTo(active + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [total, paused, reducedMotion, active, goTo]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  }

  return (
    <section
      className="home-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <ol className="home-carousel-stage">
        {slides.map((slide, index) => (
          <li
            key={index}
            className={cn("home-carousel-slide", index === active && "is-active")}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${total}`}
          >
            {slide}
          </li>
        ))}
      </ol>

      <div className="home-carousel-controls">
        <span className="home-carousel-count whitespace-nowrap font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground">
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        {showDots ? (
          <div className="home-carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn("home-carousel-dot", index === active && "is-active")}
                aria-label={`第 ${index + 1} 组`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
              >
                {index === active && isPlaying ? (
                  <span
                    aria-hidden="true"
                    className="home-carousel-progress"
                    key={active}
                    style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="home-carousel-arrow"
            aria-label="上一组"
            onClick={previous}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" className="home-carousel-arrow" aria-label="下一组" onClick={next}>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          当前第 {active + 1} 个入口，共 {total} 个
        </span>
        {isPlaying ? (
          <span aria-hidden="true" className="home-carousel-mobile-progress sm:hidden">
            <span
              className="home-carousel-progress"
              key={active}
              style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
            />
          </span>
        ) : null}
      </div>
    </section>
  );
}
