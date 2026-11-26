import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./page-resources", () => ({
  HOME_ENTRY_ROUTES: [
    {
      description: "地域条目",
      dimensions: ["region"],
      icon: "swords",
      path: "/liberation-war",
      screenshot: "liberation-war.jpg",
      status: "available",
      title: "解放战争入口甲",
    },
    {
      description: "编年条目",
      dimensions: ["chronology"],
      icon: "landmark",
      path: "/china/timeline",
      screenshot: "timeline.jpg",
      status: "available",
      title: "时间长河入口乙",
    },
    {
      description: "文化条目",
      dimensions: ["culture"],
      icon: "palette",
      path: "/intangible-culture-heritage",
      screenshot: "heritage.jpg",
      status: "available",
      title: "非遗入口丙",
    },
    {
      description: "地理条目",
      dimensions: ["atlas"],
      icon: "map",
      path: "/china/atlas",
      screenshot: "atlas.jpg",
      status: "available",
      title: "历史地理入口丁",
    },
  ],
}));

import { HomePage } from "./home";

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("<HomePage /> 按菜单分组筛选的入口轮播", () => {
  it("默认「全览」保留全部入口与原有顺序", () => {
    renderHome();

    expect(screen.getByRole("tab", { name: "全览" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("link", { name: /入口/ })).toHaveLength(4);
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
  });

  it("四个菜单分组各自展示对应功能入口", () => {
    renderHome();

    const cases = [
      ["编年与制度", /时间长河入口乙/],
      ["历史地理", /历史地理入口丁/],
      ["文化与交通", /非遗入口丙/],
      ["地域与近代", /解放战争入口甲/],
    ] as const;

    for (const [tab, name] of cases) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expect(screen.getAllByRole("link", { name: /入口/ })).toHaveLength(1);
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
      expect(screen.getByText("01 / 01")).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("tab", { name: "全览" }));
    expect(screen.getAllByRole("link", { name: /入口/ })).toHaveLength(4);
  });

  it("切换分组后按当前分组的首张截图重置 LCP 优先级", () => {
    renderHome();

    fireEvent.click(screen.getByRole("tab", { name: "文化与交通" }));
    const screenshot = screen.getByRole("img", { name: /非遗入口丙页面截图/ });
    expect(screenshot).toHaveAttribute("fetchpriority", "high");
    expect(screenshot).not.toHaveAttribute("loading");

    fireEvent.click(screen.getByRole("tab", { name: "全览" }));
    const first = screen.getByRole("img", { name: /解放战争入口甲页面截图/ });
    expect(first).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("img", { name: /时间长河入口乙页面截图/ })).toHaveAttribute(
      "loading",
      "lazy",
    );
  });
});
