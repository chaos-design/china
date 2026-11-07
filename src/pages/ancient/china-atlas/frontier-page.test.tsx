import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FrontierAtlasPage } from "./frontier-page";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { ATLAS_TOPICS } from "./topics";

function renderPage() {
  return render(
    <MemoryRouter>
      <FrontierAtlasPage />
    </MemoryRouter>,
  );
}

describe("<FrontierAtlasPage />", () => {
  it("renders the seat map beside the dynasty-grouped menu", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "边疆治理" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /边疆治理地图/ })).toBeInTheDocument();
    const aside = screen.getByRole("complementary", { name: "边疆制度目录" });
    expect(aside).toBeInTheDocument();

    // 图谱导航在三页之间保持在场：三条主题都在侧栏顶部，当前页以底色高亮
    //（MemoryRouter 的路由状态不等于页面真实路由，故断言样式而非 aria-current）
    const nav = within(aside).getByRole("navigation", { name: "图谱导航" });
    for (const topic of ATLAS_TOPICS) {
      const link = within(nav).getByRole("link", { name: new RegExp(topic.label) });
      expect(link).toHaveAttribute("href", topic.path);
    }
    const currentLink = within(nav)
      .getAllByRole("link")
      .find((link) => link.className.includes("bg-vermillion/10"));
    expect(currentLink?.textContent).toContain("边疆治理");

    // 四个朝代分组与八项制度全部在菜单里
    for (const dynasty of ["汉", "唐", "宋", "元"]) {
      expect(within(aside).getAllByText(dynasty).length).toBeGreaterThan(0);
    }
    for (const policy of FRONTIER_POLICIES) {
      expect(screen.getAllByRole("button", { name: new RegExp(policy.institution) }).length).toBe(
        1,
      );
    }
  });

  it("selects the first institution by default and shows its detail", () => {
    renderPage();

    const first = FRONTIER_POLICIES[0];
    expect(first).toBeDefined();
    const button = screen.getByRole("button", { name: new RegExp(first.institution) });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(first.description)).toBeInTheDocument();
    expect(screen.getByText(`治所 · ${first.seat.name}`)).toBeInTheDocument();
  });

  it("switches the highlighted institution when another is chosen", () => {
    renderPage();

    const second = FRONTIER_POLICIES[1];
    const button = screen.getByRole("button", { name: new RegExp(second.institution) });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(second.description)).toBeInTheDocument();
    expect(
      screen.queryByText(FRONTIER_POLICIES[0]?.description ?? "no-such-text"),
    ).not.toBeInTheDocument();
  });

  it("shows the overview hint when 全部治所 is selected", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /全览 · 全部治所/ }));

    expect(screen.queryByText(FRONTIER_POLICIES[0]?.description ?? "")).not.toBeInTheDocument();
    expect(screen.getByText(/淡墨方印为全部八项制度的治所/)).toBeInTheDocument();
  });
});
