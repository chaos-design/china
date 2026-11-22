import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeEntryCarousel } from "./home-entry-carousel";

interface MediaController {
  setWidth(width: number): void;
  setReduceMotion(reduce: boolean): void;
  fireChange(query: string): void;
}

function setMedia(width: number, reduceMotion = false): MediaController {
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width: 640px")
      ? width >= 640
      : query.includes("prefers-reduced-motion")
        ? reduceMotion
        : false,
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: () => void) => {
      const set = listeners.get(query) ?? new Set();
      set.add(listener);
      listeners.set(query, set);
    },
    removeEventListener: (_: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return {
    setWidth(value) {
      width = value;
    },
    setReduceMotion(value) {
      reduceMotion = value;
    },
    fireChange(query) {
      for (const [key, set] of listeners) {
        if (key.includes(query)) {
          for (const listener of set) {
            listener();
          }
        }
      }
    },
  };
}

function slides(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <a key={index} href={`/entry-${index + 1}`}>
      入口 {index + 1}
    </a>
  ));
}

function setupViewport(scrollWidth: number, clientWidth: number) {
  const viewport = document.querySelector<HTMLElement>(".home-carousel-viewport") as HTMLElement;
  let left = 0;
  Object.defineProperty(viewport, "scrollWidth", { configurable: true, get: () => scrollWidth });
  Object.defineProperty(viewport, "clientWidth", { configurable: true, get: () => clientWidth });
  Object.defineProperty(viewport, "scrollLeft", {
    configurable: true,
    get: () => left,
    set: (value: number) => {
      left = value;
    },
  });
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    left = options.left ?? 0;
  });
  Object.defineProperty(viewport, "scrollTo", { configurable: true, value: scrollTo });
  return {
    viewport,
    scrollTo,
    setLeft(value: number) {
      left = value;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("<HomeEntryCarousel />", () => {
  it("横向卷轴保留全部幻灯片，分页点按卡片展开", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(document.querySelector(".home-carousel-viewport")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem", { name: /\/ 7$/ })).toHaveLength(7);
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(screen.getByText("01 / 07")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^第 \d+ 组$/ })).toHaveLength(7);
  });

  it("箭头按卡片滚动，首尾循环", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);
    const { viewport, scrollTo, setLeft } = setupViewport(1100, 500);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(scrollTo).toHaveBeenCalledWith({ left: 100, behavior: "smooth" });
    setLeft(100);
    fireEvent.scroll(viewport);
    expect(screen.getByText("02 / 07")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "第 2 组" })).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });

    setLeft(0);
    fireEvent.scroll(viewport);
    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: "smooth" });
  });

  it("分页点直接跳到对应卡片", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(1100, 500);

    fireEvent.click(screen.getByRole("button", { name: "第 5 组" }));
    expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
    expect(screen.getByRole("button", { name: "第 5 组" })).toHaveAttribute("aria-current", "true");
  });

  it("方向键翻页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(1100, 500);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: "smooth" });
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });
  });

  it("原生横向滚动更新页码", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);
    const { viewport, setLeft } = setupViewport(1100, 500);

    setLeft(300);
    fireEvent.scroll(viewport);
    expect(screen.getByText("04 / 07")).toBeInTheDocument();
  });

  it("单张卡片时不翻页也不报错", () => {
    setMedia(1280);
    vi.useFakeTimers();
    render(<HomeEntryCarousel label="核心入口">{slides(1)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(500, 500);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    act(() => vi.advanceTimersByTime(21000));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
  });

  it("自动播放按周期推进，悬停暂停、离开恢复", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const { viewport, scrollTo } = setupViewport(800, 200);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(viewport).toBeInTheDocument();
  });

  it("聚焦暂停、失焦恢复自动播放", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(800, 200);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    fireEvent.focusIn(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.focusOut(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("减少动态效果时使用即时滚动且不自动播放", () => {
    vi.useFakeTimers();
    setMedia(375, true);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(800, 200);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: "instant" });
    act(() => vi.advanceTimersByTime(21000));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("运行中断点与偏好变化会同步分页点与自动播放", () => {
    vi.useFakeTimers();
    const media = setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(800, 200);
    expect(screen.queryByRole("button", { name: "第 1 组" })).not.toBeInTheDocument();

    act(() => {
      media.setWidth(1280);
      media.fireChange("min-width: 640px");
    });
    expect(screen.getAllByRole("button", { name: /^第 \d+ 组$/ })).toHaveLength(4);

    act(() => {
      media.setReduceMotion(true);
      media.fireChange("prefers-reduced-motion");
    });
    act(() => vi.advanceTimersByTime(21000));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("没有 matchMedia 时不渲染分页点且不自动播放", () => {
    vi.stubGlobal("matchMedia", undefined);
    vi.useFakeTimers();
    render(<HomeEntryCarousel label="核心入口">{slides(2)}</HomeEntryCarousel>);
    const { scrollTo } = setupViewport(400, 200);

    expect(screen.queryByRole("button", { name: "第 1 组" })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
