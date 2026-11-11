import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOfficialsDynasty } from "./officials-data";

const mocks = vi.hoisted(() => {
  const scene = {
    applyPreset: vi.fn(),
    dispose: vi.fn(),
    focusGrade: vi.fn(),
    resetView: vi.fn(),
    resize: vi.fn(),
    setActiveGrade: vi.fn(),
    setAutoRotate: vi.fn(),
    setDynasty: vi.fn(),
    setSpacing: vi.fn(),
  };
  return {
    create: vi.fn<(host: HTMLElement, colors: unknown, handlers: unknown) => typeof scene | null>(
      () => scene,
    ),
    scene,
  };
});

vi.mock("./officials-hall-scene", () => ({
  createHallScene: mocks.create,
  readHallColors: () => ({
    blueprint: "hsl(210, 16%, 40%)",
    ink: "hsl(220, 14%, 13%)",
    ochre: "hsl(38, 30%, 55%)",
    paper: "hsl(40, 18%, 90%)",
    vermillion: "hsl(200, 28%, 30%)",
  }),
}));

import { OfficialsHallPage } from "./officials-hall-page";

function renderPage() {
  return render(
    <MemoryRouter>
      <OfficialsHallPage />
    </MemoryRouter>,
  );
}

function sceneHandlers() {
  return mocks.create.mock.calls[0]?.[2] as unknown as {
    onFrame: (projections: { id: string; x: number; y: number }[]) => void;
    onGradeHover: (id: string | null) => void;
    onGradePick: (id: string | null) => void;
    onUnavailable?: () => void;
  };
}

function menu() {
  return within(screen.getByLabelText("朝代与操作菜单"));
}

