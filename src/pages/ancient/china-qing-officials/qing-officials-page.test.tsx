import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const scene = {
    applyPreset: vi.fn(),
    focusNode: vi.fn(),
    dispose: vi.fn(),
    resetView: vi.fn(),
    setAtlas: vi.fn(),
    setAutoRotate: vi.fn(),
    setFilter: vi.fn(),
  };
  return {
    // 第三个实参是页面传入的回调（onHover / onPick / onUnavailable）。
    // 默认返回 null（模拟无 WebGL）→ 页面回落 2D 卡片镜像；3D 用例里 mockReturnValue(scene)。
    create: vi.fn<(host: HTMLElement, colors: unknown, callbacks: unknown) => typeof scene | null>(
      () => null,
    ),
    scene,
  };
});

vi.mock("./office-tree-scene", () => ({
  createOfficeTreeScene: mocks.create,
  readOfficeTreeColors: () => ({
    blueprint: "hsl(210, 16%, 40%)",
    ink: "hsl(220, 14%, 13%)",
    ochre: "hsl(38, 30%, 55%)",
    paper: "hsl(40, 18%, 90%)",
    vermillion: "hsl(200, 28%, 30%)",
  }),
}));

import { DYNASTY_ATLASES } from "./data";
import { QingOfficialsPage } from "./qing-officials-page";

function renderAt(entry = "/china/qing-officials") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <QingOfficialsPage />
    </MemoryRouter>,
  );
}

function sceneHandlers() {
  return mocks.create.mock.calls[0]?.[2] as unknown as {
    onHover: (hover: { detail: string; subtitle: string; title: string } | null) => void;
    onPick: (pick: Record<string, unknown> | null) => void;
    onUnavailable: () => void;
  };
}

