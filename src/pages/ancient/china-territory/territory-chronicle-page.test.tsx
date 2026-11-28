import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { periodStartMonth, toMonthIndex } from "./chronicle-time";
import { CHRONICLE_PERIODS } from "./registry";
import { TerritoryChroniclePage } from "./territory-chronicle-page";

/**
 * 页面测试：Leaflet 场景模块整体 mock（jsdom 无真实瓦片环境），
 * 断言 React 侧的目录/详情/月度时间轴/图层开关与对场景的命令转发。
 * 场景 setPeriod 签名 (period, month, animate)，播放以月为最小单位。
 */

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createInset: vi.fn(),
  setInsetWar: vi.fn(),
  destroyInset: vi.fn(),
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
  createBattleInset: mocks.createInset,
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

const firstMonth = periodStartMonth(CHRONICLE_PERIODS[0]);
const lastMonth = toMonthIndex(CHRONICLE_PERIODS[CHRONICLE_PERIODS.length - 1].endYear, 12);

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.removeItem("territory-chronicle-menu-open");
  mocks.create.mockImplementation(() => makeSceneStub());
  mocks.createInset.mockImplementation(() => ({
    setWar: mocks.setInsetWar,
    destroy: mocks.destroyInset,
  }));
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
    // 当前为第一期（夏）；目录查询限定在导航内（时间轴色带也有朝代名）
    const nav = screen.getByRole("navigation", { name: "历代编年" });
    expect(within(nav).getByRole("button", { name: /^夏/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("sends the initial period and month to the scene without animation and syncs layers", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    expect(mocks.setPeriod.mock.calls[0][0].id).toBe("xia");
    expect(mocks.setPeriod.mock.calls[0][1]).toBe(firstMonth);
    expect(mocks.setPeriod.mock.calls[0][2]).toBe(false);
    expect(mocks.setLayerVisible).toHaveBeenCalledWith("territory", true);
    expect(mocks.setModernLabels).toHaveBeenCalledWith(true);
    // 年度战争层初始为空（夏期第一月无战役上线）
    expect(mocks.setWarState).toHaveBeenLastCalledWith(null, [], firstMonth);
  });

  it("switching period from the menu seeks to its start month and updates the drawer", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    mocks.setPeriod.mockClear();
    fireEvent.click(screen.getAllByText("战国七雄")[0]);
    expect(mocks.setPeriod).toHaveBeenCalledTimes(1);
    expect(mocks.setPeriod.mock.calls[0][0].id).toBe("zhanguo");
    expect(mocks.setPeriod.mock.calls[0][1]).toBe(
      periodStartMonth(CHRONICLE_PERIODS.find((p) => p.id === "zhanguo")!),
    );
    expect(mocks.setPeriod.mock.calls[0][2]).toBe(true);
    expect(screen.getByText(/商鞅变法/)).toBeInTheDocument();
  });

  it("selecting a war seeks to its start month, forwards deployment and flies to the battlefield", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 默认夏期的鸣条之战（右栏列表内第一场；时间轴刻度也有同名 hover 按钮）
    const detail = screen.getByRole("complementary", { name: "当朝详情" });
    fireEvent.click(within(detail).getByRole("button", { name: /鸣条之战/ }));
    await waitFor(() =>
      expect(
        mocks.setWarState.mock.calls.some(
          (call) => (call[0] as { id: string } | null)?.id === "mingtiao",
        ),
      ).toBe(true),
    );
    expect(mocks.flyToWar).toHaveBeenCalledWith(expect.objectContaining({ id: "mingtiao" }));
    expect(mocks.setInsetWar).toHaveBeenCalledWith(expect.objectContaining({ id: "mingtiao" }));
    expect(screen.getByRole("region", { name: /鸣条之战战场放大图/ })).toBeInTheDocument();
    expect(screen.getByText("地图已聚焦战场，再次点击取消")).toBeInTheDocument();
    expect(within(detail).getByText(/规模：/)).toBeInTheDocument();
    // 再次点击取消：战争层回到月度自动态
    fireEvent.click(within(detail).getByRole("button", { name: /鸣条之战/ }));
    await waitFor(() =>
      expect(screen.queryByText("地图已聚焦战场，再次点击取消")).not.toBeInTheDocument(),
    );
  });

  it("uses a month slider spanning the full chronicle and steps one month with buttons", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    const slider = screen.getByRole("slider", { name: /推进时间轴/ });
    expect(slider).toHaveAttribute("min", String(firstMonth));
    expect(slider).toHaveAttribute("max", String(lastMonth));
    expect(slider).toHaveAttribute("step", "1");

    const next = screen.getByRole("button", { name: "下一个月" });
    const prev = screen.getByRole("button", { name: "上一个月" });
    expect(prev).toBeDisabled();
    fireEvent.click(next);
    expect(Number((slider as HTMLInputElement).value)).toBe(firstMonth + 1);
    // 月份推进但控制图未变化时不需要重建疆域覆盖层
    expect(mocks.setPeriod).toHaveBeenCalledTimes(1);
    fireEvent.click(prev);
    expect(Number((slider as HTMLInputElement).value)).toBe(firstMonth);
    expect(prev).toBeDisabled();

    // 滑杆按月跳转，直接改变读数
    fireEvent.change(slider, { target: { value: String(firstMonth + 40) } });
    expect(Number((slider as HTMLInputElement).value)).toBe(firstMonth + 40);
  });

  it("clicking a dynasty band on the progress track seeks to that period", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    const zhanguo = CHRONICLE_PERIODS.find((period) => period.id === "zhanguo")!;
    const slider = screen.getByRole("slider", { name: /推进时间轴/ });
    fireEvent.click(screen.getByRole("button", { name: /跳到战国七雄/ }));
    expect(Number((slider as HTMLInputElement).value)).toBe(periodStartMonth(zhanguo));
    expect(mocks.setPeriod.mock.calls[mocks.setPeriod.mock.calls.length - 1][0].id).toBe("zhanguo");
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

  it("keyboard arrows step a single month and space toggles playback", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    const slider = screen.getByRole("slider", { name: /推进时间轴/ });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(Number((slider as HTMLInputElement).value)).toBe(firstMonth + 1);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(Number((slider as HTMLInputElement).value)).toBe(firstMonth);
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
  });

  it("auto play advances months and stops when paused", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await vi.waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "播放" }));
      // 1× = 每年 12 月，250ms 一跳推进 3 个月；8 跳 = 24 个月 = 2 年
      for (let step = 0; step < 8; step += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(250);
        });
      }
      const yearText = document.querySelector(".tch-year")?.textContent ?? "";
      expect(yearText).toMatch(/^前\d+年\d+月$/);
      expect(yearText).not.toBe("前2070年01月");
      fireEvent.click(screen.getByRole("button", { name: "暂停" }));
      expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("speed select changes playback rate value", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    const select = screen.getByLabelText("播放速度");
    fireEvent.change(select, { target: { value: "4" } });
    expect((select as HTMLSelectElement).value).toBe("4");
  });

  it("exposes the schematic-boundary caliber note and layer group semantics", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(screen.getAllByText(/示意范围/).length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "图层开关" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "历代编年" })).toBeInTheDocument();
  });

  it("wars with phase progressions open the right-side map briefing window", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    // 先切到秦期，再点带推进阶段的秦灭六国 → 小窗出现
    fireEvent.click(screen.getAllByText("秦")[0]);
    await waitFor(() =>
      expect(mocks.setPeriod.mock.calls[mocks.setPeriod.mock.calls.length - 1][0]).toEqual(
        expect.objectContaining({ id: "qin" }),
      ),
    );
    const detail = screen.getByRole("complementary", { name: "当朝详情" });
    fireEvent.click(within(detail).getByRole("button", { name: /秦灭六国/ }));
    await waitFor(() =>
      expect(screen.getByRole("complementary", { name: /秦灭六国战役推进/ })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/内史腾灭韩/).length).toBeGreaterThan(0);
    const briefing = screen.getByRole("complementary", { name: /秦灭六国战役推进/ });
    expect(within(briefing).getByText(/规模/)).toBeInTheDocument();
    expect(within(briefing).getByText(/损失/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "收起战役推进" }));
    expect(screen.queryByRole("complementary", { name: /战役推进/ })).not.toBeInTheDocument();
  });

  it("refreshes annals and figure status as the month advances", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    const slider = screen.getByRole("slider", { name: /推进时间轴/ });
    const detail = screen.getByRole("complementary", { name: "当朝详情" });
    const zhanguo = CHRONICLE_PERIODS.find((period) => period.id === "zhanguo")!;
    expect(within(detail).queryByText(/商鞅变法/)).not.toBeInTheDocument();
    fireEvent.change(slider, { target: { value: String(toMonthIndex(-356, 1)) } });
    const annals = within(detail).getByRole("region", { name: "编年速报" });
    expect(annals).toHaveTextContent("商鞅在秦变法");
    expect(annals).toHaveTextContent("前356年");
    expect(within(detail).getByRole("region", { name: "人物动态" })).toHaveTextContent("商鞅");
    expect(screen.getByRole("region", { name: "此刻控制" })).toBeInTheDocument();
    expect(periodStartMonth(zhanguo)).toBeLessThan(toMonthIndex(-356, 1));
  });

  it("shows enriched biographies with birth year and month in the folded figure list", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /跳到秦（/ }));
    const detail = screen.getByRole("complementary", { name: "当朝详情" });
    const figures = within(detail).getByRole("group", { name: "人物志" });
    fireEvent.click(figures.querySelector("summary")!);
    expect(figures).toHaveTextContent("生：前259年01月");
    expect(figures).toHaveTextContent("卒：前210年07月");
    // 增补人物也进入人物志（王室 / 朝堂 / 意难平）
    expect(figures).toHaveTextContent("胡亥");
    expect(figures).toHaveTextContent("王翦");
  });

  it("collapses and restores the chronicle menu with persisted state", async () => {
    renderPage();
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "收起编年目录" }));
    expect(screen.queryByRole("navigation", { name: "历代编年" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("territory-chronicle-menu-open")).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: /编年目录/ }));
    expect(screen.getByRole("navigation", { name: "历代编年" })).toBeInTheDocument();
    // 时代分组可单独折叠
    const nav = screen.getByRole("navigation", { name: "历代编年" });
    const era = within(nav).getByRole("button", { name: /^先秦/ });
    fireEvent.click(era);
    expect(era).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the pinned dynasty header, live annals and folded figures in the detail pane", async () => {
    renderPage();
    await waitFor(() => expect(mocks.setPeriod).toHaveBeenCalled());
    const header = screen.getByRole("complementary", { name: "当朝详情" }).querySelector("header");
    expect(header).not.toBeNull();
    expect(header).toHaveClass("tch-detail-head");
    expect(screen.getByRole("region", { name: "编年速报" })).toBeInTheDocument();
    // 人物志默认折叠（在 details 内、展开前不可见）
    const figures = screen.getByRole("group", { name: "人物志" });
    expect(figures).not.toHaveAttribute("open");
    const summary = figures.querySelector("summary");
    expect(summary?.textContent).toContain("人物志");
    // 生僻字补拼音（关龙逄 → 逄(páng)）
    fireEvent.click(summary!);
    expect(figures).toHaveTextContent("逄(páng)");
  });
});
