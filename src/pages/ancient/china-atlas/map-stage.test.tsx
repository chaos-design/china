import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAtlasFocus, regionOfPoints } from "./atlas-focus";
import { ATLAS_VIEW } from "./atlas-items";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { MapStage } from "./map-stage";
import { MAP_ZOOM_MAX, setViewTweenMs } from "./map-view";
import { projectMigration } from "./migration-projection";

/**
 * MapStage 的交互层测试：jsdom 没有布局，先把地图容器撑出固定矩形，
 * 再用假 rAF 驱动补间、直接派发 wheel / pointer 事件验证手势数学。
 */

function renderStage(props: Partial<Parameters<typeof MapStage>[0]> = {}) {
  const onHover = vi.fn();
  const onSelect = vi.fn();
  const onResetView = vi.fn();
  const onToggleAnimated = vi.fn();
  const result = render(
    <MapStage
      animated
      dynasty={null}
      hoveredId={null}
      layer="all"
      onHover={onHover}
      onSelect={onSelect}
      onResetView={onResetView}
      onToggleAnimated={onToggleAnimated}
      selectedId={null}
      {...props}
    />,
  );
  const frame = result.container.querySelector("div.relative") as HTMLElement;
  const map = result.container.querySelector('svg[role="img"]') as SVGSVGElement;
  return { ...result, frame, map, onHover, onSelect, onResetView, onToggleAnimated };
}