describe("<QingOfficialsPage /> — 朝代数据驱动 + 立体树", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockReturnValue(null);
  });

  it("renders the Qing atlas by default with the 2D fallback branch set (no WebGL)", () => {
    renderAt();

    expect(screen.getByRole("heading", { level: 1, name: "官制图谱" })).toBeInTheDocument();
    expect(screen.getByText("皇帝")).toBeInTheDocument();
    for (const title of ["中枢部", "佐理部", "帝室部", "行省", "藩部", "府州县"]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it("lists all twelve dynasties and switches the atlas content", () => {
    renderAt();

    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getAllByRole("button")).toHaveLength(DYNASTY_ATLASES.length);
    expect(within(picker).getByRole("button", { name: "清" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(picker).getByRole("button", { name: "汉" }));
    expect(within(picker).getByRole("button", { name: "汉" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { level: 3, name: "外朝 · 三公九卿" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "军机处" })).toBeNull();
  });

  it.each(
    DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas.name] as const),
  )("loads dynasty %s (%s) from the URL", (id, name) => {
    renderAt(`/china/qing-officials?dynasty=${id}`);
    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 1, name: "官制图谱" })).toBeInTheDocument();
    expect(screen.getByText(id === "zhou" ? "周王" : "皇帝")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  it("falls back to Qing with a notice for an unknown dynasty", () => {
    renderAt("/china/qing-officials?dynasty=not-a-dynasty");

    expect(screen.getByText(/未收录该朝代/)).toBeInTheDocument();
    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getByRole("button", { name: "清" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("expands a tree node to reveal its subordinate offices in the fallback", () => {
    renderAt();

    const sixBoards = screen.getByRole("button", { name: /六部/ });
    expect(sixBoards).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(sixBoards);
    expect(sixBoards).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("吏部").length).toBeGreaterThan(0);
    expect(screen.getAllByText("工部").length).toBeGreaterThan(0);
  });

  // ——— 3D 立体树（WebGL 可用）———

  it("renders the 3D canvas, view controls and hands the atlas to the scene", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    expect(screen.getByLabelText("官制立体树")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /清官制立体树/ })).toBeInTheDocument();
    // 视图控件（斜视 / 正视 / 旋转 / 复位，均为单行两字文案）
    expect(screen.getByRole("button", { name: "斜视" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "正视" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复位" })).toBeInTheDocument();
    // 慢速自转默认开启（reduce-motion 由场景侧判定），按钮为同步开关
    expect(screen.getByRole("button", { name: "旋转" })).toHaveAttribute("aria-pressed", "true");
    expect(mocks.scene.setAutoRotate).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "旋转" }));
    expect(screen.getByRole("button", { name: "旋转" })).toHaveAttribute("aria-pressed", "false");
    expect(mocks.scene.setAutoRotate).toHaveBeenLastCalledWith(false);
    // 场景同步拿到布局：调用过一次 setAtlas
    expect(mocks.scene.setAtlas).toHaveBeenCalledTimes(1);
    // WebGL 可用时不再有加载态与降级提示
    expect(screen.queryByText(/正在展开官制立体树/)).toBeNull();
    expect(screen.queryByText(/未能启用 WebGL/)).toBeNull();
  });

  it("switches the 3D tree to a new dynasty and re-syncs the scene", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const picker = screen.getByLabelText("朝代选择");
    fireEvent.click(within(picker).getByRole("button", { name: "秦" }));
    expect(mocks.scene.setAtlas).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("img", { name: /秦官制立体树/ })).toBeInTheDocument();
  });

  it("starts fully expanded and toggles expansion via picks and menu controls", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    // 默认全展开：一落地即见完整从属树（96 节点），每枚属官都有标注（重叠交由场景避让）。
    const lastLayout = () =>
      mocks.scene.setAtlas.mock.calls[mocks.scene.setAtlas.mock.calls.length - 1]?.[1] as {
        nodes: unknown[];
      };
    expect(lastLayout().nodes).toHaveLength(96);

    // 点已展开的分区节点会收起其子树：佐理部收起后从 96 减去其可见后代。
    act(() => {
      sceneHandlers().onPick({ id: "assistant", kind: "branch", title: "佐理部" });
    });
    expect(lastLayout().nodes.length).toBeLessThan(96);
    act(() => {
      sceneHandlers().onPick({ id: "assistant", kind: "branch", title: "佐理部" });
    });
    expect(lastLayout().nodes).toHaveLength(96);

    const menu = screen.getByLabelText("舞台菜单");
    fireEvent.click(within(menu).getByRole("button", { name: "收起全部" }));
    expect(lastLayout().nodes).toHaveLength(11);
    fireEvent.click(within(menu).getByRole("button", { name: "展开全部" }));
    expect(lastLayout().nodes).toHaveLength(96);
  });

  it("brings a menu selection into view facing front", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const menu = screen.getByLabelText("舞台菜单");
    fireEvent.click(within(menu).getByRole("button", { name: /中枢部/ }));
    expect(mocks.scene.focusNode).toHaveBeenCalledWith("central", { faceFront: true });
  });

  it("keeps the level scale to tier names only", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const scale = screen.getByLabelText("层级刻度");
    expect(within(scale).getByText("权力本源")).toBeInTheDocument();
    expect(within(scale).getByText("官署分区 · 荣衔")).toBeInTheDocument();
    expect(within(scale).getByText("属官衙署")).toBeInTheDocument();
    expect(within(scale).queryByText(/节点/)).toBeNull();
    expect(within(scale).queryByText("点分区展开")).toBeNull();

    // 收起全部后刻度仍只呈现层级名称，不回显节点数。
    const menu = screen.getByLabelText("舞台菜单");
    fireEvent.click(within(menu).getByRole("button", { name: "收起全部" }));
    expect(within(scale).queryByText(/节点/)).toBeNull();
  });

  it("folds the reading guide into a toggleable chip with a structured bubble", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    // 读图气泡默认收纳并落在舞台右侧：刻度上的口诀已移入这里作主句。
    const chip = screen.getByRole("button", { name: "读图" });
    expect(chip.parentElement).toHaveClass("right-3");
    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("读图说明")).toBeNull();
    expect(screen.queryByText("面片由近及远 · 层级越深越收敛")).toBeNull();

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-expanded", "true");
    const bubble = screen.getByLabelText("读图说明");
    expect(within(bubble).getByText("面片由近及远 · 层级越深越收敛")).toBeInTheDocument();
    expect(within(bubble).getByText("看面片")).toBeInTheDocument();
    expect(within(bubble).getByText("循层级")).toBeInTheDocument();
    expect(within(bubble).getByText("点细节")).toBeInTheDocument();
    expect(within(bubble).getByLabelText("本朝制度口径")).toHaveTextContent("军机处");
    expect(within(bubble).getByLabelText("文献依据")).toHaveTextContent("清史稿");
    expect(within(bubble).getByLabelText("读图示例")).toHaveTextContent("军机处");

    fireEvent.click(within(bubble).getByRole("button", { name: "收起读图说明" }));
    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("读图说明")).toBeNull();

    // 抽屉展开时气泡自动收起，chip 让到抽屉左侧；层级高于抽屉，不被面板盖住。
    fireEvent.click(chip);
    act(() => {
      sceneHandlers().onPick({ id: "censorate", kind: "office", title: "都察院" });
    });
    expect(screen.queryByLabelText("读图说明")).toBeNull();
    expect(chip.parentElement).toHaveClass("lg:right-[calc(360px+0.75rem)]");
  });

  it("opens the right-side detail drawer on an office pick and closes it", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    act(() => {
      sceneHandlers().onPick({ id: "censorate", kind: "office", title: "都察院" });
    });
    const drawer = screen.getByLabelText("官制详情");
    expect(within(drawer).getByText("都察院")).toBeInTheDocument();
    expect(within(drawer).getByText("左都御史 · 正一品")).toBeInTheDocument();
    expect(within(drawer).getByText("属官衙署")).toBeInTheDocument();
    expect(within(drawer).getByText(/皇帝 \/ .*都察院/)).toBeInTheDocument();
    // 品级实档：正一品括注对位到本朝品秩谱，落出顶戴 / 朝服 / 岁俸实档。
    expect(within(drawer).getByText(/品级实档/)).toBeInTheDocument();
    expect(within(drawer).getByText(/红宝石顶/)).toBeInTheDocument();
    expect(within(drawer).getByText(/石青色绣金/)).toBeInTheDocument();
    expect(within(drawer).getByText(/180 两/)).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "关闭详情" }));
    expect(drawer).toHaveAttribute("aria-hidden", "true");
    expect(drawer).toHaveAttribute("inert");
  });

  it("floats a relation filter inside the stage, focuses a branch and details it on the right", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const menu = screen.getByLabelText("舞台菜单");
    const branch = within(menu).getByRole("button", { name: /中枢部/ });
    expect(branch).toHaveAttribute("aria-pressed", "false");
    // 左菜单分区行标注品级跨度（哪一层是哪个品级）。
    expect(within(branch).getByText("正一品—正五品")).toBeInTheDocument();

    fireEvent.click(branch);
    expect(branch).toHaveAttribute("aria-pressed", "true");
    // 场景收到该分支子树的 id 集合，全景恢复为 null。
    const calls = mocks.scene.setFilter.mock.calls;
    const ids = calls[calls.length - 1]?.[0] as string[] | null;
    expect(ids).toContain("central");
    expect(ids?.length).toBeGreaterThan(1);
    // 选中的原子自动进入可视区：菜单聚焦同步把该分区补间到镜头中央。
    expect(mocks.scene.focusNode).toHaveBeenLastCalledWith("central", { faceFront: true });

    const drawer = screen.getByLabelText("官制详情");
    expect(within(drawer).getByRole("heading", { name: "中枢部" })).toBeInTheDocument();
    expect(within(drawer).getByText("官署分区")).toBeInTheDocument();
    expect(within(drawer).getByText(/个节点/)).toBeInTheDocument();
    // 衙署名录：聚焦的分区把属官与品级一条条列出来。
    expect(within(drawer).getByText("衙署名录")).toBeInTheDocument();
    expect(within(drawer).getByText("军机处")).toBeInTheDocument();
    expect(within(drawer).getByText("议政王大臣会议")).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole("button", { name: "清除" }));
    expect(
      mocks.scene.setFilter.mock.calls[mocks.scene.setFilter.mock.calls.length - 1]?.[0],
    ).toBeNull();
    expect(drawer).toHaveAttribute("aria-hidden", "true");
  });

  it("shows an overview in the drawer when the full-tree filter is picked", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const filter = screen.getByLabelText("从属关系筛选");
    fireEvent.click(within(filter).getByRole("button", { name: "全景" }));

    const drawer = screen.getByLabelText("官制详情");
    expect(within(drawer).getByRole("heading", { name: "全景" })).toBeInTheDocument();
    expect(within(drawer).getByText(/完整从属树/)).toBeInTheDocument();
    expect(
      mocks.scene.setFilter.mock.calls[mocks.scene.setFilter.mock.calls.length - 1]?.[0],
    ).toBeNull();
  });

  it("lets the floating filter collapse without unmounting the scene", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const menu = screen.getByLabelText("舞台菜单");
    fireEvent.click(within(menu).getByRole("button", { name: "收起从属筛选" }));
    expect(within(menu).queryByRole("button", { name: /中枢部/ })).toBeNull();
    fireEvent.click(within(menu).getByRole("button", { name: "展开从属筛选" }));
    expect(within(menu).getByRole("button", { name: /中枢部/ })).toBeInTheDocument();
    expect(mocks.scene.setAtlas).toHaveBeenCalledTimes(1);
  });

  it("offers a retry entry and keeps the 2D mirror when the scene fails", () => {
    renderAt(); // 默认 create 返回 null → failed

    expect(screen.getByText(/未能启用 WebGL/)).toBeInTheDocument();
    // 降级镜像仍在
    expect(screen.getByText("皇帝")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试立体树" })).toBeInTheDocument();
  });

  it("reads out a hovered node in the 3D view", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    act(() => {
      sceneHandlers().onHover({ detail: "掌天文历法", subtitle: "清 · 钦天监", title: "钦天监" });
    });
    expect(screen.getByText(/掌天文历法/)).toBeInTheDocument();
    expect(screen.getByText("清 · 钦天监")).toBeInTheDocument();
  });

  it("keeps the selected view when the dynasty changes", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));
    expect(screen.getByRole("tab", { name: "品级礼制" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(within(screen.getByLabelText("朝代选择")).getByRole("button", { name: "汉" }));
    expect(screen.getByRole("tab", { name: "品级礼制" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("品级阶梯")).toBeInTheDocument();
  });

  it("maps Qing salaries to a dated modern silver value", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    const detail = screen.getByLabelText("正一品档案");
    expect(detail).toHaveTextContent("约合 ¥62,106");
    expect(detail).toHaveTextContent("2026-11-21");
    expect(screen.getByLabelText("俸禄阶梯")).toHaveTextContent("≈¥6.2万");
  });

  it("recomputes salaries when the reader edits the silver price", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    fireEvent.change(screen.getByLabelText("银价（元/克）"), { target: { value: "10" } });
    expect(screen.getByLabelText("正一品档案")).toHaveTextContent("约合 ¥67,142");
    expect(screen.getByLabelText("正一品档案")).toHaveTextContent("自定义");
  });

  it("folds salaries of non-silver dynasties into the same map", () => {
    renderAt("/china/qing-officials?dynasty=han");
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    const salary = screen.getByLabelText("俸禄阶梯");
    expect(salary).toHaveTextContent("≈¥");
    expect(salary).toHaveTextContent("等比折银");
  });

  it("links the ladder to the detail card in the rank view", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    const ladder = screen.getByLabelText("品级阶梯");
    const fifth = within(ladder)
      .getAllByRole("button", { name: /正五品/ })
      .find((button) => button.getAttribute("aria-pressed") !== null)!;
    fireEvent.click(fifth);
    expect(fifth).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("水晶顶");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("青色");
  });

  it("renders the full-spectrum strips and the six essentials in the rank view", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    // 顶戴全谱：18 枚可点选，点选联动档案卡。
    const hats = screen.getByLabelText("顶戴全谱");
    expect(within(hats).getAllByRole("button")).toHaveLength(18);
    fireEvent.click(within(hats).getByRole("button", { name: /正一品/ }));
    expect(screen.getByLabelText("正一品档案")).toBeInTheDocument();

    // 朝服全谱：绣金 / 绣银分列。
    const robes = screen.getByLabelText("朝服全谱");
    expect(robes).toHaveTextContent("石青色绣金");
    expect(robes).toHaveTextContent("石青色绣银");

    // 俸禄阶梯：柱高相对示意，标注岁俸实数。
    const salary = screen.getByLabelText("俸禄阶梯");
    expect(salary).toHaveTextContent("180 两");
    expect(salary).toHaveTextContent("33 两");

    // 六项要义：notes 六口径全部落图。
    const essentials = screen.getByLabelText("六项要义");
    expect(essentials).toHaveTextContent("九品十八级");
    expect(essentials).toHaveTextContent("养廉银");
  });

  it("shows badges for Qing and an explanatory note for dynasties without them", () => {
    const { unmount } = renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));
    expect(screen.getByLabelText("文官补子 · 飞禽")).toHaveTextContent("仙鹤");
    expect(screen.getByLabelText("武官补子 · 走兽")).toHaveTextContent("麒麟");
    unmount();

    renderAt("/china/qing-officials?dynasty=han");
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));
    expect(screen.queryByLabelText("文官补子 · 飞禽")).toBeNull();
    expect(screen.getByLabelText("补子制度")).toHaveTextContent("补子尚未出现");
  });
});
