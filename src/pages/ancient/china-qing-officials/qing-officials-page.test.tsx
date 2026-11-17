import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const scene = {
    applyPreset: vi.fn(),
    dispose: vi.fn(),
    resetView: vi.fn(),
    setAtlas: vi.fn(),
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
    // 视图控件（斜视 / 正视 / 重置视角）
    expect(screen.getByRole("button", { name: "斜视" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "正视" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置视角" })).toBeInTheDocument();
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

  it("shows a node detail card on an office pick and clears it", () => {
    mocks.create.mockReturnValue(mocks.scene);
    renderAt();

    act(() => {
      sceneHandlers().onPick({ id: "censorate", kind: "office", title: "都察院" });
    });
    const card = screen.getByLabelText("清节点详情");
    expect(within(card).getByText("都察院")).toBeInTheDocument();
    expect(within(card).getByText("左都御史 · 正一品")).toBeInTheDocument();
    expect(within(card).getByText("属官衙署")).toBeInTheDocument();

    fireEvent.click(within(card).getByRole("button", { name: "取消选择" }));
    expect(screen.queryByLabelText("清节点详情")).toBeNull();
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
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("绿色");
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