/** 让 jsdom 里的地图容器有一个确定的可视矩形（800×500，位于 (0,0)）。 */
function mockFrameRect(frame: HTMLElement) {
  frame.getBoundingClientRect = () =>
    ({
      bottom: 500,
      height: 500,
      left: 0,
      right: 800,
      top: 0,
      width: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

function viewBoxOf(map: SVGSVGElement): [number, number, number, number] {
  return map.getAttribute("viewBox")!.split(" ").map(Number) as [number, number, number, number];
}

describe("<MapStage /> 视野交互", () => {
  beforeEach(() => {
    setViewTweenMs(620);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setViewTweenMs(0);
    cleanup();
  });

  it("全览时 data-zoom 为 1，缩放控件可用，复位把视野滑回目标视野", () => {
    const { frame, map } = renderStage();
    mockFrameRect(frame);

    expect(map.getAttribute("data-zoom")).toBe("1");
    expect(screen.getByRole("button", { name: "缩小地图" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "放大地图" })).toBeEnabled();

    // 全览下点复位：目标与当前一致，视野原地不动（不空转补间）。
    fireEvent.click(screen.getByRole("button", { name: "复位视野" }));
    act(() => vi.advanceTimersByTime(700));
    expect(map.getAttribute("data-zoom")).toBe("1");
    expect(map.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);

    // 放大两档：视野收窄、缩小按钮解锁；复位把视野滑回全览。
    fireEvent.click(screen.getByRole("button", { name: "放大地图" }));
    fireEvent.click(screen.getByRole("button", { name: "放大地图" }));
    act(() => vi.advanceTimersByTime(1400));
    expect(Number(map.getAttribute("data-zoom"))).toBeGreaterThan(1.5);
    expect(map.getAttribute("viewBox")).not.toBe(ATLAS_VIEW.box);

    fireEvent.click(screen.getByRole("button", { name: "复位视野" }));
    act(() => vi.advanceTimersByTime(700));
    expect(map.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
  });

  it("滚轮以光标为支点缩放：向上放大、向下缩回全览并被夹住", () => {
    const { frame, map } = renderStage();
    mockFrameRect(frame);

    // 没有布局矩形时（初始 jsdom）滚轮安全地什么都不做
    const bare = renderStage();
    fireEvent.wheel(bare.frame, { clientX: 100, clientY: 100, deltaY: -240 });
    expect(bare.map.getAttribute("data-zoom")).toBe("1");
    bare.unmount();

    fireEvent.wheel(frame, { clientX: 400, clientY: 250, deltaY: -240 });
    expect(Number(map.getAttribute("data-zoom"))).toBeGreaterThan(1.4);
    // 以中心为支点缩放，viewBox 中心不动
    const [x, y, width, height] = viewBoxOf(map);
    expect(x + width / 2).toBeCloseTo(ATLAS_VIEW.x + ATLAS_VIEW.width / 2, 0);
    expect(y + height / 2).toBeCloseTo(ATLAS_VIEW.y + ATLAS_VIEW.height / 2, 0);

    for (let index = 0; index < 12; index += 1) {
      fireEvent.wheel(frame, { clientX: 400, clientY: 250, deltaY: -240 });
    }
    expect(Number(map.getAttribute("data-zoom"))).toBe(MAP_ZOOM_MAX);
    expect(screen.getByRole("button", { name: "放大地图" })).toBeDisabled();

    for (let index = 0; index < 20; index += 1) {
      fireEvent.wheel(frame, { clientX: 400, clientY: 250, deltaY: 240 });
    }
    expect(Number(map.getAttribute("data-zoom"))).toBe(1);
    expect(map.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
  });

  it("全览时拖拽被钉住；放大后拖拽跟手，光标切换为抓住", () => {
    const { frame, map } = renderStage();
    mockFrameRect(frame);

    // 全览视野已装下整幅底图：拖拽平移没有可去之处，视野保持不动
    fireEvent.pointerDown(frame, {
      button: 0,
      clientX: 400,
      clientY: 250,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(frame, { clientX: 300, clientY: 210, pointerId: 1 });
    expect(map.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
    fireEvent.pointerUp(frame, { clientX: 300, clientY: 210, pointerId: 1 });

    // 右键按下不启手势
    fireEvent.pointerDown(frame, {
      button: 2,
      clientX: 400,
      clientY: 250,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(frame, { clientX: 300, clientY: 250, pointerId: 1 });
    expect(map.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);

    // 放大两档后拖拽：向左上拖 → 内容跟手 → 视野向右下移，且被夹在底图附近
    fireEvent.click(screen.getByRole("button", { name: "放大地图" }));
    fireEvent.click(screen.getByRole("button", { name: "放大地图" }));
    act(() => vi.advanceTimersByTime(1400));
    const [zoomedX, zoomedY] = viewBoxOf(map);

    fireEvent.pointerDown(frame, {
      button: 0,
      clientX: 400,
      clientY: 250,
      pointerId: 1,
      pointerType: "mouse",
    });
    // 2px 的抖动不触发平移
    fireEvent.pointerMove(frame, { clientX: 402, clientY: 250, pointerId: 1 });
    expect(viewBoxOf(map).slice(0, 2)).toEqual([zoomedX, zoomedY]);

    fireEvent.pointerMove(frame, { clientX: 300, clientY: 210, pointerId: 1 });
    expect(frame.className).toContain("cursor-grabbing");
    const [x, y, width] = viewBoxOf(map);
    expect(x).toBeGreaterThan(zoomedX);
    expect(y).toBeGreaterThan(zoomedY);
    expect(width).toBeLessThan(ATLAS_VIEW.width);
    expect(x).toBeLessThan(ATLAS_VIEW.x + ATLAS_VIEW.width);

    fireEvent.pointerUp(frame, { clientX: 300, clientY: 210, pointerId: 1 });
    expect(frame.className).not.toContain("cursor-grabbing");
  });

  it("双指捏合缩放；捏合结束剩余单指继续拖拽不跳变", () => {
    const { frame, map } = renderStage();
    mockFrameRect(frame);

    fireEvent.pointerDown(frame, { clientX: 200, clientY: 250, pointerId: 1 });
    fireEvent.pointerDown(frame, { clientX: 280, clientY: 250, pointerId: 2 });
    // 两指从 80px 拉开到 240px：约三倍捏合
    fireEvent.pointerMove(frame, { clientX: 120, clientY: 250, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 360, clientY: 250, pointerId: 2 });
    const zoomAfterPinch = Number(map.getAttribute("data-zoom"));
    expect(zoomAfterPinch).toBeGreaterThan(1.8);

    // 抬起一指后，剩余单指继续拖拽：视野随手指平移，没有位置跳变
    fireEvent.pointerUp(frame, { clientX: 360, clientY: 250, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 330, clientY: 260, pointerId: 2 });
    const [x1, y1] = viewBoxOf(map);
    fireEvent.pointerMove(frame, { clientX: 300, clientY: 260, pointerId: 2 });
    const [x2, y2] = viewBoxOf(map);
    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBe(y1);

    fireEvent.pointerCancel(frame, { clientX: 300, clientY: 260, pointerId: 2 });
    expect(frame.className).not.toContain("cursor-grabbing");
  });

  it("选中条目后视野经补间滑向焦点，终态严格等于目标 viewBox", () => {
    const policy = FRONTIER_POLICIES[0]!;
    const { frame, map, rerender } = renderStage({ layer: "frontier", selectedId: null });
    mockFrameRect(frame);
    const overviewBox = map.getAttribute("viewBox");

    rerender(
      <MapStage
        animated
        dynasty={null}
        hoveredId={null}
        layer="frontier"
        onHover={vi.fn()}
        onSelect={vi.fn()}
        onResetView={vi.fn()}
        onToggleAnimated={vi.fn()}
        selectedId={`frontier:${policy.id}`}
      />,
    );

    // 第一帧尚未画出：视野仍在全览；补间结束后严格落在焦点 viewBox 上
    expect(map.getAttribute("viewBox")).toBe(overviewBox);
    act(() => vi.advanceTimersByTime(700));
    expect(map.getAttribute("viewBox")).not.toBe(overviewBox);
    expect(Number(map.getAttribute("data-zoom"))).toBeGreaterThan(1);
    // jsdom 没有 ResizeObserver，比例取全览默认值，焦点 viewBox 与纯函数结果一致
    const expected = getAtlasFocus({
      maxZoom: 2.2,
      padding: 12,
      region: regionOfPoints([projectMigration(...policy.seat.ll)]),
    });
    expect(map.getAttribute("viewBox")).toBe(expected.box);
  });

  it("双击空白处放大、双击按钮不放大；prefers-reduced-motion 下手势直取终值", () => {
    const { frame, map } = renderStage();
    mockFrameRect(frame);

    fireEvent.doubleClick(frame, { clientX: 400, clientY: 250 });
    act(() => vi.advanceTimersByTime(700));
    expect(Number(map.getAttribute("data-zoom"))).toBeGreaterThan(1.5);

    // 双击落在按钮上：交给按钮自己的 click，不再叠加一次放大
    const before = map.getAttribute("viewBox");
    fireEvent.doubleClick(screen.getByRole("button", { name: "放大地图" }));
    expect(map.getAttribute("viewBox")).toBe(before);

    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const instant = renderStage();
    mockFrameRect(instant.frame);
    fireEvent.wheel(instant.frame, { clientX: 400, clientY: 250, deltaY: -240 });
    expect(Number(instant.map.getAttribute("data-zoom"))).toBeGreaterThan(1.4);
  });
});
