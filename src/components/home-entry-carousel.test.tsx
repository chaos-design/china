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

function stageSlides() {
  return Array.from(document.querySelectorAll<HTMLElement>(".home-carousel-slide"));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("<HomeEntryCarousel />", () => {
  it("全部幻灯片常驻 DOM，首张为当前页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(document.querySelector(".home-carousel-stage")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(7);

    const items = stageSlides();
    expect(items).toHaveLength(7);
    expect(items[0]).toHaveClass("is-active");
    expect(items[1]).not.toHaveClass("is-active");
    expect(screen.getByText("01 / 07")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^第 \d+ 组$/ })).toHaveLength(7);
  });

  it("箭头切换当前页并循环", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(stageSlides()[1]).toHaveClass("is-active");
    expect(screen.getByText("02 / 07")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "第 2 组" })).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(stageSlides()[0]).toHaveClass("is-active");

    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(stageSlides()[6]).toHaveClass("is-active");
    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(stageSlides()[0]).toHaveClass("is-active");
  });

  it("分页点直接跳到对应页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    fireEvent.click(screen.getByRole("button", { name: "第 5 组" }));
    expect(stageSlides()[4]).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "第 5 组" })).toHaveAttribute("aria-current", "true");
  });

  it("方向键翻页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(stageSlides()[1]).toHaveClass("is-active");
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(stageSlides()[0]).toHaveClass("is-active");
  });

  it("单张卡片时翻页不报错", () => {
    setMedia(1280);
    vi.useFakeTimers();
    render(<HomeEntryCarousel label="核心入口">{slides(1)}</HomeEntryCarousel>);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    act(() => vi.advanceTimersByTime(21000));
    expect(stageSlides()[0]).toHaveClass("is-active");
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
  });

  it("慢速自动播放，悬停暂停、离开恢复", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[1]).toHaveClass("is-active");

    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[1]).toHaveClass("is-active");

    fireEvent.mouseLeave(carousel);
    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[2]).toHaveClass("is-active");
  });

  it("聚焦暂停、失焦恢复自动播放", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
    const carousel = screen.getByRole("region", { name: "核心入口" });

    fireEvent.focusIn(carousel);
    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[0]).toHaveClass("is-active");

    fireEvent.focusOut(carousel);
    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[1]).toHaveClass("is-active");
  });

  it("减少动态效果偏好下不自动播放", () => {
    vi.useFakeTimers();
    setMedia(375, true);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    act(() => vi.advanceTimersByTime(26000));
    expect(stageSlides()[0]).toHaveClass("is-active");
  });

  it("运行中断点与偏好变化会同步分页点与自动播放", () => {
    vi.useFakeTimers();
    const media = setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);
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
    act(() => vi.advanceTimersByTime(26000));
    expect(stageSlides()[0]).toHaveClass("is-active");
  });

  it("没有 matchMedia 时不渲染分页点且不自动播放", () => {
    vi.stubGlobal("matchMedia", undefined);
    vi.useFakeTimers();
    render(<HomeEntryCarousel label="核心入口">{slides(2)}</HomeEntryCarousel>);

    expect(screen.queryByRole("button", { name: "第 1 组" })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[0]).toHaveClass("is-active");
  });

  it("自动播放时给当前页显示进度，暂停与减少动效时移除", () => {
    vi.useFakeTimers();
    setMedia(1280);
    const { container } = render(
      <HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>,
    );
    const carousel = screen.getByRole("region", { name: "核心入口" });
    const dotProgress = () =>
      container.querySelector(".home-carousel-dot.is-active .home-carousel-progress");

    expect(dotProgress()).not.toBeNull();
    expect(dotProgress()).toHaveStyle({ animationDuration: "6500ms" });
    expect(container.querySelector(".home-carousel-mobile-progress")).not.toBeNull();

    fireEvent.mouseEnter(carousel);
    expect(dotProgress()).toBeNull();
    expect(container.querySelector(".home-carousel-mobile-progress")).toBeNull();

    fireEvent.mouseLeave(carousel);
    expect(dotProgress()).not.toBeNull();
  });

  it("翻页后进度条挂到新的当前页", () => {
    vi.useFakeTimers();
    setMedia(1280);
    const { container } = render(
      <HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>,
    );

    act(() => vi.advanceTimersByTime(6500));
    expect(stageSlides()[1]).toHaveClass("is-active");
    const progress = container.querySelector(
      ".home-carousel-dot.is-active .home-carousel-progress",
    );
    expect(progress).not.toBeNull();
    expect(progress?.parentElement).toBe(screen.getByRole("button", { name: "第 2 组" }));
  });

  it("减少动效偏好下不显示自动播放进度", () => {
    setMedia(1280, true);
    const { container } = render(
      <HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>,
    );

    expect(container.querySelector(".home-carousel-progress")).toBeNull();
  });
});
