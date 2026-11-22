import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/utils";

const AUTOPLAY_MS = 7000;

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
 * 首页「核心入口」的横向卷轴：原生 overflow-x + scroll-snap，手指可直接横划，
 * 下一张卡片露出边缘提示可继续翻阅。箭头、分页点、方向键与自动播放都落在同一个
 * 滚动位置上。所有幻灯片常驻 DOM（不虚拟化），链接对测试与读屏器始终可见。
 */
export function HomeEntryCarousel({ children, label }: HomeEntryCarouselProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const total = slides.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);

  const [position, setPosition] = useState(0);
  const [showDots, setShowDots] = useState(() => matchesMedia("(min-width: 640px)"));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  // 断点与减少动态效果偏好都可能在运行中变化（旋转屏幕、系统设置）。
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
      const viewport = viewportRef.current;
      if (!viewport || total <= 1) {
        return;
      }
      const next = Math.max(0, Math.min(total - 1, target));
      // 末尾留白让最后一张也能吸附到起点，因此滚动位置与卡片序号线性对应。
      const range = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const left = (next / (total - 1)) * range;
      positionRef.current = next;
      setPosition(next);

      const behavior: ScrollBehavior = reducedMotion ? "instant" : "smooth";
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ left, behavior });
      } else {
        viewport.scrollLeft = left;
      }
    },
    [total, reducedMotion],
  );

  function handleScroll() {
    const viewport = viewportRef.current;
    if (!viewport || total <= 1) {
      return;
    }
    const range = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
    const next = Math.max(
      0,
      Math.min(total - 1, Math.round((viewport.scrollLeft / range) * (total - 1))),
    );
    positionRef.current = next;
    setPosition(next);
  }

  const next = useCallback(() => goTo((positionRef.current + 1) % total), [goTo, total]);
  const previous = useCallback(
    () => goTo((positionRef.current - 1 + total) % total),
    [goTo, total],
  );

  useEffect(() => {
    if (total <= 1 || paused || reducedMotion) {
      return;
    }
    const timer = window.setInterval(() => goTo((positionRef.current + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [total, paused, reducedMotion, goTo]);

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
      <div className="home-carousel-viewport" ref={viewportRef} onScroll={handleScroll}>
        <ol className="home-carousel-track">
          {slides.map((slide, index) => (
            <li
              key={index}
              className="home-carousel-slide"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${total}`}
            >
              {slide}
            </li>
          ))}
        </ol>
      </div>

      <div className="home-carousel-controls">
        <span className="home-carousel-count whitespace-nowrap font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground">
          {String(position + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        {showDots ? (
          <div className="home-carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn("home-carousel-dot", index === position && "is-active")}
                aria-label={`第 ${index + 1} 组`}
                aria-current={index === position ? "true" : undefined}
                onClick={() => goTo(index)}
              />
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
          当前第 {position + 1} 个入口，共 {total} 个
        </span>
      </div>
    </section>
  );
}
