import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHRONICLE_PERIODS } from "./registry";
import { TerritoryChroniclePage } from "./territory-chronicle-page";

/**
 * 页面测试：Leaflet 场景模块整体 mock（jsdom 无真实瓦片环境），
 * 断言 React 侧的目录/详情/年度时间轴/图层开关与对场景的命令转发。
 */

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  setPeriod: vi.fn(),
  setWarState: vi.fn(),
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
    setWarState: mocks.setWarState,
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
    // 年度战争层初始为空（夏期第一站无战役上线）
    expect(mocks.setWarState).toHaveBeenLastCalledWith(null, []);
  });

  it("switching period from the menu seeks to its chronicle stop and updates the drawer", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    mocks.setPeriod.mockClear();
    fireEvent.click(screen.getAllByText("战国七雄")[0]);
    expect(mocks.setPeriod).toHaveBeenCalledTimes(1);
    expect(mocks.setPeriod.mock.calls[0][0].id).toBe("zhanguo");
    expect(mocks.setPeriod.mock.calls[0][1]).toBe(true);
    expect(screen.getByText(/商鞅变法/)).toBeInTheDocument();
  });

  it("selecting a war seeks to its year, forwards the deployment and flies to the battlefield", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 默认夏期的鸣条之战（列表内第一场）
    fireEvent.click(screen.getByRole("button", { name: /鸣条之战/ }));
    await waitFor(() =>
      expect(
        mocks.setWarState.mock.calls.some(
          (call) => (call[0] as { id: string } | null)?.id === "mingtiao",
        ),
      ).toBe(true),
    );
    expect(mocks.flyToWar).toHaveBeenCalledWith(expect.objectContaining({ id: "mingtiao" }));
    expect(screen.getByText("地图已聚焦战场，再次点击取消")).toBeInTheDocument();
    // 再次点击取消：战争层回到年度自动态（前1600 时鸣条仍是最新战役）
    fireEvent.click(screen.getByRole("button", { name: /鸣条之战/ }));
    await waitFor(() =>
      expect(screen.queryByText("地图已聚焦战场，再次点击取消")).not.toBeInTheDocument(),
    );
  });

  it("advancing the timeline上线 the next campaign with accumulated battle markers", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 推进到秦期（slider 值 = 秦期起始站）
    const slider = screen.getByRole("slider", { name: /推进时间轴/ });
    const stops = CHRONICLE_PERIODS.reduce((sum, period) => sum + 1 + period.wars.length, 0);
    expect(Number(slider.getAttribute("max"))).toBe(stops - 1);
    // 秦期有 4 战：推进到蒙恬北击匈奴之后，巨鹿之战尚未上线
    // （直接驱动键盘 → 逐步推进，验证战争层随年份变化）
    mocks.setWarState.mockClear();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() => expect(mocks.setWarState).toHaveBeenCalled());
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

  it("keyboard arrows and space drive stop stepping and playback", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mocks.setPeriod).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "shang" }),
      true,
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(mocks.setPeriod).toHaveBeenLastCalledWith(expect.objectContaining({ id: "xia" }), true);
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: "❚❚" })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: "▶" })).toBeInTheDocument();
  });

  it("auto play advances stop by stop and stops at the last stop", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await vi.waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "▶" }));
      // 每站停留 2400ms（1×）；定时器推进必须包进 act，否则 React 更新会丢
      for (let step = 0; step < 8; step += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(2400);
        });
      }
      // 年份读数已离开前2070（推进生效）
      const yearText = document.querySelector(".tch-year")?.textContent ?? "";
      expect(yearText).not.toBe("前2070");
      expect(yearText).toMatch(/^前\d+$/);
      // 停止播放后按钮回到播放态
      fireEvent.click(screen.getByRole("button", { name: "❚❚" }));
      expect(screen.getByRole("button", { name: "▶" })).toBeInTheDocument();
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

  it("wars with phase progressions open the map briefing window", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 先切到秦期，再点带 7 段推进的秦灭六国 → 小窗出现
    fireEvent.click(screen.getAllByText("秦")[0]);
    await waitFor(() =>
      expect(mocks.setPeriod).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "qin" }),
        true,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /秦灭六国/ }));
    await waitFor(() =>
      expect(screen.getByRole("complementary", { name: /秦灭六国战役推进/ })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/内史腾灭韩/).length).toBeGreaterThan(0);
    // 关闭小窗
    fireEvent.click(screen.getByRole("button", { name: "收起战役推进" }));
    expect(screen.queryByRole("complementary", { name: /战役推进/ })).not.toBeInTheDocument();
  });
});
