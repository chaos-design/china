import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RootLayout } from "./root-layout";

beforeEach(() => {
  // 分组菜单的收起有 120ms 延迟，用假时钟才能同步断言，不受 CI 负载影响
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RootLayout />
    </MemoryRouter>,
  );
}

describe("<RootLayout /> grouped menu", () => {
  it("renders three groups with correct labels and order", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    const triggers = within(nav).getAllByRole("button", { expanded: false });
    expect(triggers.map((node) => node.textContent)).toEqual([
      "编年与制度",
      "文化与交通",
      "地域与近代",
    ]);
  });

  it("keeps every leaf reachable with an absolute in-site path", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    const expected: [string, RegExp][] = [
      ["/china/timeline", /朝代时间长河/],
      ["/china/policies", /朝代政策全览/],
      ["/intangible-culture-heritage", /中华非遗瑰宝/],
      ["/silk-road", /丝绸之路与海疆/],
      ["/taiwan", /台湾专题/],
    ];

    for (const [href, name] of expected) {
      const item = within(nav).getByRole("menuitem", { name });
      expect(item).toHaveAttribute("href", href);
      // 叶子必须带一句描述，否则分组菜单退化成和旧版一样的扁平链接
      const description = item.querySelector("span + span");
      expect(description?.textContent?.trim().length ?? 0).toBeGreaterThan(4);
    }
  });

  it("opens a group on hover and closes it on mouse leave", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    const culture = within(nav).getByRole("button", { name: /文化与交通/ });
    const panel = within(nav)
      .getByRole("menuitem", { name: /丝绸之路与海疆/ })
      .closest("[role='menu']");

    expect(culture).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveClass("opacity-0");

    fireEvent.mouseEnter(culture);
    expect(culture).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveClass("opacity-100");

    fireEvent.mouseLeave(culture);
    // 收起是 120ms 延迟（指针从按钮移到面板的路上不闪），这里推进假时钟
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(culture).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles a group on click so touch devices have a path", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    const region = within(nav).getByRole("button", { name: /地域与近代/ });
    fireEvent.click(region);
    expect(region).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(region);
    expect(region).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the group that owns the current route as active", async () => {
    renderLayout("/taiwan");
    const nav = await screen.findByRole("navigation");

    expect(within(nav).getByRole("button", { name: /地域与近代/ })).toHaveClass("text-ink");
    expect(within(nav).getByRole("button", { name: /文化与交通/ })).toHaveClass(
      "text-muted-foreground",
    );
  });

  it("marks the chronology group active on the timeline route", async () => {
    renderLayout("/china/timeline");
    const nav = await screen.findByRole("navigation");

    expect(within(nav).getByRole("button", { name: /编年与制度/ })).toHaveClass("text-ink");
  });

  it("leaves no group active on the home route", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    for (const name of [/编年与制度/, /文化与交通/, /地域与近代/]) {
      expect(within(nav).getByRole("button", { name })).toHaveClass("text-muted-foreground");
    }
  });

  it("marks the current leaf with aria-current inside an open group", async () => {
    renderLayout("/china/policies");
    const nav = await screen.findByRole("navigation");

    fireEvent.click(within(nav).getByRole("button", { name: /编年与制度/ }));
    const active = within(nav).getByRole("menuitem", { name: /朝代政策全览/ });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveClass("bg-vermillion/10");
  });

  it("hides collapsed panels from pointer interaction while keeping them readable", async () => {
    renderLayout("/");
    const nav = await screen.findByRole("navigation");

    const panels = within(nav).getAllByRole("menu", { hidden: true });
    expect(panels).toHaveLength(3);
    // 收起的面板保留在 DOM 里（无障碍树可读），但不吃鼠标事件
    for (const panel of panels) {
      expect(panel).toHaveClass("pointer-events-none");
    }
  });
});
