import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  type KeyboardEvent,
  type ReactNode,
  type TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/utils";

const AUTOPLAY_MS = 6500;
/** 横向滑动超过这个距离才翻页，避免点链接时被误判成手势。 */
const SWIPE_THRESHOLD_PX = 48;

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
 * 不做横向整屏滑动（触屏短划只翻页）。箭头、分页点、方向键与手势复用同一
 * 当前位置；自动播放间隔较长，并在悬停、聚焦、标签页隐藏与减少动效下暂停。
 *
 * 所有幻灯片常驻 DOM 且不设 inert / aria-hidden：它们是导航链接，键盘与
 * 读屏器需要一次拿到全部入口；非当前页靠 :focus-within 浮出以便 Tab 可达。
 * 当前页的分页点（窄屏则是控件条细线）带一条自动播放进度，暂停、聚焦与
 * 减少动效时卸载，恢复时重新挂载，让进度与计时器从同一起点走。
 */
export function HomeEntryCarousel({ children, label }: HomeEntryCarouselProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const total = slides.length;

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [showDots, setShowDots] = useState(() => matchesMedia("(min-width: 640px)"));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  // 标签页切到后台时暂停：回来后从剩余时间重新走，不会出现一瞬间连跳好几页。
  useEffect(() => {
    const sync = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const goTo = useCallback(
    (target: number, nextDirection: "next" | "previous" = "next") => {
      if (total === 0) {
        return;
      }
      setDirection(nextDirection);
      setActive(((target % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(active + 1, "next"), [goTo, active]);
  const previous = useCallback(() => goTo(active - 1, "previous"), [goTo, active]);

  // 进度条只在「真的会自动翻页」时出现。暂停 / 减少动效 / 后台 / 单张时卸载，
  // 恢复时重新挂载，动画从 0 开始，正好对下计时器的重启。
  const isPlaying = total > 1 && !paused && !reducedMotion && !documentHidden;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = window.setTimeout(() => goTo(active + 1, "next"), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, goTo, isPlaying]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) {
      return;
    }
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    // 斜向滚动交给页面；只有明确的横向短划才翻页。
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    if (deltaX < 0) {
      next();
    } else {
      previous();
    }
  }

  return (
    <section
      className="home-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      data-direction={direction}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <ol className="home-carousel-stage" data-direction={direction}>
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
                onClick={() => goTo(index, index > active ? "next" : "previous")}
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
