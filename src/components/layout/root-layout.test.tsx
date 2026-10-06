import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { RootLayout } from "./root-layout";

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RootLayout />
    </MemoryRouter>,
  );
}

async function openMenu(path = "/") {
  renderLayout(path);
  const nav = await screen.findByRole("navigation");
  fireEvent.click(within(nav).getByRole("button", { name: /全览地图/ }));
  return await screen.findByRole("dialog", { name: "全览目录" });
}

describe("<RootLayout /> menu trigger", () => {
  it("exposes a single trigger instead of one button per category", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    // 旧版是三个分类各一个下拉按钮。现在只有一个入口，展开后在里面选分类。
    const triggers = within(nav).getAllByRole("button", { expanded: false });
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toHaveTextContent("全览地图");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps the menu closed until the trigger is clicked", async () => {
    renderLayout("/");
    await screen.findByRole("navigation");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("reports its collapsed state through aria-expanded", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");
    const trigger = within(nav).getByRole("button", { name: /全览地图/ });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("<SiteMenu /> categories and content", () => {
  it("shows all three categories as tabs, in editorial order", async () => {
    const dialog = await openMenu();
    const tabs = within(dialog).getAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent)).toEqual([
      expect.stringContaining("编年与制度"),
      expect.stringContaining("文化与交通"),
      expect.stringContaining("地域与近代"),
    ]);
  });

  it("puts the menu on the left and the content on the right", async () => {
    const dialog = await openMenu();
    const tablist = within(dialog).getByRole("tablist");
    const panel = within(dialog).getByRole("tabpanel");

    // 左右分屏是 Tailwind 的 grid 列，不是 DOM 顺序。这里断言的实质是
    // "列表容器与内容容器是两个独立节点"，顺序由 CSS grid 决定。
    expect(tablist).toHaveAttribute("aria-label", "内容分类");
    expect(tablist.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tablist.className).toContain("site-menu-rail");
    expect(panel.className).toContain("site-menu-panel");
  });

  it("opens on the category that owns the current route", async () => {
    const dialog = await openMenu("/silk-road");

    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("文化与交通");
    expect(within(dialog).getByRole("tabpanel")).toHaveTextContent("中华非遗瑰宝");
  });

  it("falls back to the first category on a route with no category", async () => {
    const dialog = await openMenu("/");

    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("编年与制度");
  });

  it("swaps the whole right-hand panel when another category is picked", async () => {
    const dialog = await openMenu("/");
    expect(within(dialog).getByRole("tabpanel")).not.toHaveTextContent("台湾专题");

    fireEvent.click(within(dialog).getByRole("tab", { name: /地域与近代/ }));

    const panel = within(dialog).getByRole("tabpanel");
    expect(panel).toHaveTextContent("台湾专题");
    expect(panel).not.toHaveTextContent("朝代政策全览");
    // 分组导语是"完整内容"的一部分，不能只有一串链接
    expect(panel).toHaveTextContent("中央山脉把岛切成两半");
  });

  it("gives every leaf an absolute in-site path, a description and highlights", async () => {
    const dialog = await openMenu("/");

    const expected: [string, RegExp][] = [
      ["/china/timeline", /朝代时间长河/],
      ["/china/policies", /朝代政策全览/],
      ["/intangible-culture-heritage", /中华非遗瑰宝/],
      ["/silk-road", /丝绸之路与海疆/],
      ["/taiwan", /台湾专题/],
    ];

    let visited = 0;

    for (const tabName of [/编年与制度/, /文化与交通/, /地域与近代/]) {
      fireEvent.click(within(dialog).getByRole("tab", { name: tabName }));
      const panel = within(dialog).getByRole("tabpanel");

      for (const [href, name] of expected) {
        // 链接本身的可访问名是"进入"，标题在卡片标题里，所以先按标题找卡片再找链接
        const heading = within(panel).queryByRole("heading", { name });
        if (!heading) continue;

        visited += 1;
        const card = heading.closest("article");
        expect(card).not.toBeNull();

        const link = within(card as HTMLElement).getByRole("link", { name: /进入/ });
        expect(link).toHaveAttribute("href", href);
        // 卡片不能只有一串链接：描述 + 若干短标签才叫"完整内容"
        expect((card?.textContent ?? "").length).toBeGreaterThan(40);
        expect(within(card as HTMLElement).getAllByRole("listitem").length).toBeGreaterThan(1);
      }
    }

    // 五个入口一个都不能漏
    expect(visited).toBe(expected.length);
  });

  it("wires each tab to its panel through aria-controls and aria-labelledby", async () => {
    const dialog = await openMenu();
    const active = within(dialog).getByRole("tab", { selected: true });
    const panel = within(dialog).getByRole("tabpanel");

    expect(panel).toHaveAttribute("id", active.getAttribute("aria-controls"));
    expect(panel).toHaveAttribute("aria-labelledby", active.id);
  });

  it("keeps a single tab in the tab order so arrow keys own navigation", async () => {
    const dialog = await openMenu();
    const tabs = within(dialog).getAllByRole("tab");

    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toHaveLength(1);
    for (const inactive of tabs.filter((tab) => tab.getAttribute("aria-selected") === "false")) {
      expect(inactive).toHaveAttribute("tabindex", "-1");
    }
  });
});

describe("<SiteMenu /> keyboard and dismissal", () => {
  it("moves between categories with the arrow keys", async () => {
    const dialog = await openMenu();
    const tablist = within(dialog).getByRole("tablist");

    fireEvent.keyDown(tablist, { key: "ArrowDown" });
    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("文化与交通");

    fireEvent.keyDown(tablist, { key: "ArrowUp" });
    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("编年与制度");

    // 从第一类再往上要回到最后一类，而不是停在原地
    fireEvent.keyDown(tablist, { key: "ArrowUp" });
    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("地域与近代");

    fireEvent.keyDown(tablist, { key: "End" });
    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("地域与近代");

    fireEvent.keyDown(tablist, { key: "Home" });
    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("编年与制度");
  });

  it("ignores keys it has no meaning for", async () => {
    const dialog = await openMenu();
    const tablist = within(dialog).getByRole("tablist");

    fireEvent.keyDown(tablist, { key: "a" });

    expect(within(dialog).getByRole("tab", { selected: true })).toHaveTextContent("编年与制度");
  });

  it("closes on Escape", async () => {
    await openMenu();
    expect(screen.getByRole("dialog", { name: "全览目录" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the backdrop is clicked but not the panel itself", async () => {
    const dialog = await openMenu();
    const backdrop = screen.getAllByRole("button", { name: "关闭全览目录" })[0];

    fireEvent.click(dialog);
    expect(screen.getByRole("dialog", { name: "全览目录" })).toBeInTheDocument();

    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when a destination is chosen", async () => {
    const dialog = await openMenu("/");
    fireEvent.click(within(dialog).getByRole("tab", { name: /文化与交通/ }));
    const card = within(dialog)
      .getByRole("heading", { name: /丝绸之路与海疆/ })
      .closest("article");

    fireEvent.click(within(card as HTMLElement).getByRole("link", { name: /进入/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger after closing", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");
    const trigger = within(nav).getByRole("button", { name: /全览地图/ });
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "全览目录" });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(trigger);
  });

  it("cycles Tab inside the panel instead of escaping to the page behind", async () => {
    const dialog = await openMenu();
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();

    if (last) last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    if (first) first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("moves focus to the newly selected category after an arrow key", async () => {
    const dialog = await openMenu();
    fireEvent.keyDown(within(dialog).getByRole("tablist"), { key: "ArrowDown" });

    // 用 rAF 挪焦点，测试里必须等一帧才能断言
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(document.activeElement).toHaveTextContent("文化与交通");
  });
});

describe("<SiteMenu /> hand-drawn map", () => {
  it("renders a decorative map that is hidden from assistive tech", async () => {
    const dialog = await openMenu();
    const map = dialog.querySelector(".hand-drawn-map");

    expect(map).toBeInstanceOf(SVGElement);
    expect(map).toHaveAttribute("aria-hidden", "true");
    expect(map).toHaveAttribute("role", "presentation");
  });

  it("draws the landmass and both islands", async () => {
    const dialog = await openMenu();
    const map = dialog.querySelector(".hand-drawn-map") as SVGElement;

    // 洇墨层和正式描边共用 map-land 类，断言要排除掉，否则会数成四条
    const outlines = Array.from(map.querySelectorAll(".map-land:not(.map-land-bleed)")).map(
      (node) => node.getAttribute("d"),
    );
    // 大陆 + 台湾 + 海南
    expect(outlines.filter(Boolean)).toHaveLength(3);
    for (const d of outlines) {
      expect(d?.startsWith("M ")).toBe(true);
      expect(d?.endsWith("Z")).toBe(true);
    }
  });

  it("gives every region its own set of marks", async () => {
    const dialog = await openMenu();
    const map = dialog.querySelector(".hand-drawn-map") as SVGElement;
    const zones = Array.from(map.querySelectorAll(".map-zone"));

    expect(zones.map((zone) => zone.getAttribute("data-zone"))).toEqual([
      "north",
      "culture",
      "islands",
    ]);
    for (const zone of zones) {
      expect(zone.querySelectorAll("path").length).toBeGreaterThan(4);
    }
  });

  it("lights only the region belonging to the selected category", async () => {
    const dialog = await openMenu("/");
    const map = dialog.querySelector(".hand-drawn-map") as SVGElement;
    const active = () =>
      Array.from(map.querySelectorAll(".map-zone")).filter((zone) =>
        zone.classList.contains("map-zone-active"),
      );

    expect(active().map((zone) => zone.getAttribute("data-zone"))).toEqual(["north"]);

    fireEvent.click(within(dialog).getByRole("tab", { name: /地域与近代/ }));
    expect(active().map((zone) => zone.getAttribute("data-zone"))).toEqual(["islands"]);
  });

  it("uses the brush filter that gives the strokes their ink edge", async () => {
    const dialog = await openMenu();
    const map = dialog.querySelector(".hand-drawn-map") as SVGElement;

    expect(map.querySelector("#map-brush feTurbulence")).toBeInTheDocument();
    expect(map.querySelector("#map-brush feDisplacementMap")).toBeInTheDocument();
    expect(map.querySelector("g[filter='url(#map-brush)']")).toBeInTheDocument();
  });

  it("keeps the map out of the way of pointer interaction", async () => {
    const dialog = await openMenu();
    expect(dialog.querySelector(".site-menu-map")?.className).toContain("pointer-events-none");
  });
});
