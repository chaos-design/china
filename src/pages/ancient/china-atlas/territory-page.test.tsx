import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TerritoryAtlasPage } from "./territory-page";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";
import { ATLAS_TOPICS } from "./topics";

function renderPage() {
  return render(
    <MemoryRouter>
      <TerritoryAtlasPage />
    </MemoryRouter>,
  );
}

describe("<TerritoryAtlasPage />", () => {
  it("renders the timeline, snapshot map and dynasty-grouped menu", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "疆域变迁" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /疆域变迁地图/ })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "疆域快照时间轴" })).toBeInTheDocument();

    const aside = screen.getByRole("complementary", { name: "疆域快照目录" });
    const nav = within(aside).getByRole("navigation", { name: "图谱导航" });
    for (const topic of ATLAS_TOPICS) {
      expect(within(nav).getByRole("link", { name: new RegExp(topic.label) })).toHaveAttribute(
        "href",
        topic.path,
      );
    }
    for (const snapshot of TERRITORY_SNAPSHOTS) {
      // 菜单条目以快照名可寻；时间轴节点以年份为可访问名
      expect(screen.getAllByRole("button", { name: new RegExp(snapshot.label) }).length).toBe(1);
    }
  });

  it("selects the first snapshot by default and shows its detail", () => {
    renderPage();

    const first = TERRITORY_SNAPSHOTS[0];
    expect(first).toBeDefined();
    expect(screen.getByText(first.description)).toBeInTheDocument();
    expect(screen.getAllByText(/都城 · 长安/).length).toBeGreaterThan(0);
  });

  it("switches the highlighted snapshot from the timeline", () => {
    renderPage();

    const last = TERRITORY_SNAPSHOTS[TERRITORY_SNAPSHOTS.length - 1];
    if (!last) throw new Error("expected snapshots to exist");
    const year = last.year < 0 ? `前${-last.year}` : `${last.year}`;
    fireEvent.click(screen.getByRole("button", { name: year }));

    expect(screen.getByText(last.description)).toBeInTheDocument();
    expect(
      screen.queryByText(TERRITORY_SNAPSHOTS[0]?.description ?? "no-such-text"),
    ).not.toBeInTheDocument();
  });

  it("shows the overview hint when 全部快照 is selected", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /全览 · 全部快照/ }));

    expect(screen.queryByText(TERRITORY_SNAPSHOTS[0]?.description ?? "")).not.toBeInTheDocument();
    expect(screen.getByText(/全览模式下六幅快照同时标注都城与节点/)).toBeInTheDocument();
  });
});
