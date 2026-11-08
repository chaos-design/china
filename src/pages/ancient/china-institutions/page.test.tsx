import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ChinaInstitutionsPage } from "./page";
import { INSTITUTION_TOPICS } from "./topics";

describe("<ChinaInstitutionsPage />", () => {
  it("renders the overview shell with heading and description", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "典章制度索引" })).toBeInTheDocument();
    expect(screen.getByText(/官制、赋役、律令、科举与礼制五类条目已全部开放/)).toBeInTheDocument();
    // 总览态下目录以 aria-current 标记总览条目
    const overviewLink = screen.getByRole("link", { name: /^总览/ });
    expect(overviewLink).toHaveAttribute("aria-current", "page");
    expect(overviewLink).toHaveAttribute("href", "/china/institutions");
  });

  it("keeps the full five-topic lineup in the sidebar menu", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    const menu = within(screen.getByRole("navigation", { name: "典章制度目录" }));
    for (const topic of INSTITUTION_TOPICS) {
      const link = menu.getByRole("link", { name: new RegExp(`^${topic.name}`) });
      expect(link).toHaveAttribute("href", `/china/institutions/${topic.slug}`);
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("renders one card per topic in the grid, linking implemented topics", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    const grid = screen.getByTestId("topic-card-grid");
    for (const topic of INSTITUTION_TOPICS) {
      const link = within(grid).getByRole("link", { name: new RegExp(`^${topic.name}`) });
      expect(link).toHaveAttribute("href", `/china/institutions/${topic.slug}`);
    }

    const reservedCount = 5 - INSTITUTION_TOPICS.length;
    expect(within(grid).queryAllByText("筹备中")).toHaveLength(reservedCount);
    for (const article of within(grid).queryAllByRole("article")) {
      expect(article).toHaveAttribute("aria-disabled", "true");
      expect(article).toHaveClass("index-card-preview");
    }
  });

  it("points readers at the chronology before the topic entries", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("阅读指引")).toBeInTheDocument();
    expect(screen.getByText(/建议先在时间长河中定位朝代坐标/)).toBeInTheDocument();
  });
});
