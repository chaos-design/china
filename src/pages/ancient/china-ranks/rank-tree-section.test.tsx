import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const scene = {
    applyPreset: vi.fn(),
    dispose: vi.fn(),
    focusTier: vi.fn(),
    resize: vi.fn(),
    resetView: vi.fn(),
    setAutoRotate: vi.fn(),
    setFocus: vi.fn(),
    setSelection: vi.fn(),
    setTrees: vi.fn(),
  };
  return {
    create: vi.fn<(host: HTMLElement, colors: unknown, handlers: unknown) => typeof scene | null>(
      () => scene,
    ),
    scene,
  };
});

vi.mock("./rank-tree-scene", () => ({
  createRankTreeScene: mocks.create,
  readRankTreeColors: () => ({
    blueprint: "hsl(210, 16%, 40%)",
    ink: "hsl(220, 14%, 13%)",
    ochre: "hsl(38, 30%, 55%)",
    paper: "hsl(40, 18%, 90%)",
    vermillion: "hsl(200, 28%, 30%)",
  }),
}));

import { RankTreeSection } from "./rank-tree-section";

describe("<RankTreeSection />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 3D canvas region and hands the qin tree to the scene", () => {
    render(<RankTreeSection />);

    const section = screen.getByLabelText("立体品级树");
    expect(within(section).getByRole("img", { name: /秦官品立体树/ })).toBeInTheDocument();
    expect(mocks.scene.setTrees).toHaveBeenCalledTimes(1);

    const [entries, options] = mocks.scene.setTrees.mock.calls[0] as [
      { dynasty: { id: string }; layout: { tiers: unknown[] } }[],
      { span: string },
    ];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.dynasty.id).toBe("qin");
    expect(entries[0]?.layout.tiers).toHaveLength(6);
    expect(options).toEqual({ span: "band" });
  });

  it("shows the focused tier's 职权范围 by default", () => {
    render(<RankTreeSection />);

    const panel = screen.getByLabelText("秦本级职权");
    expect(within(panel).getByRole("heading", { name: "秦" })).toBeInTheDocument();
    expect(within(panel).getByText("万石")).toBeInTheDocument();
    expect(within(panel).getByText(/本级职权范围/)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /百官之长，助理万机/ })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /掌武事/ })).toBeInTheDocument();
    expect(within(panel).getByText(/2 官 · 文 1 \/ 武 1/)).toBeInTheDocument();
  });

  it("switches dynasty and refocuses the nearest grade", () => {
    render(<RankTreeSection />);

    fireEvent.click(
      within(screen.getByLabelText("树状朝代选择")).getByRole("button", { name: "明" }),
    );

    const calls = mocks.scene.setTrees.mock.calls;
    const [entries] = calls[calls.length - 1] as [{ dynasty: { id: string } }[]];
    expect(entries[0]?.dynasty.id).toBe("ming");

    const panel = screen.getByLabelText("明本级职权");
    expect(within(panel).getByText("三公 · 三孤")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /五军都督府/ })).toBeInTheDocument();
  });

  it("puts two dynasties side by side and mirrors the same grade", () => {
    render(<RankTreeSection />);

    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const calls = mocks.scene.setTrees.mock.calls;
    const [entries] = calls[calls.length - 1] as [{ dynasty: { id: string } }[]];
    expect(entries).toHaveLength(2);
    expect(entries[1]?.dynasty.id).toBe("qing");

    const comparePanel = screen.getByLabelText("清本级职权");
    expect(within(comparePanel).getByText("一品")).toBeInTheDocument();
    expect(within(comparePanel).getByRole("button", { name: /军机大臣/ })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("树状对比朝代选择")).getByRole("button", { name: "秦" }),
    ).toBeDisabled();
  });

  it("marks the focused grade on both trees", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const focusCalls = mocks.scene.setFocus.mock.calls;
    const [mainPick, comparePick] = focusCalls[focusCalls.length - 1] as [
      { dynastyId: string; levelIndex: number },
      { dynastyId: string; levelIndex: number },
    ];
    expect(mainPick).toMatchObject({ dynastyId: "qin", levelIndex: 0 });
    expect(comparePick).toMatchObject({ dynastyId: "qing", levelIndex: 1 });
  });

  it("switches the compare dynasty and can close the second tree", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    fireEvent.click(
      within(screen.getByLabelText("树状对比朝代选择")).getByRole("button", { name: "汉" }),
    );

    const comparePanel = screen.getByLabelText("汉本级职权");
    expect(within(comparePanel).getByText("万石")).toBeInTheDocument();
    const calls = mocks.scene.setTrees.mock.calls;
    const [entries] = calls[calls.length - 1] as [{ dynasty: { id: string } }[]];
    expect(entries[1]?.dynasty.id).toBe("han");

    fireEvent.click(screen.getByRole("button", { name: "单朝" }));
    const closedCalls = mocks.scene.setTrees.mock.calls;
    const [closedEntries] = closedCalls[closedCalls.length - 1] as [{ dynasty: { id: string } }[]];
    expect(closedEntries).toHaveLength(1);
    expect(screen.queryByLabelText("汉本级职权")).not.toBeInTheDocument();
  });

  it("selects a compare-tree office and shows its facets", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    fireEvent.click(
      within(screen.getByLabelText("清本级职权")).getByRole("button", { name: /军机大臣/ }),
    );

    const card = screen.getByLabelText("品级树详情");
    expect(within(card).getByText("军机大臣")).toBeInTheDocument();
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(mocks.scene.focusTier).toHaveBeenCalledWith("qing", expect.any(Number));
  });

  it("follows tier picks and hover events coming from the 3D scene", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const handlers = mocks.create.mock.calls[0]?.[2] as unknown as {
      onHover: (hover: Record<string, unknown> | null) => void;
      onPick: (pick: Record<string, unknown>) => void;
    };

    act(() => {
      handlers.onPick({ dynastyId: "qing", kind: "tier", levelIndex: 0 });
    });

    expect(screen.getByLabelText("秦本级职权")).toHaveTextContent("无同品设官");
    expect(screen.getByLabelText("清本级职权")).toHaveTextContent("超品");

    act(() => {
      handlers.onHover({
        detail: "百官之长，助理万机，文官之首。",
        dynastyId: "qin",
        kind: "office",
        levelIndex: 0,
        officeTitle: "丞相",
        subtitle: "秦 · 金印紫绶 · 秩万石",
        title: "丞相",
      });
    });

    expect(screen.getByText(/百官之长，助理万机，文官之首。/)).toBeInTheDocument();
    expect(screen.getByText("秦 · 金印紫绶 · 秩万石")).toBeInTheDocument();

    act(() => {
      handlers.onHover(null);
    });
    expect(screen.getByText(/拖拽旋转 · 滚轮缩放/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置视角" })).toBeInTheDocument();
  });

  it("switches layout dimensions and camera presets", () => {
    render(<RankTreeSection />);

    fireEvent.click(screen.getByRole("button", { name: "文武分列" }));
    expect(screen.getByRole("button", { name: "文武分列" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const splitCalls = mocks.scene.setTrees.mock.calls;
    const [splitEntries] = splitCalls[splitCalls.length - 1] as [
      { layout: { nodes: { office: { branch: string }; x: number }[] } }[],
    ];
    for (const node of splitEntries[0]?.layout.nodes ?? []) {
      if (node.office.branch === "civil") {
        expect(node.x).toBeLessThan(0);
      } else {
        expect(node.x).toBeGreaterThan(0);
      }
    }

    fireEvent.click(screen.getByRole("button", { name: "层级等距" }));
    const spanCalls = mocks.scene.setTrees.mock.calls;
    expect(spanCalls[spanCalls.length - 1]?.[1]).toEqual({ span: "even" });

    fireEvent.click(screen.getByRole("button", { name: "正视" }));
    expect(mocks.scene.applyPreset).toHaveBeenCalledWith("front");
  });

  it("toggles auto rotation and resets the camera", () => {
    render(<RankTreeSection />);

    fireEvent.click(screen.getByRole("button", { name: "自动旋转" }));
    expect(mocks.scene.setAutoRotate).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "停止旋转" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "重置视角" }));
    expect(mocks.scene.resetView).toHaveBeenCalled();
    expect(mocks.scene.setAutoRotate).toHaveBeenLastCalledWith(false);
  });

  it("opens the four-facet office card from a tree contact list", () => {
    render(<RankTreeSection />);

    fireEvent.click(
      within(screen.getByLabelText("秦本级职权")).getByRole("button", {
        name: /百官之长，助理万机/,
      }),
    );

    const card = screen.getByLabelText("品级树详情");
    expect(within(card).getByText("丞相")).toBeInTheDocument();
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(within(card).getByText("古今对应（参考）")).toBeInTheDocument();
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();

    const selectionCalls = mocks.scene.setSelection.mock.calls;
    expect(selectionCalls[selectionCalls.length - 1]?.[0]).toMatchObject({
      dynastyId: "qin",
      kind: "office",
      officeTitle: "丞相",
    });
    expect(mocks.scene.focusTier).toHaveBeenCalledWith("qin", 0);
  });

  it("jumps to a tier from the grade chip row", () => {
    render(<RankTreeSection />);

    fireEvent.click(
      within(screen.getByLabelText("树状品级选择")).getByRole("button", {
        name: "中二千石",
      }),
    );

    expect(screen.getByLabelText("秦本级职权")).toHaveTextContent("中二千石");
    expect(mocks.scene.focusTier).toHaveBeenCalledWith("qin", 1);
  });

  it("falls back to a text hint when WebGL is unavailable", () => {
    mocks.create.mockReturnValueOnce(null);
    render(<RankTreeSection />);

    expect(screen.getByText(/未能启用 WebGL/)).toBeInTheDocument();
    // 面板仍可用：品级与官职不依赖 canvas。
    expect(
      within(screen.getByLabelText("秦本级职权")).getByRole("button", { name: /百官之长/ }),
    ).toBeInTheDocument();
  });
});
