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

import { RanksPage } from "./ranks-page";

function sceneHandlers() {
  return mocks.create.mock.calls[0]?.[2] as unknown as {
    onHover: (hover: { detail: string; subtitle: string; title: string } | null) => void;
    onPick: (pick: Record<string, unknown>) => void;
    onUnavailable: () => void;
  };
}

function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: "品级资料" }));
}

function openTab(label: string) {
  fireEvent.click(within(screen.getByRole("tablist")).getByRole("tab", { name: label }));
}

type SceneTreesCall = [
  {
    dynasty: { id: string };
    layout: { civilBough: unknown[]; nodes: { post: { branch: string }; x: number }[] };
  }[],
  { span: string },
];

function lastSetTreesCall() {
  const calls = mocks.scene.setTrees.mock.calls as SceneTreesCall[];
  return calls[calls.length - 1]!;
}

describe("<RanksPage /> — 单屏沉浸舞台 + 悬浮面板 + 资料抽屉", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the full-viewport stage: full-bleed canvas, top title strip, bottom-left menu, closed drawer", () => {
    render(<RanksPage />);

    const article = screen.getByRole("heading", { level: 1, name: "品级纵横" }).closest("article");
    expect(article).toHaveClass("h-full", "overflow-hidden");

    // 全幅画布宿主（timeline #cv 的对应物）
    expect(
      within(article as HTMLElement).getByRole("img", { name: /秦官品立体树：6 级、26 个官职/ }),
    ).toBeInTheDocument();

    // 立体树视图控件（分列/层高/视角）并入左侧「对照 · 视图」菜单，顶中不再悬浮
    expect(screen.getByLabelText("分列模式")).toBeInTheDocument();
    expect(screen.getByLabelText("层高模式")).toBeInTheDocument();
    expect(screen.getByLabelText("视角预设")).toBeInTheDocument();

    // 左下「对照 · 视图」面板：八朝 chips + 双朝并置 + 图例 + 视图控件
    const filter = screen.getByLabelText("对照视图");
    expect(within(filter).getByLabelText("朝代选择")).toBeInTheDocument();
    expect(within(filter).getByLabelText("双朝并置")).toBeInTheDocument();
    expect(within(filter).getByLabelText("分列模式")).toBeInTheDocument();
    expect(within(filter).getByLabelText("视角预设")).toBeInTheDocument();
    expect(within(filter).getByText(/6 级 · 26 官/)).toBeInTheDocument();

    // 品秩全景入口 + 抽屉默认收起（aria-hidden，对读屏/键盘不可达）
    expect(screen.getByRole("link", { name: /品秩全景/ })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("hands the complete qin tree to the scene and mirrors split/span options", () => {
    render(<RanksPage />);

    expect(mocks.scene.setTrees).toHaveBeenCalledTimes(1);
    const [entries, options] = mocks.scene.setTrees.mock.calls[0] as [
      { dynasty: { id: string }; layout: { nodes: unknown[]; civilBough: unknown[] } }[],
      { span: string },
    ];
    expect(entries[0]?.dynasty.id).toBe("qin");
    expect(entries[0]?.layout.nodes).toHaveLength(26);
    expect(entries[0]?.layout.civilBough.length).toBeGreaterThan(1);
    expect(options).toEqual({ span: "band" });

    // 合列：双枝消失、文官不再约束在左半环
    fireEvent.click(screen.getByRole("button", { name: "合列" }));
    const [splitEntries] = lastSetTreesCall();
    expect(splitEntries[0]?.layout.civilBough).toHaveLength(0);
    expect(
      splitEntries[0]?.layout.nodes
        .filter((node) => node.post.branch === "civil")
        .some((node) => node.x >= 0),
    ).toBe(true);

    // 层高与视角
    fireEvent.click(screen.getByRole("button", { name: "层级等距" }));
    expect(lastSetTreesCall()?.[1]).toEqual({ span: "even" });
    fireEvent.click(screen.getByRole("button", { name: "正视" }));
    expect(mocks.scene.applyPreset).toHaveBeenCalledWith("front");
    fireEvent.click(screen.getByRole("button", { name: "自动旋转" }));
    expect(mocks.scene.setAutoRotate).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "重置视角" }));
    expect(mocks.scene.resetView).toHaveBeenCalled();
  });

  it("opens the drawer with five tabs; default tab is 树 showing the focused tier", () => {
    render(<RanksPage />);
    openDrawer();

    const tablist = screen.getByRole("tablist");
    for (const label of ["树", "族谱", "阶梯", "追踪", "断面"]) {
      expect(within(tablist).getByRole("tab", { name: label })).toBeInTheDocument();
    }
    expect(within(tablist).getByRole("tab", { name: "树" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const panel = screen.getByLabelText("秦本级职权");
    expect(within(panel).getByText("万石")).toBeInTheDocument();
    expect(within(panel).getByText(/本级职权范围/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭品级资料抽屉" }));
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("jumps to a tier from the tree tab's grade chips", () => {
    render(<RanksPage />);
    openDrawer();

    fireEvent.click(
      within(screen.getByLabelText("树状品级选择")).getByRole("button", { name: "中二千石" }),
    );

    expect(screen.getByLabelText("秦本级职权")).toHaveTextContent("中二千石");
    expect(mocks.scene.focusTier).toHaveBeenCalledWith("qin", 1);
  });

  it("opens the drawer on an office pick from the 3D canvas with the five-facet card", () => {
    render(<RanksPage />);

    act(() => {
      sceneHandlers().onPick({
        dynastyId: "qin",
        kind: "office",
        gradeIndex: 0,
        officeTitle: "丞相",
      });
    });

    const card = screen.getByLabelText("品级树详情");
    expect(within(card).getByText("丞相")).toBeInTheDocument();
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(within(card).getByText("古今对应（参考）")).toBeInTheDocument();
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();
    expect(within(card).getByText("相关名臣 · 名将")).toBeInTheDocument();
    expect(mocks.scene.setSelection).toHaveBeenLastCalledWith(
      expect.objectContaining({ dynastyId: "qin", kind: "office", officeTitle: "丞相" }),
    );
  });

  it("follows tier picks and hover events coming from the 3D scene", () => {
    render(<RanksPage />);

    act(() => {
      sceneHandlers().onPick({ dynastyId: "qin", kind: "tier", gradeIndex: 1 });
    });
    expect(screen.getByLabelText("秦本级职权")).toHaveTextContent("中二千石");

    act(() => {
      sceneHandlers().onHover({
        detail: "掌丞天子、助理万机，为百官之长；秦分左右丞相。",
        subtitle: "秦 · 金印紫绶 · 秩万石",
        title: "丞相",
      });
    });
    expect(screen.getByText(/掌丞天子、助理万机/)).toBeInTheDocument();
    expect(screen.getByText("秦 · 金印紫绶 · 秩万石")).toBeInTheDocument();

    act(() => {
      sceneHandlers().onHover(null);
    });
    expect(screen.getByText(/拖拽旋转/)).toBeInTheDocument();
  });

  it("switches the main dynasty from the filter panel and syncs the genealogy tab", () => {
    render(<RanksPage />);

    fireEvent.click(within(screen.getByLabelText("朝代选择")).getByRole("button", { name: "明" }));
    const [entries] = lastSetTreesCall();
    expect(entries[0]?.dynasty.id).toBe("ming");

    openDrawer();
    openTab("族谱");
    const section = screen.getByLabelText("品级族谱");
    expect(within(section).getByText(/明 ·/)).toBeInTheDocument();
  });

  it("puts two dynasties side by side and disables the main one in the compare picker", () => {
    render(<RanksPage />);

    fireEvent.click(
      within(screen.getByLabelText("双朝并置")).getByRole("button", { name: "朝代对比" }),
    );
    const [entries] = lastSetTreesCall();
    expect(entries).toHaveLength(2);
    expect(entries[1]?.dynasty.id).toBe("qing");

    openDrawer();
    expect(screen.getByLabelText("清本级职权")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("对比朝代选择")).getByRole("button", { name: "秦" }),
    ).toBeDisabled();
  });

  it("keeps the compare column off the main dynasty when the main reaches the compare one", () => {
    render(<RanksPage />);

    fireEvent.click(
      within(screen.getByLabelText("双朝并置")).getByRole("button", { name: "朝代对比" }),
    );
    fireEvent.click(within(screen.getByLabelText("朝代选择")).getByRole("button", { name: "清" }));

    const [entries] = lastSetTreesCall();
    expect(entries[0]?.dynasty.id).toBe("qing");
    expect(entries[1]?.dynasty.id).toBe("qin");
  });

  it("renders the ladder tab in single-dynasty mode, then side-stacked compare mode", () => {
    render(<RanksPage />);
    openDrawer();
    openTab("阶梯");

    const ladder = screen.getByLabelText("品级阶梯");
    expect(within(ladder).getByRole("heading", { level: 3, name: "秦" })).toBeInTheDocument();
    expect(within(ladder).queryByRole("heading", { level: 3, name: "清" })).toBeNull();
    expect(within(ladder).getAllByText(/约当/).length).toBeGreaterThan(0);

    fireEvent.click(within(ladder).getByRole("button", { name: "朝代对比" }));
    expect(within(ladder).getByRole("heading", { level: 3, name: "清" })).toBeInTheDocument();
    expect(within(ladder).getByText("军机大臣")).toBeInTheDocument();

    // 点官职 → 共享详情卡
    fireEvent.click(within(ladder).getByRole("button", { name: /百官之长，助理万机/ }));
    const card = screen.getByLabelText("官职详情");
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();
    expect(within(card).queryByText("秩俸")).toBeNull();
  });

  it("reinterprets the six tracks as a vertical timeline in the track tab", () => {
    render(<RanksPage />);
    openDrawer();
    openTab("追踪");

    const section = screen.getByLabelText("同职追踪");
    const picker = within(section).getByLabelText("职系选择");
    expect(within(picker).getAllByRole("button")).toHaveLength(6);
    // 默认首条职系：八个王朝停靠点纵向展开
    expect(
      within(section).getByRole("heading", { level: 3, name: "宰辅 · 百官之长" }),
    ).toBeInTheDocument();
    for (const name of ["秦", "汉", "魏晋南北朝", "隋唐", "宋", "元", "明", "清"]) {
      expect(within(section).getByText(name)).toBeInTheDocument();
    }
    expect(within(section).getByText(/票拟须批红而后行/)).toBeInTheDocument();

    fireEvent.click(within(picker).getByRole("button", { name: "监察 · 御史台系" }));
    // 御史大夫：秦与唐两停靠点同名，纵向时间线各出现一次
    expect(within(section).getAllByText("御史大夫")).toHaveLength(2);
  });

  it("compares the same grade across dynasties in the grade tab", () => {
    render(<RanksPage />);
    openDrawer();
    openTab("断面");

    const section = screen.getByLabelText("同品断面");
    const picker = within(section).getByLabelText("品序选择");
    expect(within(picker).getAllByRole("button")).toHaveLength(9);

    // 默认一品：清列在军机大臣；秦汉带「约当」示意标记
    expect(within(section).getByText("军机大臣")).toBeInTheDocument();
    expect(within(section).getAllByText("约当").length).toBeGreaterThan(0);

    fireEvent.click(within(picker).getByRole("button", { name: "四品" }));
    expect(within(section).getAllByText("本级无设官").length).toBeGreaterThan(0);

    // 脚注保留口径说明
    expect(within(section).getByText(/秦汉未行九品/)).toBeInTheDocument();
  });

  it("falls back to a text hint when WebGL is unavailable and auto-opens the genealogy tab", () => {
    mocks.create.mockReturnValueOnce(null);
    render(<RanksPage />);

    expect(screen.getByText(/未能启用 WebGL/)).toBeInTheDocument();
    // 抽屉自动停在「族谱」tab（无 WebGL 的 2D 镜像）
    const tablist = screen.getByRole("tablist");
    expect(within(tablist).getByRole("tab", { name: "族谱" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("品级族谱")).toBeInTheDocument();
  });
});
