import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHRONICLE_PERIODS } from "./registry";
import { TerritoryChroniclePage } from "./territory-chronicle-page";

/**
 * 页面测试：Leaflet 场景模块整体 mock（jsdom 无真实瓦片环境），
 * 断言 React 侧的目录/详情/时间轴/图层开关与对场景的命令转发。
 */

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  setPeriod: vi.fn(),
  setSelectedWar: vi.fn(),
  setLayerVisible: vi.fn(),
  setModernLabels: vi.fn(),
  flyToWar: vi.fn(),
  resetView: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("./leaflet-scene", () => ({
  createTerritoryScene: mocks.create,
}));

function makeSceneStub() {
  return {
    setPeriod: mocks.setPeriod,
    setSelectedWar: mocks.setSelectedWar,
    setLayerVisible: mocks.setLayerVisible,
    setModernLabels: mocks.setModernLabels,
    flyToWar: mocks.flyToWar,
    resetView: mocks.resetView,
    destroy: mocks.destroy,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TerritoryChroniclePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockImplementation(() => makeSceneStub());
});

afterEach(() => {
  cleanup();
});

describe("TerritoryChroniclePage", () => {
  it("renders the full chronicle menu with six era groups and 20 periods", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(screen.getByRole("navigation", { name: "历代编年" })).toBeInTheDocument();
    for (const period of CHRONICLE_PERIODS) {
      const label = period.display ?? period.name;
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // 时代名同时出现在目录分组与底部时间轴的 era strip
    expect(screen.getAllByText("先秦").length).toBeGreaterThan(0);
    expect(screen.getAllByText("明清").length).toBeGreaterThan(0);
    // 当前为第一期（夏）
    expect(screen.getByRole("button", { name: /^夏/ })).toHaveAttribute("aria-current", "true");
  });

  it("sends the initial period to the scene without animation and syncs layers once ready", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    expect(mocks.setPeriod.mock.calls[0][0].id).toBe("xia");
    expect(mocks.setPeriod.mock.calls[0][1]).toBe(false);
    expect(mocks.setLayerVisible).toHaveBeenCalledWith("territory", true);
    expect(mocks.setModernLabels).toHaveBeenCalledWith(true);
  });

  it("switches period from the menu and updates the detail drawer", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    mocks.setPeriod.mockClear();
    // 战国条目（左侧目录中唯一以「战国七雄」为名的按钮）
    fireEvent.click(screen.getAllByText("战国七雄")[0]);
    expect(mocks.setPeriod).toHaveBeenCalledTimes(1);
    expect(mocks.setPeriod.mock.calls[0][0].id).toBe("zhanguo");
    // 飞行动画开启（非首帧）
    expect(mocks.setPeriod.mock.calls[0][1]).toBe(true);
    // 详情抽屉更新为战国内容
    expect(screen.getByText(/商鞅变法/)).toBeInTheDocument();
  });

  it("focuses a war: scene receives selection + flyToWar and the detail card expands", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 默认夏期的鸣条之战
    fireEvent.click(screen.getByRole("button", { name: /鸣条之战/ }));
    await waitFor(() => expect(mocks.setSelectedWar).toHaveBeenCalled());
    expect(mocks.setSelectedWar).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "mingtiao" }),
    );
    expect(mocks.flyToWar).toHaveBeenCalledWith(expect.objectContaining({ id: "mingtiao" }));
    expect(screen.getByText("地图已聚焦战场，再次点击取消")).toBeInTheDocument();
    // 再次点击取消
    fireEvent.click(screen.getByRole("button", { name: /鸣条之战/ }));
    expect(mocks.setSelectedWar).toHaveBeenLastCalledWith(null);
  });

  it("toggles layer chips and forwards visibility to the scene", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    mocks.setLayerVisible.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "边防" }));
    expect(mocks.setLayerVisible).toHaveBeenCalledWith("defenses", false);
    fireEvent.click(screen.getByRole("button", { name: "现代地名" }));
    expect(mocks.setModernLabels).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "现代地名" }));
    expect(mocks.setModernLabels).toHaveBeenLastCalledWith(true);
  });

  it("keyboard arrows and space drive period stepping and playback", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mocks.setPeriod).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "shang" }),
      true,
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(mocks.setPeriod).toHaveBeenLastCalledWith(expect.objectContaining({ id: "xia" }), true);
    // Space 切播放态：按钮文案变化
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: /暂停/ })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: /自动播放/ })).toBeInTheDocument();
  });

  it("auto play advances through periods and stops at 清", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      // 让场景创建与首个 effect 落定（fake timers 下微任务仍会跑）
      await vi.waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: /自动播放/ }));
      // 每期停留 3800ms（1×）；定时器推进必须包进 act，否则 React 更新会丢。
      // 逐期推进（19 步到清），每步单独断言友好的检查点。
      for (let step = 0; step < 19; step += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3800);
        });
      }
      expect(screen.getByRole("button", { name: /^商/ })).toBeInTheDocument();
      // 播到最后一期后自动停
      expect(screen.getByRole("button", { name: /^清（至1840）/ })).toHaveAttribute(
        "aria-current",
        "true",
      );
      expect(screen.getByRole("button", { name: /自动播放/ })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("speed select changes playback rate value", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    const select = screen.getByLabelText("播放速度");
    fireEvent.change(select, { target: { value: "2" } });
    expect(select).toHaveValue("2");
  });

  it("exposes the schematic-boundary caliber note and layer group semantics", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(screen.getAllByText(/示意范围/).length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "图层开关" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "历代编年" })).toBeInTheDocument();
  });
});
