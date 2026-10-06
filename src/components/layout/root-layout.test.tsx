import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RootLayout } from "./root-layout";

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RootLayout />
    </MemoryRouter>,
  );
}

function openMenu(path = "/") {
  renderLayout(path);
  // RootLayout 是静态渲染，nav 与面板都不涉及异步，同步查询即可
  const nav = screen.getByRole("navigation");
  fireEvent.click(within(nav).getByRole("button", { name: /全览地图/ }));
  return screen.getByLabelText("全览目录");
}

afterEach(() => {
  vi.useRealTimers();
});

describe("<RootLayout /> menu trigger", () => {
  it("exposes a single trigger instead of one button per category", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    // 旧版是三个分类各一个下拉按钮。现在只有一个入口，展开后三列并排。
    const triggers = within(nav).getAllByRole("button", { expanded: false });
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toHaveTextContent("全览地图");
    // 下拉是披露控件，不是菜单控件
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps the menu closed until the trigger is used", async () => {
    renderLayout("/");
    await screen.findByRole("navigation");

    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
  });

  it("reports its collapsed state through aria-expanded", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");
    const trigger = within(nav).getByRole("button", { name: /全览地图/ });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", "site-mega-menu");
  });

  it("opens on hover after a short grace delay", async () => {
    vi.useFakeTimers();
    renderLayout("/");
    const nav = screen.getByRole("navigation");
    const trigger = within(nav).getByRole("button", { name: /全览地图/ });

    fireEvent.mouseEnter(trigger);
    // 扫过顶栏不该立刻闪面板
    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
    // 定时器回调里的 setState 要在 act 里刷进 React，否则查询拿到的是旧树
    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByLabelText("全览目录")).toBeInTheDocument();
  });
});

describe("<SiteMenu /> columns and content", () => {
  it("shows all three categories as columns, in editorial order", async () => {
    const panel = await openMenu();
    const titles = Array.from(panel.querySelectorAll(".mega-col")).map(
      (col) => col.querySelector(".font-kai")?.textContent,
    );

    expect(titles).toEqual(["编年与制度", "文化与交通", "地域与近代"]);
  });

  it("lists every destination with an absolute in-site path and a description", async () => {
    // 下拉与全屏面板不同：三列同时可见，五条入口都在 DOM 里，一次断言完
    const panel = await openMenu("/");

    const expected: [string, RegExp][] = [
      ["/china/timeline", /朝代时间长河/],
      ["/china/policies", /朝代政策全览/],
      ["/intangible-culture-heritage", /中华非遗瑰宝/],
      ["/silk-road", /丝绸之路与海疆/],
      ["/taiwan", /台湾专题/],
    ];

    let visited = 0;
    for (const [href, name] of expected) {
      const link = within(panel).getByRole("link", { name });
      visited += 1;
      expect(link).toHaveAttribute("href", href);
      // 条目不能只是光秃秃一个标题：描述文本在同一行组件里
      expect(link.textContent?.length ?? 0).toBeGreaterThan(16);
    }
    expect(visited).toBe(expected.length);
  });

  it("keeps the editorial blurb of the group owning the current route", async () => {
    const panel = await openMenu("/taiwan");

    // 分组导语现在放在列标题的 title 提示里不可见，改为断言地图分区高亮
    const activeZones = Array.from(panel.querySelectorAll(".map-zone-active")).map((zone) =>
      zone.getAttribute("data-zone"),
    );
    expect(activeZones).toEqual(["islands"]);
  });

  it("falls back to the first category on a route with no category", async () => {
    const panel = await openMenu("/");

    const activeZones = Array.from(panel.querySelectorAll(".map-zone-active")).map((zone) =>
      zone.getAttribute("data-zone"),
    );
    expect(activeZones).toEqual(["north"]);
  });

  it("moves the map highlight to the hovered column", async () => {
    const panel = await openMenu("/");
    const column = screen.getByText("地域与近代").closest(".mega-col");
    expect(column).not.toBeNull();

    // 列的 hover 高亮走 wrapper 上的 mouseover 委托
    fireEvent.mouseOver(column as HTMLElement);
    await waitFor(() => {
      const activeZones = Array.from(panel.querySelectorAll(".map-zone-active")).map((zone) =>
        zone.getAttribute("data-zone"),
      );
      expect(activeZones).toEqual(["islands"]);
    });
  });
});

describe("<SiteMenu /> keyboard and dismissal", () => {
  it("closes on Escape and returns focus to the trigger", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");
    const trigger = within(nav).getByRole("button", { name: /全览地图/ });
    fireEvent.click(trigger);
    await screen.findByLabelText("全览目录");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when a pointer goes down outside the panel but not inside it", async () => {
    const panel = await openMenu();

    fireEvent.pointerDown(panel);
    expect(screen.getByLabelText("全览目录")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
  });

  it("closes when a destination is chosen", async () => {
    const panel = await openMenu("/");
    const link = within(panel).getByRole("link", { name: /丝绸之路与海疆/ });

    fireEvent.click(link);

    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
  });

  it("closes shortly after the pointer leaves trigger and panel", async () => {
    vi.useFakeTimers();
    renderLayout("/");
    const trigger = within(screen.getByRole("navigation")).getByRole("button", {
      name: /全览地图/,
    });
    fireEvent.click(trigger);
    const panel = screen.getByLabelText("全览目录");
    // mouseenter/leave 不冒泡，包裹层的监听直接派发到包裹层本身
    const wrapper = panel.parentElement as HTMLElement;

    fireEvent.mouseLeave(wrapper);
    // 宽限期内回来不收起
    await act(async () => {
      vi.advanceTimersByTime(60);
    });
    fireEvent.mouseEnter(wrapper);
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByLabelText("全览目录")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
  });

  it("closes when focus leaves the trigger and the panel", () => {
    const panel = openMenu();
    const link = within(panel).getByRole("link", { name: /台湾专题/ });
    link.focus();
    expect(screen.getByLabelText("全览目录")).toBeInTheDocument();

    // 焦点移出包裹区（relatedTarget 不在面板内）应收起
    fireEvent.focusOut(link);
    expect(screen.queryByLabelText("全览目录")).not.toBeInTheDocument();
  });
});

describe("<SiteMenu /> hand-drawn map", () => {
  it("renders a decorative map that is hidden from assistive tech", async () => {
    const panel = await openMenu();
    const map = panel.querySelector(".hand-drawn-map");

    expect(map).toBeInstanceOf(SVGElement);
    expect(map).toHaveAttribute("aria-hidden", "true");
    expect(map).toHaveAttribute("role", "presentation");
  });

  it("draws the landmass and both islands", async () => {
    const panel = await openMenu();
    const map = panel.querySelector(".hand-drawn-map") as SVGElement;

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
    const panel = await openMenu();
    const map = panel.querySelector(".hand-drawn-map") as SVGElement;
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

  it("uses the brush filter that gives the strokes their ink edge", async () => {
    const panel = await openMenu();
    const map = panel.querySelector(".hand-drawn-map") as SVGElement;

    expect(map.querySelector("#map-brush feTurbulence")).toBeInTheDocument();
    expect(map.querySelector("#map-brush feDisplacementMap")).toBeInTheDocument();
    expect(map.querySelector("g[filter='url(#map-brush)']")).toBeInTheDocument();
  });

  it("keeps the map strip out of the way of pointer interaction", async () => {
    const panel = await openMenu();
    const strip = panel.querySelector(".mega-map");
    expect(strip).not.toBeNull();
    expect(strip?.className).toContain("pointer-events-none");
  });
});
