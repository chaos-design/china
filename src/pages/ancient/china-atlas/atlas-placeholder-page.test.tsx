import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FrontierAtlasPage } from "./frontier-page";
import { MigrationAtlasPage } from "./migration-page";
import { TerritoryAtlasPage } from "./territory-page";
import { ATLAS_TOPICS } from "./topics";

function renderPage(page: ReactElement) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

describe("atlas placeholder pages", () => {
  it.each([
    [TerritoryAtlasPage, "疆域变迁"],
    [MigrationAtlasPage, "民族迁徙"],
    [FrontierAtlasPage, "边疆治理"],
  ] as const)("%s renders the placeholder shell for %s", (Page, label) => {
    renderPage(<Page />);

    expect(screen.getByRole("heading", { level: 1, name: label })).toBeInTheDocument();
    expect(screen.getByText(/建设中 · 骨架预留/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "规划中的图谱形态" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "按朝代展开的规划" })).toBeInTheDocument();

    // 四个朝代骨架全部展示，且每个都有内容注记
    const dynastyCards = screen
      .getAllByRole("listitem")
      .filter((item) => within(item).queryByText(/^(汉|唐|宋|元)$/u) !== null);
    expect(dynastyCards).toHaveLength(4);
    for (const card of dynastyCards) {
      expect(within(card).getByText(/\d/)).toBeInTheDocument();
    }
  });

  it("cross links each topic to the other two", () => {
    renderPage(<TerritoryAtlasPage />);

    const links = ATLAS_TOPICS.filter((topic) => topic.id !== "territory").map((topic) => {
      const link = screen.getByRole("link", { name: new RegExp(topic.label) });
      expect(link).toHaveAttribute("href", topic.path);
      return link;
    });
    expect(links).toHaveLength(2);
  });
});
