import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const scene = {
    applyPreset: vi.fn(),
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

  it("lists all eight dynasties and switches the atlas content", () => {
    renderAt();

    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getAllByRole("button")).toHaveLength(8);
    expect(within(picker).getByRole("button", { name: "清" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(picker).getByRole("button", { name: "汉" }));
    expect(within(picker).getByRole("button", { name: "汉" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/秩石十六等/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "军机处" })).toBeNull();
  });

  it.each(
    DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas.name] as const),
  )("loads dynasty %s (%s) from the URL", (id, name) => {
    renderAt(`/china/qing-officials?dynasty=${id}`);
    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 1, name: "官制图谱" })).toBeInTheDocument();
    expect(screen.getByText("皇帝")).toBeInTheDocument();
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

  it("starts collapsed to branches and toggles expansion via picks and menu controls", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    // 默认折叠到分区：皇帝 + 4 组荣衔 + 6 类官署分区 = 11 个节点。
    const lastLayout = () =>
      mocks.scene.setAtlas.mock.calls[mocks.scene.setAtlas.mock.calls.length - 1]?.[1] as {
        nodes: unknown[];
      };
    expect(lastLayout().nodes).toHaveLength(11);

    // 点分区节点展开属官：佐理部出现 8 个衙署，再点六部展开 6 部。
    act(() => {
      sceneHandlers().onPick({ id: "assistant", kind: "branch", title: "佐理部" });
    });
    expect(lastLayout().nodes).toHaveLength(19);
    act(() => {
      sceneHandlers().onPick({ id: "six-boards", kind: "office", title: "六部" });
    });
    expect(lastLayout().nodes).toHaveLength(25);

    const menu = screen.getByLabelText("舞台菜单");
    fireEvent.click(within(menu).getByRole("button", { name: "收起全部" }));
    expect(lastLayout().nodes).toHaveLength(11);
    fireEvent.click(within(menu).getByRole("button", { name: "展开全部" }));
    expect(lastLayout().nodes).toHaveLength(96);
  });

  it("marks the collapsed third tier on the level scale and updates it on expansion", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    const scale = screen.getByLabelText("层级刻度");
    expect(within(scale).getByText("权力本源")).toBeInTheDocument();
    expect(within(scale).getByText("官署分区 · 荣衔")).toBeInTheDocument();
    expect(within(scale).getByText("属官衙署")).toBeInTheDocument();
    // 默认折叠到分区：第三层还没有属官可见，显式提示可展开。
    expect(within(scale).getByText("点分区展开")).toBeInTheDocument();

    act(() => {
      sceneHandlers().onPick({ id: "assistant", kind: "branch", title: "佐理部" });
    });
    expect(within(scale).getByText("8 节点")).toBeInTheDocument();
    expect(within(scale).queryByText("点分区展开")).toBeNull();
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
