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

describe("<SiteMenu /> 按现有菜单分组筛选", () => {
  it("默认「全览」展示所有列与既有菜单项", () => {
    const panel = openMenu();

    expect(within(panel).getByRole("tab", { name: "全览" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(panel.querySelectorAll(".mega-col")).toHaveLength(4);
    expect(within(panel).getByRole("link", { name: /朝代时间长河/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /中华非遗瑰宝/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /四渡赤水交互沙盘/ })).toBeInTheDocument();
  });

  it("选中分组后只留该列，列内条目与全览时完全一致", () => {
    const panel = openMenu();

    fireEvent.click(within(panel).getByRole("tab", { name: "地域与近代" }));

    expect(panel.querySelectorAll(".mega-col")).toHaveLength(1);
    expect(within(panel).getByRole("link", { name: /台湾专题/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /解放战争交互图/ })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: /四渡赤水交互沙盘/ })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: /朝代政策全览/ })).not.toBeInTheDocument();
    expect(panel.querySelector(".map-zone-active")).toHaveAttribute("data-zone", "islands");
  });

  it("文化与交通维度同步收敛地图高亮，切回全览恢复四列", () => {
    const panel = openMenu();

    fireEvent.click(within(panel).getByRole("tab", { name: "文化与交通" }));

    expect(panel.querySelectorAll(".mega-col")).toHaveLength(1);
    expect(within(panel).getByRole("link", { name: /中华非遗瑰宝/ })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: /台湾专题/ })).not.toBeInTheDocument();
    expect(panel.querySelector(".map-zone-active")).toHaveAttribute("data-zone", "culture");

    fireEvent.click(within(panel).getByRole("tab", { name: "全览" }));
    expect(panel.querySelectorAll(".mega-col")).toHaveLength(4);
  });
});
