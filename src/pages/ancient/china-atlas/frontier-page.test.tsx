import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { FrontierAtlasPage } from "./frontier-page";
import { setViewTweenMs } from "./map-view";

// 视野补间关掉后，点击立刻到达目标 viewBox，同步断言才是确定性的。
setViewTweenMs(0);

import { FRONTIER_POLICIES } from "./frontier-policies";

function renderPage() {
  return render(
    <MemoryRouter>
      <FrontierAtlasPage />
    </MemoryRouter>,
  );
}

describe("<FrontierAtlasPage />（统一图谱的边疆图层）", () => {
  it("渲染治所地图与按朝代分组的菜单", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "边疆治理" })).toBeInTheDocument();
    expect(screen.getByText("首批八项制度 · 汉唐宋元")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /边疆治理地图/ })).toBeInTheDocument();
    const aside = screen.getByRole("complementary", { name: "边疆制度目录" });
    for (const dynasty of ["汉", "唐", "宋", "元"]) {
      expect(within(aside).getAllByText(dynasty).length).toBeGreaterThan(0);
    }
    for (const policy of FRONTIER_POLICIES) {
      expect(
        within(aside).getByRole("button", { name: new RegExp(policy.institution) }),
      ).toBeInTheDocument();
    }
  });

  it("选中制度后显示治所、辖区与出处", () => {
    renderPage();

    const first = FRONTIER_POLICIES[0]!;
    fireEvent.click(
      within(screen.getByRole("complementary", { name: "边疆制度目录" })).getByRole("button", {
        name: new RegExp(first.institution),
      }),
    );
    expect(screen.getByText(first.description)).toBeInTheDocument();
    expect(screen.getByText(`治所 · ${first.seat.name}`)).toBeInTheDocument();
    expect(screen.getByText(`辖区 · ${first.regions.join("、")}`)).toBeInTheDocument();
    expect(screen.getByText(`资料出处 · ${first.sources[0]}`)).toBeInTheDocument();
  });

  it("切换制度只换视野，不重挂载地图", () => {
    const { container } = renderPage();
    const map = container.querySelector('svg[role="img"]');
    const viewBox = map?.getAttribute("viewBox");

    fireEvent.click(screen.getByRole("button", { name: "全览 · 全部治所" }));
    expect(screen.getByText(/全览模式：八项制度的治所与防御范围同步呈现/)).toBeInTheDocument();
    expect(map?.getAttribute("viewBox")).toBe(viewBox);

    fireEvent.click(
      within(screen.getByRole("complementary", { name: "边疆制度目录" })).getByRole("button", {
        name: new RegExp(FRONTIER_POLICIES[1]!.institution),
      }),
    );
    expect(screen.getByText(FRONTIER_POLICIES[1]!.description)).toBeInTheDocument();
    expect(container.querySelector('svg[role="img"]')).toBe(map);
    expect(map?.getAttribute("viewBox")).not.toBe(viewBox);
    fireEvent.click(screen.getByRole("button", { name: "全览 · 全部治所" }));
    expect(map?.getAttribute("viewBox")).toBe(viewBox);
  });
});
