import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./page-resources", () => ({
  HOME_ENTRY_ROUTES: [
    {
      description: "军事条目",
      dimensions: ["军事"],
      icon: "swords",
      path: "/liberation-war",
      screenshot: "liberation-war.jpg",
      status: "available",
      title: "军事入口甲",
    },
    {
      description: "历史条目",
      dimensions: ["历史"],
      icon: "landmark",
      path: "/china/timeline",
      screenshot: "timeline.jpg",
      status: "available",
      title: "历史入口乙",
    },
    {
      description: "非遗条目",
      dimensions: ["非物质文化遗产"],
      icon: "palette",
      path: "/intangible-culture-heritage",
      screenshot: "heritage.jpg",
      status: "available",
      title: "非遗入口丙",
    },
    {
      description: "跨维度条目",
      dimensions: ["军事", "历史"],
      icon: "map",
      path: "/china/atlas",
      screenshot: "atlas.jpg",
      status: "available",
      title: "军事历史入口丁",
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

/** 首屏 CTA 与卡片都会带条目名，链接断言只数轮播舞台里的卡片。 */
function carousel() {
  return within(screen.getByRole("region", { name: "核心入口与后续专题" }));
}

describe("<HomePage /> 维度化入口轮播", () => {
  it("默认「全部」保留全部入口与原有顺序", () => {
    renderHome();

    expect(screen.getByRole("tab", { name: "全部" })).toHaveAttribute("aria-selected", "true");
    expect(carousel().getAllByRole("link", { name: /入口/ })).toHaveLength(4);
    expect(screen.getByText("01 / 04")).toBeInTheDocument();
    // 主 CTA 跟随当前维度的第一个可进入条目
    expect(screen.getByRole("link", { name: /进入军事入口甲/ })).toHaveAttribute(
      "href",
      "/liberation-war",
    );
  });

  it("按军事 / 历史 / 非物质文化遗产分别展示对应入口", () => {
    renderHome();

    fireEvent.click(screen.getByRole("tab", { name: "军事" }));
    expect(carousel().getAllByRole("link", { name: /入口/ })).toHaveLength(2);
    expect(carousel().getByRole("link", { name: /军事入口甲/ })).toBeInTheDocument();
    expect(carousel().getByRole("link", { name: /军事历史入口丁/ })).toBeInTheDocument();
    expect(carousel().queryByRole("link", { name: /非遗入口丙/ })).not.toBeInTheDocument();
    expect(screen.getByText("01 / 02")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "非物质文化遗产" }));
    expect(carousel().getAllByRole("link", { name: /入口/ })).toHaveLength(1);
    expect(carousel().getByRole("link", { name: /非遗入口丙/ })).toBeInTheDocument();
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /进入非遗入口丙/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "历史" }));
    expect(carousel().getAllByRole("link", { name: /入口/ })).toHaveLength(2);
    expect(carousel().getByRole("link", { name: /历史入口乙/ })).toBeInTheDocument();
  });

  it("切换维度后按当前分组的首张截图重置 LCP 优先级", () => {
    renderHome();

    fireEvent.click(screen.getByRole("tab", { name: "非物质文化遗产" }));
    const screenshot = screen.getByRole("img", { name: /非遗入口丙页面截图/ });
    expect(screenshot).toHaveAttribute("fetchpriority", "high");
    expect(screenshot).not.toHaveAttribute("loading");

    fireEvent.click(screen.getByRole("tab", { name: "全部" }));
    const first = screen.getByRole("img", { name: /军事入口甲页面截图/ });
    expect(first).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("img", { name: /历史入口乙页面截图/ })).toHaveAttribute(
      "loading",
      "lazy",
    );
  });
});
