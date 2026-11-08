import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 核心入口治理的边界情形：全部条目已开放时，筹备中区块整体不出现。
vi.mock("./page-resources", () => ({
  ABOUT_CONTENT_ITEMS: [],
  HOME_ENTRY_ROUTES: [
    {
      description: "以编年为经的时间长河。",
      icon: "landmark",
      path: "/china/timeline",
      status: "available",
      title: "朝代时间长河",
    },
  ],
  READING_GUIDES: [],
}));

import { HomePage } from "./home";

describe("<HomePage /> 核心入口分区", () => {
  beforeEach(() => {
    window.sessionStorage.setItem("home-entrance-scroll-shown", "true");
  });

  it("没有筹备中条目时，不渲染「后续专题」区块", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /朝代时间长河/ })).toHaveAttribute(
      "href",
      "/china/timeline",
    );
    expect(screen.queryByText("后续专题 · 筹备中")).not.toBeInTheDocument();
  });
});
