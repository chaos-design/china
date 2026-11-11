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

  it("renders the 3D canvas region and hands the complete qin tree to the scene", () => {
    render(<RankTreeSection />);

    const section = screen.getByLabelText("立体品级树");
    expect(
      within(section).getByRole("img", { name: /秦官品立体树：6 级、26 个官职/ }),
    ).toBeInTheDocument();
    expect(mocks.scene.setTrees).toHaveBeenCalledTimes(1);

    const [entries, options] = mocks.scene.setTrees.mock.calls[0] as [
      { dynasty: { id: string }; layout: { tiers: unknown[]; nodes: unknown[] } }[],
      { span: string },
    ];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.dynasty.id).toBe("qin");
    expect(entries[0]?.layout.tiers).toHaveLength(6);
    // 完整名录：26 官全部成为树节点。
    expect(entries[0]?.layout.nodes).toHaveLength(26);
    expect(options).toEqual({ span: "band" });
  });

  it("hangs nodes on the civil / military boughs by default", () => {
    render(<RankTreeSection />);

    const [entries] = mocks.scene.setTrees.mock.calls[0] as [
      {
        layout: {
          civilBough: unknown[];
          militaryBough: unknown[];
          nodes: { post: { branch: string }; x: number }[];
        };
      }[],
    ];
    const layout = entries[0]?.layout;
    // 默认文武分列：双枝 + 节点左右分野。
    expect(layout?.civilBough.length).toBeGreaterThan(1);
    expect(layout?.militaryBough.length).toBeGreaterThan(1);
    for (const node of layout?.nodes ?? []) {
      if (node.post.branch === "civil") {
        expect(node.x).toBeLessThan(0);
      } else {
        expect(node.x).toBeGreaterThan(0);
      }
    }
  });

  it("shows the focused tier's 职权范围 by default", () => {
    render(<RankTreeSection />);

    const panel = screen.getByLabelText("秦本级职权");
    expect(within(panel).getByRole("heading", { name: "秦" })).toBeInTheDocument();
    expect(within(panel).getByText("万石")).toBeInTheDocument();
    expect(within(panel).getByText(/本级职权范围/)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /掌丞天子、助理万机/ })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /掌全国武事/ })).toBeInTheDocument();
    expect(within(panel).getByText(/4 官 · 文 2 \/ 武 2/)).toBeInTheDocument();
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
    expect(within(panel).getByText("正一品 — 从一品")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /五军都督府长官/ })).toBeInTheDocument();
  });

  it("puts two dynasties side by side and mirrors the same grade", () => {
    render(<RankTreeSection />);

    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const calls = mocks.scene.setTrees.mock.calls;
    const [entries] = calls[calls.length - 1] as [{ dynasty: { id: string } }[]];
    expect(entries).toHaveLength(2);
    expect(entries[1]?.dynasty.id).toBe("qing");

    const comparePanel = screen.getByLabelText("清本级职权");
    expect(within(comparePanel).getByText("正一品")).toBeInTheDocument();
    expect(
      within(comparePanel).getByRole("button", { name: /殿阁大学士之首/ }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("树状对比朝代选择")).getByRole("button", { name: "秦" }),
    ).toBeDisabled();
  });

  it("marks the focused grade on both trees", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const focusCalls = mocks.scene.setFocus.mock.calls;
    const [mainPick, comparePick] = focusCalls[focusCalls.length - 1] as [
      { dynastyId: string; gradeIndex: number },
      { dynastyId: string; gradeIndex: number },
    ];
    expect(mainPick).toMatchObject({ dynastyId: "qin", gradeIndex: 0 });
    expect(comparePick).toMatchObject({ dynastyId: "qing", gradeIndex: 1 });
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
      within(screen.getByLabelText("清本级职权")).getByRole("button", { name: /殿阁大学士之首/ }),
    );

    const card = screen.getByLabelText("品级树详情");
    expect(within(card).getByText("文华殿大学士")).toBeInTheDocument();
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(mocks.scene.focusTier).toHaveBeenCalledWith("qing", 1);
  });

  it("follows tier picks and hover events coming from the 3D scene", () => {
    render(<RankTreeSection />);
    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const handlers = mocks.create.mock.calls[0]?.[2] as unknown as {
      onHover: (hover: Record<string, unknown> | null) => void;
      onPick: (pick: Record<string, unknown>) => void;
    };

    act(() => {
      handlers.onPick({ dynastyId: "qing", kind: "tier", gradeIndex: 0 });
    });

    expect(screen.getByLabelText("秦本级职权")).toHaveTextContent("无同品设官");
    expect(screen.getByLabelText("清本级职权")).toHaveTextContent("超品");

    act(() => {
      handlers.onHover({
        detail: "掌丞天子、助理万机，为百官之长；秦分左右丞相。",
        dynastyId: "qin",
        kind: "office",
        gradeIndex: 0,
        officeTitle: "丞相",
        subtitle: "秦 · 金印紫绶 · 秩万石",
        title: "丞相",
      });
    });

    expect(screen.getByText(/掌丞天子、助理万机/)).toBeInTheDocument();
    expect(screen.getByText("秦 · 金印紫绶 · 秩万石")).toBeInTheDocument();

    act(() => {
      handlers.onHover(null);
    });
    expect(screen.getByText(/拖拽旋转 · 滚轮缩放/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置视角" })).toBeInTheDocument();
  });

  it("switches layout dimensions and camera presets", () => {
    render(<RankTreeSection />);

    // 默认已是文武分列，切换到合列后双枝消失、文官不再约束在左半环。
    fireEvent.click(screen.getByRole("button", { name: "合列" }));
    const splitCalls = mocks.scene.setTrees.mock.calls;
    const [splitEntries] = splitCalls[splitCalls.length - 1] as [
      { layout: { civilBough: unknown[]; nodes: { post: { branch: string }; x: number }[] } }[],
    ];
    expect(splitEntries[0]?.layout.civilBough).toHaveLength(0);
    const civilNodes = splitEntries[0]?.layout.nodes.filter((node) => node.post.branch === "civil");
    expect(civilNodes?.some((node) => node.x >= 0)).toBe(true);

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

  it("opens the five-facet office card with figures from a tree contact list", () => {
    render(<RankTreeSection />);

    fireEvent.click(
      within(screen.getByLabelText("秦本级职权")).getByRole("button", {
        name: /掌丞天子、助理万机/,
      }),
    );

    const card = screen.getByLabelText("品级树详情");
    expect(within(card).getByText("丞相")).toBeInTheDocument();
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(within(card).getByText("古今对应（参考）")).toBeInTheDocument();
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();
    // 名臣名将 facet：合并自 officials-data。
    expect(within(card).getByText("相关名臣 · 名将")).toBeInTheDocument();
    expect(within(card).getByText("王绾")).toBeInTheDocument();
    expect(within(card).getByText("李斯")).toBeInTheDocument();

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
      within(screen.getByLabelText("秦本级职权")).getByRole("button", { name: /掌丞天子/ }),
    ).toBeInTheDocument();
  });
});
