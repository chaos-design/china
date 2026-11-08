import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ChinaInstitutionsPage } from "./page";
import { INSTITUTION_TOPICS } from "./topics";

describe("<ChinaInstitutionsPage />", () => {
  it("renders the institutions index heading and description", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "典章制度索引" })).toBeInTheDocument();
    expect(screen.getByText(/官制、赋役、律令、科举与礼制按专题展开/)).toBeInTheDocument();
  });

  it("shows the full five-topic lineup exactly once", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    for (const name of ["官制", "赋役", "律令", "科举", "礼制"]) {
      expect(screen.getAllByText(name).length).toBe(1);
    }
  });

  it("links implemented topics and keeps the rest as reserved articles", () => {
    render(
      <MemoryRouter>
        <ChinaInstitutionsPage />
      </MemoryRouter>,
    );

    for (const topic of INSTITUTION_TOPICS) {
      const link = screen.getByRole("link", { name: new RegExp(`^${topic.name}`) });
      expect(link).toHaveAttribute("href", `/china/institutions/${topic.slug}`);
    }

    const reservedCount = 5 - INSTITUTION_TOPICS.length;
    expect(screen.queryAllByText("筹备中")).toHaveLength(reservedCount);
    for (const article of screen.queryAllByRole("article")) {
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
