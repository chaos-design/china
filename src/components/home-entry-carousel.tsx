import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/utils";

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_START_PX = 6;

function matchesMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}

function readSlidesPerView(): number {
  if (matchesMedia("(min-width: 1024px)")) {
    return 3;
  }
  if (matchesMedia("(min-width: 640px)")) {
    return 2;
  }
  return 1;
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
 * 首页「核心入口」的卷轴式轮播：一次翻过 perView 张卡片，支持箭头、分页点、
 * 左右方向键、触摸滑动与自动播放。悬停 / 聚焦暂停，减少动态效果偏好下不自动播放。
 * 所有幻灯片始终留在 DOM 中（不做虚拟化），既有链接对路由测试与读屏器都可见。
 */
export function HomeEntryCarousel({ children, label }: HomeEntryCarouselProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const total = slides.length;

  const [perView, setPerView] = useState(readSlidesPerView);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [dragX, setDragX] = useState(0);

  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);

  const pages = Math.max(1, Math.ceil(total / perView));

  // 断点与减少动态效果偏好都可能在运行中变化（旋转屏幕、系统设置）。
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaLists = [
      window.matchMedia("(min-width: 640px)"),
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    ];
    const sync = () => {
      setPerView(readSlidesPerView());
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

  // 视口变宽、总页数变少时，把当前页收回合法范围。
  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1));
  }, [pages]);

  useEffect(() => {
    if (pages <= 1 || paused || reducedMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % pages);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [pages, paused, reducedMotion]);

  const goTo = useCallback(
    (target: number) => {
      setPage(((target % pages) + pages) % pages);
    },
    [pages],
  );
  const next = useCallback(() => goTo(page + 1), [goTo, page]);
  const previous = useCallback(() => goTo(page - 1), [goTo, page]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    dragStart.current = event.clientX;
    dragged.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (dragStart.current === null) {
      return;
    }
    const delta = event.clientX - dragStart.current;
    if (Math.abs(delta) > DRAG_START_PX) {
      if (!dragged.current) {
        dragged.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
      setDragX(delta);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (dragStart.current === null) {
      return;
    }
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    setDragX(0);
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta < 0) {
        next();
      } else {
        previous();
      }
    }
  }

  function handlePointerCancel() {
    dragStart.current = null;
    dragged.current = false;
    setDragX(0);
  }

  // 拖完松手会补发一次 click，吞掉它，避免误入恰好位于手指下的卡片。
  function handleClickCapture(event: MouseEvent<HTMLElement>) {
    if (!dragged.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
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
      <div className="home-carousel-viewport">
        <ol
          className="home-carousel-track"
          style={{
            transform: `translate3d(calc(-${page * 100}% + ${dragX}px), 0, 0)`,
            transition: dragX === 0 ? undefined : "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClickCapture={handleClickCapture}
        >
          {slides.map((slide, index) => (
            <li
              key={index}
              className="home-carousel-slide"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${total}`}
              style={{ flexBasis: `${100 / perView}%` }}
            >
              {slide}
            </li>
          ))}
        </ol>
      </div>

      <div className="home-carousel-controls">
        <span className="home-carousel-count whitespace-nowrap font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground">
          {String(page + 1).padStart(2, "0")} / {String(pages).padStart(2, "0")}
        </span>
        {perView > 1 ? (
          <div className="home-carousel-dots">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                className={cn("home-carousel-dot", index === page && "is-active")}
                aria-label={`第 ${index + 1} 组`}
                aria-current={index === page ? "true" : undefined}
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
          当前第 {page + 1} 组，共 {pages} 组
        </span>
      </div>
    </section>
  );
}
