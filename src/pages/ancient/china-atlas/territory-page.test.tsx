import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { TerritoryAtlasPage } from "./territory-page";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";

function renderPage() {
  return render(
    <MemoryRouter>
      <TerritoryAtlasPage />
    </MemoryRouter>,
  );
}

describe("<TerritoryAtlasPage />（统一图谱的疆域图层）", () => {
  it("渲染时间轴、快照地图与按朝代分组的菜单", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "疆域变迁" })).toBeInTheDocument();
    expect(screen.getByText("首批六幅快照 · 汉唐宋元")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /疆域变迁地图/ })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "疆域快照时间轴" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "疆域快照目录" })).toBeInTheDocument();

    const aside = screen.getByRole("complementary", { name: "疆域快照目录" });
    for (const dynasty of ["汉", "唐", "宋", "元"]) {
      expect(within(aside).getAllByText(dynasty).length).toBeGreaterThan(0);
    }
    for (const snapshot of TERRITORY_SNAPSHOTS) {
      expect(
        within(aside).getByRole("button", { name: new RegExp(snapshot.label) }),
      ).toBeInTheDocument();
    }
  });

  it("选中快照后显示都城、节点与出处", () => {
    renderPage();

    const first = TERRITORY_SNAPSHOTS[0]!;
    fireEvent.click(
      within(screen.getByRole("complementary", { name: "疆域快照目录" })).getByRole("button", {
        name: new RegExp(first.label),
      }),
    );
    expect(screen.getByText(first.description)).toBeInTheDocument();
    expect(screen.getByText(`都城 · ${first.capital.name}`)).toBeInTheDocument();
    expect(
      screen.getByText(`节点 · ${first.anchors.map((place) => place.name).join("、")}`),
    ).toBeInTheDocument();
    expect(screen.getByText(`资料出处 · ${first.sources[0]}`)).toBeInTheDocument();
  });

  it("全览提示与固定视野：切换选中项不重算 viewBox", () => {
    const { container } = renderPage();
    const map = container.querySelector('svg[role="img"]');
    expect(map).not.toBeNull();
    const viewBox = map?.getAttribute("viewBox");

    fireEvent.click(screen.getByRole("button", { name: "全览 · 全部快照" }));
    expect(screen.getByText(/全览模式：六幅快照的都城与控制节点同时呈现/)).toBeInTheDocument();
    expect(map?.getAttribute("viewBox")).toBe(viewBox);

    fireEvent.click(
      within(screen.getByRole("complementary", { name: "疆域快照目录" })).getByRole("button", {
        name: new RegExp(TERRITORY_SNAPSHOTS[1]!.label),
      }),
    );
    expect(map?.getAttribute("viewBox")).toBe(viewBox);
  });
});
