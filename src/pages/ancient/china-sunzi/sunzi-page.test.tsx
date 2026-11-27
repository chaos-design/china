import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SunziPage } from "./sunzi-page";

function boardLabel() {
  return screen.getByTestId("sunzi-board").getAttribute("aria-label") ?? "";
}

function scene() {
  return screen.getByTestId("sunzi-board").querySelector(".sunzi-board__scene") as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SunziPage 沙盘演练", () => {
  it("首屏呈现柏举之战、四幕时间轴与读图讲解", () => {
    render(<SunziPage />);

    expect(screen.getByTestId("sunzi-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "孙子兵法沙盘演练" })).toBeInTheDocument();
    expect(boardLabel()).toContain("柏举之战");
    expect(boardLabel()).toContain("弃舟登陆");

    const timeline = screen.getByTestId("sunzi-timeline");
    expect(within(timeline).getAllByRole("button")).toHaveLength(4);
    expect(within(timeline).getByRole("button", { name: /弃舟登陆/ })).toHaveAttribute(
      "aria-current",
      "step",
    );

    expect(screen.getByTestId("sunzi-explain")).toHaveTextContent("战场态势");
    expect(screen.getByTestId("sunzi-explain")).toHaveTextContent("关键决策");
    expect(screen.getByTestId("sunzi-explain")).toHaveTextContent("结果变化");
  });

  it("切换战役回到第一幕，并同步沙盘地名", () => {
    render(<SunziPage />);
    const menu = screen.getByRole("navigation", { name: "战役选择" });

    fireEvent.click(within(menu).getByRole("button", { name: "桂陵之战" }));
    expect(boardLabel()).toContain("桂陵之战");
    expect(boardLabel()).toContain("魏围邯郸");
    expect(screen.getByTestId("sunzi-board")).toHaveTextContent("大梁");

    fireEvent.click(within(menu).getByRole("button", { name: "马陵之战" }));
    expect(boardLabel()).toContain("马陵之战");
    expect(boardLabel()).toContain("韩求救于齐");
  });

  it("逐步推进与回退，并守住首尾禁用边界", () => {
    render(<SunziPage />);
    const controls = screen.getByRole("group", { name: "复盘控制" });
    const previous = within(controls).getByRole("button", { name: "上一步" });
    const next = within(controls).getByRole("button", { name: "下一步" });

    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(boardLabel()).toContain("穿隘疾进");
    expect(previous).toBeEnabled();

    fireEvent.click(previous);
    expect(boardLabel()).toContain("弃舟登陆");

    const timeline = screen.getByTestId("sunzi-timeline");
    fireEvent.click(within(timeline).getByRole("button", { name: /五战入郢/ }));
    expect(boardLabel()).toContain("五战入郢");
    expect(next).toBeDisabled();
  });

  it("播放逐幕推进，悬停与聚焦时间轴都会暂停", () => {
    vi.useFakeTimers();
    render(<SunziPage />);

    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2600));
    expect(boardLabel()).toContain("穿隘疾进");

    fireEvent.mouseEnter(screen.getByTestId("sunzi-stage"));
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5200));
    expect(boardLabel()).toContain("穿隘疾进");

    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    fireEvent.focus(screen.getByTestId("sunzi-timeline"));
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
  });

  it("播放到最后一幕自动停止", () => {
    vi.useFakeTimers();
    render(<SunziPage />);
    const timeline = screen.getByTestId("sunzi-timeline");
    fireEvent.click(within(timeline).getByRole("button", { name: /柏举决战/ }));

    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    act(() => vi.advanceTimersByTime(2600));
    expect(boardLabel()).toContain("五战入郢");
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
  });

  it("视角与缩放有边界，复位回到沙盘视角", () => {
    render(<SunziPage />);
    const board = screen.getByTestId("sunzi-board");
    const views = screen.getByRole("group", { name: "视角" });
    const zoom = screen.getByRole("group", { name: "缩放" });

    fireEvent.click(within(views).getByRole("button", { name: "俯视" }));
    expect(board).toHaveAttribute("data-view", "top");
    expect(scene().style.getPropertyValue("--sunzi-zoom")).toBe("1");

    const enlarge = within(zoom).getByRole("button", { name: "放大沙盘" });
    for (let index = 0; index < 4; index += 1) fireEvent.click(enlarge);
    expect(scene().style.getPropertyValue("--sunzi-zoom")).toBe("1.6");
    expect(enlarge).toBeDisabled();

    const shrink = within(zoom).getByRole("button", { name: "缩小沙盘" });
    for (let index = 0; index < 5; index += 1) fireEvent.click(shrink);
    expect(scene().style.getPropertyValue("--sunzi-zoom")).toBe("0.85");
    expect(shrink).toBeDisabled();

    fireEvent.click(within(zoom).getByRole("button", { name: "复位" }));
    expect(board).toHaveAttribute("data-view", "sand");
    expect(scene().style.getPropertyValue("--sunzi-zoom")).toBe("1");
  });

  it("讲解栏随幕次更新兵法原文与贯穿表高亮", () => {
    render(<SunziPage />);
    const explain = screen.getByTestId("sunzi-explain");
    expect(explain).toHaveTextContent("兵之胜，避实而击虚");

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(explain).toHaveTextContent("故善战者，致人而不致于人");
    expect(explain).toHaveTextContent("主动权易手");

    const current = within(explain)
      .getAllByRole("listitem")
      .filter((row) => row.getAttribute("data-current") === "true");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("致人而不致于人");
  });

  it("沙盘给出当前幕的无障碍说明与播放态", () => {
    render(<SunziPage />);
    const board = screen.getByTestId("sunzi-board");
    expect(board).toHaveAttribute("role", "img");
    expect(board).toHaveAttribute("data-playing", "false");

    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(board).toHaveAttribute("data-playing", "true");
    expect(board.querySelector('[data-kind="advance"]')).toBeTruthy();
    expect(board.querySelector('[data-region="r-wu"]')).toHaveAttribute("data-held", "a");
  });
});
