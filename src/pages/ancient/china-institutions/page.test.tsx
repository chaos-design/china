import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChinaInstitutionsPage } from "./page";

describe("<ChinaInstitutionsPage />", () => {
  it("renders the institutions index heading and description", () => {
    render(<ChinaInstitutionsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "典章制度索引" })).toBeInTheDocument();
    expect(screen.getByText(/预留官制、赋役、律令、科举与礼制五类条目/)).toBeInTheDocument();
  });

  it("reserves one preview entry for each of the five institution categories", () => {
    render(<ChinaInstitutionsPage />);

    for (const name of ["官制", "赋役", "律令", "科举", "礼制"]) {
      const entry = screen.getByText(name).closest("article");
      expect(entry).not.toBeNull();
      // 条目是预留位：不可进入，也不渲染成链接
      expect(entry).toHaveAttribute("aria-disabled", "true");
      expect(entry).toHaveClass("index-card", "index-card-preview");
      expect(entry?.querySelector("a")).toBeNull();
    }

    expect(screen.getAllByText("筹备中")).toHaveLength(5);
  });

  it("points readers at the chronology before the topic entries", () => {
    render(<ChinaInstitutionsPage />);

    expect(screen.getByText("阅读指引")).toBeInTheDocument();
    expect(screen.getByText(/建议先在时间长河中定位朝代坐标/)).toBeInTheDocument();
  });
});
