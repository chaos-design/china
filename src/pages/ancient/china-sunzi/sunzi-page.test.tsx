import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SunziPage } from "./sunzi-page";

function boardLabel() {
  return screen.getByTestId("sunzi-board").getAttribute("aria-label") ?? "";
}

function sceneStyle() {
  return screen.getByTestId("sunzi-board").querySelector(".sunzi-board__scene") as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SunziPage 三十六计沙盘", () => {
  it("四周布局齐备，默认打开围魏救赵的机理沙盘", () => {
    render(<SunziPage />);

    expect(screen.getByTestId("sunzi-left")).toBeInTheDocument();
    expect(screen.getByTestId("sunzi-center")).toBeInTheDocument();
    expect(screen.getByTestId("sunzi-right")).toBeInTheDocument();
    expect(screen.getByTestId("sunzi-bottom")).toBeInTheDocument();

    const left = screen.getByRole("navigation", { name: "三十六计目录" });
    expect(within(left).getAllByRole("button")).toHaveLength(39);

    const detail = screen.getByTestId("sunzi-stratagem-detail");
    expect(detail).toHaveTextContent("围魏救赵");
    expect(detail).toHaveTextContent("共敌不如分敌，敌阳不如敌阴");
    expect(detail).toHaveTextContent("攻其必救");
    expect(boardLabel()).toContain("围魏救赵");
    expect(boardLabel()).toContain("布势");
  });

  it("切换计谋会换沙盘、回到第一幕并更新详解", () => {
    render(<SunziPage />);
    const left = screen.getByRole("navigation", { name: "三十六计目录" });
    const bottom = screen.getByTestId("sunzi-bottom");

    fireEvent.click(within(bottom).getByRole("button", { name: "下一步" }));
    expect(boardLabel()).toContain("示形");

    fireEvent.click(within(left).getByRole("button", { name: "36. 走为上计" }));
    expect(boardLabel()).toContain("走为上计");
    expect(boardLabel()).toContain("布势");
    expect(screen.getByTestId("sunzi-stratagem-detail")).toHaveTextContent("全师避敌");
    expect(screen.getByTestId("sunzi-stratagem-detail")).toHaveTextContent("全师而退");
  });

  it("史籍三役仍是真实战史沙盘，并能由计谋跳回对应一幕", () => {
    render(<SunziPage />);
    const detail = screen.getByTestId("sunzi-stratagem-detail");
    fireEvent.click(within(detail).getByRole("button", { name: "看对应战役的史籍沙盘" }));

    expect(boardLabel()).toContain("桂陵之战");
    expect(boardLabel()).toContain("直趋大梁");
    expect(screen.getByTestId("sunzi-explain")).toHaveTextContent("《史记·孙子吴起列传》");

    const battles = screen.getByRole("navigation", { name: "战役选择" });
    fireEvent.click(within(battles).getByRole("button", { name: "柏举之战" }));
    expect(boardLabel()).toContain("柏举之战");
    expect(screen.getByTestId("sunzi-explain")).toHaveTextContent("《左传·定公四年》");
  });

  it("底部操作可逐幕推进，播放到末幕自动停止", () => {
    vi.useFakeTimers();
    render(<SunziPage />);
    const bottom = screen.getByTestId("sunzi-bottom");
    const previous = within(bottom).getByRole("button", { name: "上一步" });
    const next = within(bottom).getByRole("button", { name: "下一步" });

    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(boardLabel()).toContain("示形");
    expect(previous).toBeEnabled();

    fireEvent.click(within(bottom).getByRole("button", { name: "播放" }));
    act(() => vi.advanceTimersByTime(2600));
    expect(boardLabel()).toContain("决胜");
    act(() => vi.advanceTimersByTime(2600));
    expect(boardLabel()).toContain("收局");
    expect(within(bottom).getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it("中央沙盘支持按钮与滚轮缩放，并有边界与复位", () => {
    render(<SunziPage />);
    const bottom = screen.getByTestId("sunzi-bottom");
    const enlarge = within(bottom).getByRole("button", { name: "放大沙盘" });
    const shrink = within(bottom).getByRole("button", { name: "缩小沙盘" });

    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("1");
    fireEvent.click(enlarge);
    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("1.1");
    expect(bottom).toHaveTextContent("110%");

    fireEvent.wheel(screen.getByTestId("sunzi-center"), { deltaY: -100 });
    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("1.2");

    for (let index = 0; index < 12; index += 1) fireEvent.click(enlarge);
    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("2.2");
    expect(enlarge).toBeDisabled();

    for (let index = 0; index < 30; index += 1) fireEvent.click(shrink);
    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("0.7");
    expect(shrink).toBeDisabled();

    fireEvent.click(within(bottom).getByRole("button", { name: "复位" }));
    expect(sceneStyle().style.getPropertyValue("--sunzi-zoom")).toBe("1");
  });

  it("沙盘小人按军种区分，视角可切换", () => {
    render(<SunziPage />);
    const board = screen.getByTestId("sunzi-board");
    const bottom = screen.getByTestId("sunzi-bottom");

    expect(board).toHaveAttribute("role", "img");
    expect(board.querySelector('[data-branch="chariot"]')).toBeTruthy();
    expect(board.querySelector('[data-branch="infantry"]')).toBeTruthy();

    fireEvent.click(within(bottom).getByRole("button", { name: "俯视" }));
    expect(board).toHaveAttribute("data-view", "top");
    fireEvent.click(within(bottom).getByRole("button", { name: "沙盘" }));
    expect(board).toHaveAttribute("data-view", "sand");
  });

  it("右侧给出有正史出处的案例，并说明史籍三役与三十六计的关系", () => {
    render(<SunziPage />);
    const left = screen.getByRole("navigation", { name: "三十六计目录" });

    const caseBlock = screen.getByTestId("sunzi-historical-case");
    expect(caseBlock).toHaveTextContent("桂陵之战");
    expect(caseBlock).toHaveTextContent("《史记·孙子吴起列传》");
    expect(within(caseBlock).getByRole("link", { name: "《史记·孙子吴起列传》" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://"),
    );

    fireEvent.click(within(left).getByRole("button", { name: "24. 假道伐虢" }));
    expect(screen.getByTestId("sunzi-historical-case")).toHaveTextContent("晋假道于虞以伐虢");
    expect(screen.getByTestId("sunzi-historical-case")).toHaveTextContent("《左传·僖公五年》");

    fireEvent.click(within(left).getByRole("button", { name: "柏举之战" }));
    expect(screen.getByTestId("sunzi-scope-note")).toHaveTextContent(
      "柏举之战早于《三十六计》成书",
    );
  });

  it("悬停沙盘会停止自动播放", () => {
    vi.useFakeTimers();
    render(<SunziPage />);
    const bottom = screen.getByTestId("sunzi-bottom");

    fireEvent.click(within(bottom).getByRole("button", { name: "播放" }));
    act(() => vi.advanceTimersByTime(2600));
    expect(boardLabel()).toContain("示形");

    fireEvent.mouseEnter(screen.getByTestId("sunzi-center"));
    expect(within(bottom).getByRole("button", { name: "播放" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5200));
    expect(boardLabel()).toContain("示形");
  });
});
