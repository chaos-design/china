import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { FLOW_DOTS } from "./atlas-map";
import { MIGRATION_EVENTS } from "./migration-events";
import { MigrationAtlasPage } from "./migration-page";

function renderPage() {
  return render(
    <MemoryRouter>
      <MigrationAtlasPage />
    </MemoryRouter>,
  );
}

describe("<MigrationAtlasPage />（统一图谱的迁徙图层）", () => {
  it("渲染路线地图与按朝代分组的菜单", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "民族迁徙" })).toBeInTheDocument();
    expect(screen.getByText("首批八条路线 · 汉唐宋元")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /民族迁徙路线图/ })).toBeInTheDocument();
    const aside = screen.getByRole("complementary", { name: "迁徙路线目录" });
    for (const dynasty of ["汉", "唐", "宋", "元"]) {
      expect(within(aside).getAllByText(dynasty).length).toBeGreaterThan(0);
    }
    for (const event of MIGRATION_EVENTS) {
      expect(
        within(aside).getByRole("button", { name: new RegExp(event.group) }),
      ).toBeInTheDocument();
    }
  });

  it("选中路线后列出途经点、起讫与出处", () => {
    renderPage();

    const second = MIGRATION_EVENTS[1]!;
    fireEvent.click(
      within(screen.getByRole("complementary", { name: "迁徙路线目录" })).getByRole("button", {
        name: new RegExp(second.group),
      }),
    );
    expect(screen.getByText(second.description)).toBeInTheDocument();
    expect(screen.getByText(/途经 · /)).toHaveTextContent(
      second.waypoints.map((waypoint) => waypoint.name).join(" → "),
    );
    expect(screen.getByText(`资料出处 · ${second.sources[0]}`)).toBeInTheDocument();
  });

  it("全览与单选共享同一套流动动画，且视野恒定", () => {
    const { container } = renderPage();
    const map = container.querySelector('svg[role="img"]');
    const viewBox = map?.getAttribute("viewBox");
    expect(map?.querySelectorAll("animateMotion")).toHaveLength(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );

    fireEvent.click(screen.getByRole("button", { name: "全览 · 全部路线" }));
    expect(screen.getByText(/全览模式：八条迁徙路线同时播放流动动画/)).toBeInTheDocument();
    expect(map?.getAttribute("viewBox")).toBe(viewBox);
    expect(map?.querySelectorAll("animateMotion")).toHaveLength(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );
  });

  it("动画开关停驻并恢复全部 SMIL 动画", () => {
    const { container } = renderPage();
    const map = container.querySelector('svg[role="img"]');
    const toggle = screen.getByRole("button", { name: /动画 · / });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);
    expect(map?.querySelectorAll("animateMotion")).toHaveLength(0);
    expect(map?.querySelectorAll("animate")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /动画 · / }));
    expect(map?.querySelectorAll("animateMotion")).toHaveLength(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );
  });

  it("页内可切到另外两个图层，不跨路由重挂载", () => {
    const { container } = renderPage();
    const map = container.querySelector('svg[role="img"]');

    fireEvent.click(screen.getByRole("button", { name: "全部图谱" }));
    expect(screen.getByRole("heading", { level: 1, name: "疆域与民族图谱" })).toBeInTheDocument();
    expect(container.querySelector('svg[role="img"]')).toBe(map);

    fireEvent.click(screen.getByRole("button", { name: "边疆治理" }));
    expect(screen.getByRole("heading", { level: 1, name: "边疆治理" })).toBeInTheDocument();
    expect(container.querySelector('svg[role="img"]')).toBe(map);
  });
});