describe("<OfficialsHallPage />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the immersive shell, left menu and 秦 grade roster", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "品秩全景" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /秦官职体系立体场景/ })).toBeInTheDocument();
    expect(menu().getByRole("button", { name: "秦" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("三公九卿 · 秩石")).toBeInTheDocument();

    const qin = getOfficialsDynasty("qin")!;
    for (const grade of qin.grades) {
      expect(screen.getByLabelText(`${grade.label}官职名录`)).toBeInTheDocument();
    }
    const topCard = screen.getByLabelText("万石官职名录");
    expect(within(topCard).getByRole("button", { name: "丞相" })).toBeInTheDocument();
    expect(within(topCard).getByRole("button", { name: "太尉" })).toBeInTheDocument();
    expect(within(topCard).getByText("文官")).toBeInTheDocument();
    expect(within(topCard).getByText("武官")).toBeInTheDocument();

    expect(mocks.scene.setDynasty).toHaveBeenCalledTimes(1);
    expect(mocks.scene.setDynasty.mock.calls[0]?.[0]).toMatchObject({ id: "qin" });
  });

  it("projects HUD rows onto the same level as their 3D grade nodes", () => {
    renderPage();
    const host = screen.getByRole("img", { name: /秦官职体系立体场景/ });
    Object.defineProperty(host, "clientHeight", { configurable: true, value: 800 });

    const qin = getOfficialsDynasty("qin")!;
    const projections = qin.grades.map((grade, index) => ({
      id: grade.id,
      x: 320,
      y: 120 + index * 110,
    }));

    act(() => {
      sceneHandlers().onFrame(projections);
    });

    const firstCard = screen.getByLabelText("万石官职名录");
    expect(firstCard.style.getPropertyValue("--hall-row-y")).toMatch(/px$/);
    // 卡片最大高度 = 行间距(130) - 12，任何视口下右侧名录都不重叠
    expect(firstCard.style.getPropertyValue("--hall-card-max-h")).toBe("118px");
    expect(document.querySelector("article")?.style.getPropertyValue("--hall-drawer-y")).toMatch(
      /px$/,
    );
  });

  it("changes the whole page content when the dynasty is switched", () => {
    renderPage();

    fireEvent.click(menu().getByRole("button", { name: "明" }));

    const calls = mocks.scene.setDynasty.mock.calls;
    expect(calls[calls.length - 1]?.[0]).toMatchObject({ id: "ming" });
    expect(menu().getByRole("button", { name: "明" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("废丞相 · 六部与内阁")).toBeInTheDocument();
    expect(screen.getByLabelText("正一品 — 从一品官职名录")).toBeInTheDocument();
    expect(screen.queryByLabelText("万石官职名录")).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText("正四品 — 正五品官职名录")).getByRole("button", {
        name: "内阁大学士",
      }),
    ).toBeInTheDocument();
  });

  it("filters the roster by 文官 / 武官 without changing the grade stack", () => {
    renderPage();
    const topCard = screen.getByLabelText("万石官职名录");

    fireEvent.click(menu().getByRole("button", { name: "武官" }));
    expect(within(topCard).getByRole("button", { name: "太尉" })).toBeInTheDocument();
    expect(within(topCard).queryByRole("button", { name: "丞相" })).not.toBeInTheDocument();
    expect(mocks.scene.setDynasty).toHaveBeenCalledTimes(1);

    fireEvent.click(menu().getByRole("button", { name: "文官" }));
    expect(within(topCard).getByRole("button", { name: "丞相" })).toBeInTheDocument();
    expect(within(topCard).queryByRole("button", { name: "太尉" })).not.toBeInTheDocument();
  });

  it("opens the office drawer inside its own grade level and stays there", () => {
    renderPage();

    fireEvent.click(
      within(screen.getByLabelText("万石官职名录")).getByRole("button", { name: "丞相" }),
    );

    const drawer = screen.getByLabelText("官职详情");
    expect(within(drawer).getByRole("heading", { name: "丞相" })).toBeInTheDocument();
    expect(within(drawer).getByText(/掌丞天子、助理万机/)).toBeInTheDocument();
    expect(within(drawer).getByText("王绾")).toBeInTheDocument();
    expect(within(drawer).getByText("李斯")).toBeInTheDocument();
    expect(within(drawer).getByText("秦 · 万石 · 文官")).toBeInTheDocument();
    // 抽屉里仍只有本级的官职，不切页、不新增立体节点
    expect(within(drawer).getByRole("button", { name: "太尉" })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "御史大夫" })).toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "廷尉" })).not.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "太尉" }));
    const switched = screen.getByLabelText("官职详情");
    expect(within(switched).getByRole("heading", { name: "太尉" })).toBeInTheDocument();
    expect(within(switched).getByText("秦 · 万石 · 武官")).toBeInTheDocument();
    expect(mocks.scene.setActiveGrade).toHaveBeenLastCalledWith(
      getOfficialsDynasty("qin")!.grades[0]!.id,
    );

    fireEvent.click(within(switched).getByRole("button", { name: "关闭官职详情" }));
    expect(screen.queryByLabelText("官职详情")).not.toBeInTheDocument();
  });

  it("shows figures that match the selected dynasty", () => {
    renderPage();
    fireEvent.click(menu().getByRole("button", { name: "清" }));

    const countyCard = screen.getByLabelText("正七品 — 正九品官职名录");
    fireEvent.click(within(countyCard).getByRole("button", { name: "知县" }));

    const drawer = screen.getByLabelText("官职详情");
    expect(within(drawer).getByText("清 · 正七品 — 正九品 · 文官")).toBeInTheDocument();
    expect(within(drawer).getByText("郑板桥")).toBeInTheDocument();
    expect(within(drawer).queryByText("李斯")).not.toBeInTheDocument();
    expect(within(drawer).queryByText("胡惟庸")).not.toBeInTheDocument();
  });

  it("follows grade picks and hovers coming from the 3D scene", () => {
    renderPage();
    const qin = getOfficialsDynasty("qin")!;
    const secondGradeId = qin.grades[1]!.id;

    act(() => {
      sceneHandlers().onGradeHover(secondGradeId);
    });
    expect(mocks.scene.setActiveGrade).toHaveBeenCalled();

    act(() => {
      sceneHandlers().onGradePick(secondGradeId);
    });
    expect(mocks.scene.focusGrade).toHaveBeenCalledWith(secondGradeId);
    expect(mocks.scene.setActiveGrade).toHaveBeenLastCalledWith(secondGradeId);
  });

  it("drives camera presets, spacing and rotation from the left menu", () => {
    renderPage();

    fireEvent.click(menu().getByRole("button", { name: "正视" }));
    expect(mocks.scene.applyPreset).toHaveBeenCalledWith("front");

    fireEvent.click(menu().getByRole("button", { name: "俯瞰" }));
    expect(mocks.scene.applyPreset).toHaveBeenLastCalledWith("overlook");

    fireEvent.click(menu().getByRole("button", { name: "紧凑" }));
    expect(mocks.scene.setSpacing).toHaveBeenCalledWith("compact");

    fireEvent.click(menu().getByRole("button", { name: "自动旋转" }));
    expect(mocks.scene.setAutoRotate).toHaveBeenLastCalledWith(true);
    expect(menu().getByRole("button", { name: "停止旋转" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(menu().getByRole("button", { name: "重置视角" }));
    expect(mocks.scene.resetView).toHaveBeenCalled();
  });

  it("falls back to a readable roster when WebGL is unavailable", () => {
    mocks.create.mockReturnValueOnce(null);
    renderPage();

    expect(screen.getByText(/未能启用 WebGL/)).toBeInTheDocument();
    expect(screen.getByLabelText("万石官职名录")).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByLabelText("万石官职名录")).getByRole("button", { name: "丞相" }),
    );
    expect(screen.getByLabelText("官职详情")).toBeInTheDocument();
  });
});
