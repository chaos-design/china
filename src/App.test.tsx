import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { HOME_ENTRANCE_SESSION_KEY } from "./pages/home";

vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => null,
}));

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.style.removeProperty("--vermillion");
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("<App /> routing", () => {
  it("renders the home page at /", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", { level: 1, name: /中国古代全览/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("flex-1", "min-h-0", "overflow-y-auto", "p-0");
  });

  it("stores the home entrance state in sessionStorage for the current window", async () => {
    renderAt("/");

    expect(await screen.findByRole("status", { name: "首页入场动画" })).toBeInTheDocument();
    expect(sessionStorage.getItem(HOME_ENTRANCE_SESSION_KEY)).toBe("true");
  });

  it("skips the home entrance animation after it has shown in the same window", async () => {
    sessionStorage.setItem(HOME_ENTRANCE_SESSION_KEY, "true");

    renderAt("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: /中国古代全览/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "首页入场动画" })).not.toBeInTheDocument();
    expect(document.querySelector(".home-stage")).toHaveClass("opacity-100");
  });

  it("renders the project entry links on the home page", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { name: "核心入口与后续专题" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /朝代时间长河/ })).toHaveAttribute(
      "href",
      "/china/timeline",
    );
    expect(screen.queryByRole("link", { name: /帝王政策全览/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /朝代政策全览/ })).toHaveAttribute(
      "href",
      "/china/policies",
    );
    expect(screen.getByRole("link", { name: /丝绸之路与海疆发展史/ })).toHaveAttribute(
      "href",
      "/silk-road",
    );
    expect(screen.getByText("疆域与民族图谱")).toBeInTheDocument();
    expect(screen.getByText("典章制度索引")).toBeInTheDocument();
    expect(screen.queryByText("丝路与海疆线索")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /疆域与民族图谱/ })).not.toBeInTheDocument();
    const previewEntry = screen.getByText("疆域与民族图谱").closest("article");
    if (!previewEntry) {
      throw new Error("Expected preview entry to render as an article");
    }
    expect(previewEntry).toHaveClass("index-card", "index-card-preview");
    expect(previewEntry).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("筹备中")).toHaveLength(2);
  });

  it("merges the about content into the home page", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { name: /如何阅读中国古代全览/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("内容结构")).toBeInTheDocument();
    expect(screen.getAllByText("朝代全景").length).toBeGreaterThan(0);
    expect(screen.getAllByText("朝代政策全览").length).toBeGreaterThan(0);
    expect(screen.getByText("先定朝代坐标")).toBeInTheDocument();
    expect(screen.getByText("再看治国取向")).toBeInTheDocument();
    expect(screen.getByText("追问疆域变化")).toBeInTheDocument();
    expect(screen.getByText("对照制度变形")).toBeInTheDocument();
    expect(screen.getByText("对照丝路演变")).toBeInTheDocument();
    expect(screen.queryByText(/围绕帝王治国政策展开/)).not.toBeInTheDocument();
  });

  it("renders the global menu in the layout", async () => {
    renderAt("/");
    const nav = await screen.findByRole("navigation");
    const header = nav.closest("header");

    expect(header).toHaveClass("bg-paper/55", "backdrop-saturate-150");
    expect(nav).toHaveClass("font-kai");
    expect(within(nav).getByRole("link", { name: /中国古代全览/i })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: /^01\s+home$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /about/i })).not.toBeInTheDocument();

    // 顶部菜单是分组下拉，叶子节点收在 role="menu" 面板里
    for (const group of ["编年与制度", "文化与交通", "地域与近代"]) {
      expect(within(nav).getByRole("button", { name: new RegExp(group) })).toHaveAttribute(
        "aria-haspopup",
        "true",
      );
    }
    for (const [path, name] of [
      ["/china/timeline", /朝代时间长河/],
      ["/china/policies", /朝代政策全览/],
      ["/intangible-culture-heritage", /中华非遗瑰宝/],
      ["/silk-road", /丝绸之路与海疆/],
      ["/taiwan", /台湾专题/],
    ] as const) {
      expect(within(nav).getByRole("menuitem", { name })).toHaveAttribute("href", path);
    }
    expect(screen.getByRole("link", { name: /chaos-design\/china/i })).toHaveAttribute(
      "href",
      "https://github.com/chaos-design/china",
    );
  });

  it("shows the footer only on the home route", async () => {
    renderAt("/");
    expect(await screen.findByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chaos-design\/china/i })).toHaveAttribute(
      "href",
      "https://github.com/chaos-design/china",
    );
  });

  it("hides the footer on content routes", async () => {
    renderAt("/china/timeline");
    // No per-assertion timeout: the cold lazy import of the Three.js timeline chunk is the
    // slowest first paint in the suite and needs the suite-wide `asyncUtilTimeout`.
    expect(await screen.findByText("汉族朝代与少数民族朝代 (前221 — 1912)")).toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("hides the footer on the React policy route", async () => {
    renderAt("/china/policies");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("renders the not found page for unknown routes", async () => {
    renderAt("/unknown/history-scroll");

    expect(await screen.findByRole("heading", { name: "此页未载入史册" })).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /返回首页/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /前往时间长河/ })).toHaveAttribute(
      "href",
      "/china/timeline",
    );
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("applies the stored accent before rendering the not found route", async () => {
    localStorage.setItem("accent", "shiqing");

    renderAt("/unknown/history-scroll");

    expect(await screen.findByRole("heading", { name: "此页未载入史册" })).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue("--vermillion")).toBe("205 55% 36%");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("registers the generated html resource route", async () => {
    renderAt("/ancient-china");

    const frame = await screen.findByTitle("朝代浮岛 · 时间长河 · 中国朝代与少数民族 3D 编年图");

    expect(frame).toHaveAttribute("data-testid", "legacy-html-document");
    expect(frame).toHaveAttribute("srcDoc", expect.stringContaining("朝代浮岛"));
    expect(screen.queryByRole("heading", { name: "此页未载入史册" })).not.toBeInTheDocument();
  });

  it("groups the header menu and expands each group on hover", async () => {
    renderAt("/");
    const nav = await screen.findByRole("navigation");

    // 分组按钮：数量固定，且都带 aria-haspopup
    const triggers = within(nav).getAllByRole("button", { expanded: false });
    expect(triggers.map((node) => node.textContent)).toEqual([
      "编年与制度",
      "文化与交通",
      "地域与近代",
    ]);

    // 面板默认收起但存在于 DOM 里
    const policies = within(nav).getByRole("menuitem", { name: /朝代政策全览/ });
    expect(policies.closest("[role='menu']")).toHaveClass("opacity-0");

    fireEvent.mouseEnter(within(nav).getByRole("button", { name: /编年与制度/ }));
    expect(within(nav).getByRole("button", { name: /编年与制度/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(policies.closest("[role='menu']")).toHaveClass("opacity-100");
  });

  it("closes a group menu on click toggle and marks the active group", async () => {
    renderAt("/taiwan");
    const nav = await screen.findByRole("navigation");

    // 当前路由 /taiwan 属于「地域与近代」，该分组按钮应为激活色（text-ink）
    const regionTrigger = within(nav).getByRole("button", { name: /地域与近代/ });
    expect(regionTrigger).toHaveClass("text-ink");

    fireEvent.click(regionTrigger);
    expect(regionTrigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(regionTrigger);
    expect(regionTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates from the timeline route to the policies route", async () => {
    // 回归：时间长河曾注入 position:fixed; inset:0 的 #loading 遮罩，
    // 初始化失败时它盖住 <header>，导航点击完全失效。
    renderAt("/china/timeline");
    const nav = await screen.findByRole("navigation");

    expect(document.querySelector("#loading")).toBeInTheDocument();
    // 遮罩必须限制在内容区内，不能相对视口铺满
    expect(document.querySelector("#loading")).not.toHaveClass("fixed");

    fireEvent.click(within(nav).getByRole("button", { name: /编年与制度/ }));
    fireEvent.click(within(nav).getByRole("menuitem", { name: /朝代政策全览/ }));

    // 路由切换成功：政策页的朝代标题出现，且时间轴已卸载
    expect(await screen.findByRole("heading", { name: /秦/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector("#cv")).not.toBeInTheDocument();
    });
  });

  it("lets users change the accent color from the floating picker", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1, name: /中国古代全览/ });

    fireEvent.click(screen.getByRole("button", { name: "打开调色器" }));
    expect(screen.getByRole("button", { name: "朱砂" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "朱砂" }));

    expect(document.documentElement.style.getPropertyValue("--vermillion")).toBe("2 68% 47%");
    expect(localStorage.getItem("accent")).toBe("zhusha");
    expect(screen.queryByRole("button", { name: "朱砂" })).not.toBeInTheDocument();
  });

  it("hides the accent list when the pointer leaves the picker", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1, name: /中国古代全览/ });

    fireEvent.click(screen.getByRole("button", { name: "打开调色器" }));
    expect(screen.getByRole("button", { name: "朱砂" })).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId("accent-picker"));

    expect(screen.queryByRole("button", { name: "朱砂" })).not.toBeInTheDocument();
  });

  it("renders the ancient China chronology page", async () => {
    renderAt("/china/timeline");
    expect(await screen.findByRole("button", { name: "巡游" })).toHaveAttribute("id", "btn-tour");
    expect(screen.queryByTestId("legacy-html-document")).not.toBeInTheDocument();
    expect(screen.getByText("汉族朝代与少数民族朝代 (前221 — 1912)")).toBeInTheDocument();
  });

  it("preserves the complete chronology HTML interactions in the React page", async () => {
    renderAt("/china/timeline");
    expect(await screen.findByRole("button", { name: "巡游" })).toHaveAttribute("id", "btn-tour");
    expect(screen.queryByRole("heading", { name: "朝代浮岛 · 时间长河" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("legacy-html-document")).not.toBeInTheDocument();
    expect(document.querySelector(".cosmic-flow")).toBeInTheDocument();
    expect(document.querySelectorAll(".cosmic-planet")).toHaveLength(0);
    expect(document.querySelectorAll(".cosmic-meteor")).toHaveLength(6);
    expect(document.querySelectorAll(".cosmic-meteor-forward")).toHaveLength(3);
    expect(document.querySelectorAll(".cosmic-meteor-reverse")).toHaveLength(3);
    expect(document.querySelectorAll(".cosmic-impact")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "吞并流向" })).toHaveAttribute("id", "btn-annex");
    const toggleFilterbar = screen.getByRole("button", { name: "收起" });
    expect(toggleFilterbar).toHaveAttribute("id", "btn-toggle-filterbar");
    fireEvent.click(toggleFilterbar);
    expect(document.getElementById("filterbar")).toHaveClass("is-collapsed");
    expect(screen.getByRole("button", { name: "展开" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^清除/ })).toHaveAttribute("id", "btn-clear-filter");
    expect(screen.getByText("公元前")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1912")).toBeInTheDocument();
    expect(screen.getByText("Mac")).toHaveClass("ancient-china-legend-help-highlight");
    expect(screen.getByText("Win")).toHaveClass("ancient-china-legend-help-highlight");
    expect(screen.getByText("⌘")).toBeInTheDocument();
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
    expect(document.getElementById("yr-min")).toBeInstanceOf(HTMLInputElement);
    expect(document.getElementById("minority-panel")).toBeInTheDocument();
    expect(document.getElementById("person-card")).toBeInTheDocument();
  });

  it("renders the ancient China policies page", async () => {
    renderAt("/china/policies");
    await waitFor(
      () => expect(document.querySelector(".acp-lightbox-mask")).toBeInstanceOf(HTMLButtonElement),
      { timeout: 3000 },
    );
    expect(screen.queryByTestId("legacy-html-document")).not.toBeInTheDocument();
    expect(document.querySelector(".acp-lightbox-mask")).toBeInstanceOf(HTMLButtonElement);
  });

  it("preserves the complete policy HTML interactions in the React page", async () => {
    renderAt("/china/policies");
    expect(await screen.findByRole("button", { name: "秦 公元前 221 — 前 206 年" })).toHaveClass(
      "active",
    );
    expect(screen.getByRole("button", { name: "汉 公元前 202 — 公元 220 年" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "图例说明" })).toBeInTheDocument();
    expect(screen.getByText("历史人物")).toBeInTheDocument();
    expect(screen.getByText("核心政策")).toBeInTheDocument();
    expect(screen.getByText("制度机构")).toBeInTheDocument();
  });
});
