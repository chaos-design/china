import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MIGRATION_EVENTS } from "./migration-events";
import { FLOW_DOTS } from "./migration-map";
import { MigrationAtlasPage } from "./migration-page";

function renderPage() {
  return render(
    <MemoryRouter>
      <MigrationAtlasPage />
    </MemoryRouter>,
  );
}

describe("<MigrationAtlasPage />", () => {
  it("renders the map beside the dynasty-grouped menu", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "民族迁徙" })).toBeInTheDocument();
    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    expect(map).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "迁徙路线目录" })).toBeInTheDocument();

    // 四个朝代分组全部出现，八条路线都在菜单里
    for (const dynasty of ["汉", "唐", "宋", "元"]) {
      expect(within(screen.getByRole("complementary")).getByText(dynasty)).toBeInTheDocument();
    }
    for (const event of MIGRATION_EVENTS) {
      expect(screen.getAllByRole("button", { name: new RegExp(event.group) }).length).toBe(1);
    }
  });

  it("selects the first route by default and shows its detail", () => {
    renderPage();

    const first = MIGRATION_EVENTS[0];
    expect(first).toBeDefined();
    const firstButton = screen.getByRole("button", { name: new RegExp(first.group) });
    expect(firstButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(first.description)).toBeInTheDocument();
  });

  it("switches the highlighted route when another event is chosen", () => {
    renderPage();

    const second = MIGRATION_EVENTS[1];
    const button = screen.getByRole("button", { name: new RegExp(second.group) });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(second.description)).toBeInTheDocument();
    // 信息补全：详情卡列出途经点序列
    expect(screen.getByText(/途经 · /)).toHaveTextContent(
      second.waypoints.map((waypoint) => waypoint.name).join(" → "),
    );
    expect(
      screen.queryByText(MIGRATION_EVENTS[0]?.description ?? "\\u0000no-such-text"),
    ).not.toBeInTheDocument();
  });

  it("labels the map with origin/destination roles and a complete legend", () => {
    renderPage();

    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    // 图上直接标注起点与终点角色
    expect(within(map).getByText("（起点）")).toBeInTheDocument();
    expect(within(map).getByText("（终点）")).toBeInTheDocument();
    // 图例覆盖四类符号：起点、终点、流向动画、未选中的其他路线
    expect(screen.getByText("其他路线（淡墨）")).toBeInTheDocument();
  });

  it("animates the selected route with a particle stream and origin ripples", () => {
    renderPage();

    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    // 选中态：流动光点沿路径运动（animateMotion），起点有出发涟漪
    expect(map.querySelectorAll("animateMotion").length).toBe(FLOW_DOTS.length);
    expect(map.querySelectorAll('animate[attributeName="r"]').length).toBeGreaterThan(0);
  });

  it("plays the same flow animation for every route in the overview", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /全览 · 全部路线/ }));

    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    // 全览：每条路线都以与单选相同的动画呈现——八条路线 × 每条五枚流动光点
    expect(map.querySelectorAll("animateMotion").length).toBe(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );
    expect(map.querySelectorAll('animate[attributeName="stroke-dashoffset"]').length).toBe(
      MIGRATION_EVENTS.length * 2,
    );
  });

  it("stops and resumes the flow animation with the toggle", () => {
    renderPage();

    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    const toggle = screen.getByRole("button", { name: /流动动画/ });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(map.querySelectorAll("animateMotion").length).toBe(FLOW_DOTS.length);

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /流动动画/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    // 光点、刻痕、涟漪与画线动画一并停驻，路线上不残留任何 SMIL 动画
    expect(map.querySelectorAll("animateMotion")).toHaveLength(0);
    expect(map.querySelectorAll("animate")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /流动动画/ }));
    expect(map.querySelectorAll("animateMotion").length).toBe(FLOW_DOTS.length);
  });

  it("shows the overview hint when 全部路线 is selected", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /全览 · 全部路线/ }));

    expect(screen.queryByText(MIGRATION_EVENTS[0]?.description ?? "")).not.toBeInTheDocument();
    expect(screen.getByText(/全览模式下八条路线同时播放流动动画/)).toBeInTheDocument();
    // 路线仍在图上，全部以与单选相同的动画呈现
    expect(screen.getByRole("img", { name: /民族迁徙路线图/ })).toBeInTheDocument();
  });

  it("expands the viewBox when the selected route leaves the basemap frame", () => {
    renderPage();

    const map = screen.getByRole("img", { name: /民族迁徙路线图/ });
    expect(map.getAttribute("viewBox")).toMatch(/^0 /);

    // 粟特商旅起点撒马尔罕在底图视野（x 从 0 起）之外，选中后视野向西扩展
    const sogdian = MIGRATION_EVENTS.find((event) => event.id === "tang-sogdian-east");
    if (!sogdian) throw new Error("expected the Sogdian route to exist");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(sogdian.group) }));

    expect(map.getAttribute("viewBox")).toMatch(/^-\d/);
  });

  it("cross links to the other two atlas topics", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /疆域变迁/ })).toHaveAttribute(
      "href",
      "/china/atlas/territory",
    );
    expect(screen.getByRole("link", { name: /边疆治理/ })).toHaveAttribute(
      "href",
      "/china/atlas/frontier",
    );
  });
});
