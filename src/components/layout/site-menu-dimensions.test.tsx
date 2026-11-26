import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SiteMenu } from "./site-menu";

function openMenu() {
  render(
    <MemoryRouter>
      <SiteMenu activeRouteGroupId={undefined} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /全览地图/ }));
  return screen.getByLabelText("全览目录");
}

describe("<SiteMenu /> 维度化筛选", () => {
  it("默认「全部」展示所有列与既有菜单项", () => {
    const panel = openMenu();

    expect(within(panel).getByRole("tab", { name: "全部" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(panel.querySelectorAll(".mega-col")).toHaveLength(4);
    expect(within(panel).getByRole("link", { name: /朝代时间长河/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /中华非遗瑰宝/ })).toBeInTheDocument();
  });

  it("军事维度只留下归属军事的列与条目", () => {
    const panel = openMenu();

    fireEvent.click(within(panel).getByRole("tab", { name: "军事" }));

    expect(panel.querySelectorAll(".mega-col")).toHaveLength(3);
    expect(within(panel).getByRole("link", { name: /解放战争交互图/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /朝代政策全览/ })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: /中华非遗瑰宝/ })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: /科举之路/ })).not.toBeInTheDocument();
  });

  it("非物质文化遗产维度只留下非遗入口，地图高亮同步收敛", () => {
    const panel = openMenu();

    fireEvent.click(within(panel).getByRole("tab", { name: "非物质文化遗产" }));

    expect(panel.querySelectorAll(".mega-col")).toHaveLength(1);
    expect(within(panel).getByRole("link", { name: /中华非遗瑰宝/ })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: /台湾专题/ })).not.toBeInTheDocument();
    expect(panel.querySelector(".map-zone-active")).toHaveAttribute("data-zone", "culture");

    fireEvent.click(within(panel).getByRole("tab", { name: "全部" }));
    expect(panel.querySelectorAll(".mega-col")).toHaveLength(4);
  });
});
