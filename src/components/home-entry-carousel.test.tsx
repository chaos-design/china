import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeEntryCarousel } from "./home-entry-carousel";

function setMedia(width: number, reduceMotion = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width: 640px")
      ? width >= 640
      : query.includes("min-width: 1024px")
        ? width >= 1024
        : query.includes("prefers-reduced-motion")
          ? reduceMotion
          : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function slides(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <a key={index} href={`/entry-${index + 1}`}>
      入口 {index + 1}
    </a>
  ));
}

function track() {
  return document.querySelector<HTMLElement>(".home-carousel-track") as HTMLElement;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("<HomeEntryCarousel />", () => {
  it("按断点分页，所有幻灯片始终留在 DOM 中", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(screen.getAllByRole("listitem", { name: /\/ 7$/ })).toHaveLength(7);
    // 桌面端一行三张：7 张 → 3 页
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^第 \d+ 组$/ })).toHaveLength(3);
  });

  it("箭头翻页并循环，分页点显示当前位置", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(7)}</HomeEntryCarousel>);

    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
    expect(track()).toHaveStyle({ transform: "translate3d(calc(-100% + 0px), 0, 0)" });
    expect(screen.getByRole("button", { name: "第 2 组" })).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(screen.getByText("01 / 03")).toBeInTheDocument();

    // 末页再下一组回到首页
    fireEvent.click(screen.getByRole("button", { name: "上一组" }));
    expect(screen.getByText("03 / 03")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一组" }));
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
  });

  it("点击分页点可直接跳页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(6)}</HomeEntryCarousel>);

    fireEvent.click(screen.getByRole("button", { name: "第 2 组" }));
    expect(screen.getByText("02 / 02")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "第 2 组" })).toHaveAttribute("aria-current", "true");
  });

  it("方向键翻页", () => {
    setMedia(1280);
    render(<HomeEntryCarousel label="核心入口">{slides(6)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(screen.getByText("02 / 02")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByText("01 / 02")).toBeInTheDocument();
  });

  it("触摸滑动越过阈值才翻页，短距离拖动不翻页", () => {
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    const swipe = (from: number, to: number) => {
      fireEvent.pointerDown(track(), { clientX: from, pointerId: 1, pointerType: "touch" });
      fireEvent.pointerMove(track(), { clientX: to, pointerId: 1, pointerType: "touch" });
      fireEvent.pointerUp(track(), { clientX: to, pointerId: 1, pointerType: "touch" });
    };

    swipe(100, 90);
    expect(screen.getByText("01 / 04")).toBeInTheDocument();

    swipe(100, 20);
    expect(screen.getByText("02 / 04")).toBeInTheDocument();

    swipe(20, 100);
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
  });

  it("滑动后的补发 click 被吞掉，不会误入卡片", () => {
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    const firstLink = screen.getAllByRole("link")[0] as HTMLElement;
    fireEvent.pointerDown(track(), { clientX: 100, pointerId: 1, pointerType: "touch" });
    fireEvent.pointerMove(track(), { clientX: 20, pointerId: 1, pointerType: "touch" });
    fireEvent.pointerUp(track(), { clientX: 20, pointerId: 1, pointerType: "touch" });

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    firstLink.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("鼠标非主键按下与 pointercancel 不会翻页", () => {
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    fireEvent.pointerDown(track(), { clientX: 100, button: 2, pointerType: "mouse" });
    fireEvent.pointerUp(track(), { clientX: 20, button: 2, pointerType: "mouse" });
    expect(screen.getByText("01 / 04")).toBeInTheDocument();

    fireEvent.pointerDown(track(), { clientX: 100, pointerId: 2, pointerType: "touch" });
    fireEvent.pointerMove(track(), { clientX: 20, pointerId: 2, pointerType: "touch" });
    fireEvent.pointerCancel(track(), { pointerId: 2, pointerType: "touch" });
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
  });

  it("自动播放翻页，悬停暂停，离开后恢复", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("02 / 04")).toBeInTheDocument();

    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("02 / 04")).toBeInTheDocument();

    fireEvent.mouseLeave(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("03 / 04")).toBeInTheDocument();
  });

  it("聚焦暂停、失焦恢复自动播放", () => {
    vi.useFakeTimers();
    setMedia(375);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    const carousel = screen.getByRole("region", { name: "核心入口" });
    fireEvent.focusIn(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("01 / 04")).toBeInTheDocument();

    fireEvent.focusOut(carousel);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("02 / 04")).toBeInTheDocument();
  });

  it("减少动态效果偏好下不自动播放", () => {
    vi.useFakeTimers();
    setMedia(375, true);
    render(<HomeEntryCarousel label="核心入口">{slides(4)}</HomeEntryCarousel>);

    act(() => vi.advanceTimersByTime(21000));
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
  });

  it("没有 matchMedia 时退化为单列且不自动播放", () => {
    vi.stubGlobal("matchMedia", undefined);
    vi.useFakeTimers();
    render(<HomeEntryCarousel label="核心入口">{slides(2)}</HomeEntryCarousel>);

    expect(screen.getByText("01 / 02")).toBeInTheDocument();
    expect(document.querySelector<HTMLElement>(".home-carousel-slide")).toHaveStyle({
      flexBasis: "100%",
    });
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText("01 / 02")).toBeInTheDocument();
  });
});
