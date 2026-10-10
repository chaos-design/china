import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AncientChinaPoliciesReactPage } from "./page";

// Each test in this file renders the full policy atlas: ~385 cards, 10 dimensions and the
// glossary tree, built from a 246kB dynasty JSON. That is by far the heaviest render in the
// suite, so this file gets a larger budget than the global testTimeout.
vi.setConfig({ testTimeout: 45000 });

describe("<AncientChinaPoliciesReactPage />", () => {
  let scrollIntoView: ReturnType<typeof vi.fn<HTMLElement["scrollIntoView"]>>;

  beforeEach(() => {
    scrollIntoView = vi.fn<HTMLElement["scrollIntoView"]>();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 240 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 160 });
  });

  afterEach(() => {
    document.querySelectorAll("body > input").forEach((input) => {
      input.remove();
    });
    vi.restoreAllMocks();
  });

  it("switches dynasties from the timeline and ignores arrow keys from form fields", () => {
    render(<AncientChinaPoliciesReactPage />);

    const hanButton = screen.getByRole("button", { name: /^汉 公元前 202/ });
    fireEvent.click(hanButton);

    expect(screen.getByRole("heading", { name: /汉 朝/ })).toBeInTheDocument();
    expect(hanButton).toHaveClass("active");
    expect(scrollIntoView).toHaveBeenCalled();

    const input = document.createElement("input");
    document.body.append(input);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: /汉 朝/ })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByRole("heading", { name: /秦 朝/ })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByRole("heading", { name: /秦 朝/ })).toBeInTheDocument();
  });

  it("navigates dynasties with every arrow key, not only ArrowLeft", () => {
    render(<AncientChinaPoliciesReactPage />);

    // The timeline label reads "<朝代名><年代>", while the visible heading spaces out each
    // character of the name, so assert on the timeline node instead of the heading text.
    const activeDynasty = () =>
      document.querySelector<HTMLElement>(".tl-node.active")?.textContent?.trim() ?? "";

    expect(activeDynasty()).toMatch(/^秦/);

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(activeDynasty()).toMatch(/^汉/);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(activeDynasty()).toMatch(/^魏/);

    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(activeDynasty()).toMatch(/^汉/);

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(activeDynasty()).toMatch(/^秦/);
  });

  it("does not open the glossary tooltip over content that has no term", () => {
    render(<AncientChinaPoliciesReactPage />);

    const tooltip = document.querySelector<HTMLElement>(".acp-tooltip");
    const term = document.querySelector<HTMLElement>('[data-term="秦始皇"]');

    if (!tooltip || !term) {
      throw new Error("Expected the glossary tooltip and a glossary term to render");
    }

    fireEvent.mouseOver(screen.getByRole("heading", { level: 2 }));
    expect(tooltip).not.toHaveClass("show");

    fireEvent.mouseOver(term);
    expect(tooltip).toHaveClass("show");
  });

  it("keeps the selected dimension per dynasty and renders optional card sections", () => {
    render(<AncientChinaPoliciesReactPage />);

    fireEvent.click(screen.getByRole("button", { name: "军事·武力征服" }));

    expect(screen.getByRole("button", { name: "军事·武力征服" })).toHaveClass("active");
    expect(document.body).toHaveTextContent("销兵铸十二金人");

    fireEvent.click(screen.getByRole("button", { name: /^元 / }));
    fireEvent.click(screen.getByRole("button", { name: "工艺·古法制造" }));

    expect(screen.getByRole("button", { name: "工艺·古法制造" })).toHaveClass("active");
    expect(screen.getAllByText("【古法工序】").length).toBeGreaterThan(0);
    expect(document.body).toHaveTextContent("绞盘");

    fireEvent.click(screen.getByRole("button", { name: /^秦 / }));
    expect(screen.getByRole("button", { name: "军事·武力征服" })).toHaveClass("active");
  });

  it("scrolls the content to the top when a dimension tab is switched", () => {
    render(<AncientChinaPoliciesReactPage />);

    const mainWrapEl = document.querySelector<HTMLElement>(".main-wrap");
    expect(mainWrapEl).toBeInTheDocument();

    let written: number | undefined;
    const originalDesc = Object.getOwnPropertyDescriptor(mainWrapEl, "scrollTop");
    Object.defineProperty(mainWrapEl, "scrollTop", {
      configurable: true,
      set: (value: number) => {
        written = value;
      },
      get: () => (originalDesc?.get ? originalDesc.get.call(mainWrapEl) : 0),
    });

    fireEvent.click(screen.getByRole("button", { name: "工艺·古法制造" }));

    // switchDim writes mainWrapRef.current.scrollTop = 0, snapping the content to the top.
    expect(written).toBe(0);
  });

  it("renders craft cards as a numbered process flow with step detail", () => {
    render(<AncientChinaPoliciesReactPage />);

    const dimTab = screen.getByRole("button", { name: "工艺·古法制造" });
    fireEvent.click(dimTab);

    const activeSection = document.querySelector<HTMLElement>(".dim-section.active");
    expect(activeSection).toBeInTheDocument();
    expect(activeSection!.getAttribute("data-dim")).toBe("工艺·古法制造");

    const qinCraft = activeSection!.querySelector<HTMLElement>(".craft-steps");
    expect(qinCraft).toBeInTheDocument();
    // The process ribbon + the numbered detail list both carry the step titles.
    expect(qinCraft!.querySelectorAll(".craft-flow-node").length).toBeGreaterThan(0);
    expect(qinCraft!.querySelectorAll(".craft-flow-arrow").length).toBeGreaterThan(0);
    expect(qinCraft!.querySelectorAll(".craft-steps-list li").length).toBeGreaterThan(0);
    // The step name "选料" is lifted into its own styled element.
    expect(qinCraft!.textContent).toContain("选料");
  });

  it("renders 官制 rank tables as styled .impact-block divs, plain impacts as <p>", () => {
    render(<AncientChinaPoliciesReactPage />);

    // The default 权谋 dimension keeps the plain-prose layout: <p><strong>【影响】</strong>.
    const plainSection = document.querySelector<HTMLElement>(".dim-section.active");
    expect(plainSection).toBeInTheDocument();
    expect(plainSection!.getAttribute("data-dim")).toBe("权谋·中央集权");
    expect(plainSection!.querySelector("p strong")?.textContent).toContain("【影响】");
    expect(plainSection!.querySelector(".impact-block")).not.toBeInTheDocument();

    // 官制·职级对照 embeds a raw rank comparison table inside its impact string,
    // so it must switch to the div-based layout with the styled table.
    fireEvent.click(screen.getByRole("button", { name: "官制·职级对照" }));

    const rankSection = document.querySelector<HTMLElement>(".dim-section.active");
    expect(rankSection).toBeInTheDocument();
    expect(rankSection!.getAttribute("data-dim")).toBe("官制·职级对照");

    const impactBlock = rankSection!.querySelector<HTMLElement>(".impact-block");
    expect(impactBlock).toBeInTheDocument();
    expect(impactBlock!.querySelector(".impact-label")?.textContent).toContain("【影响】");
    // The embedded table renders as a real styled table with a header row.
    expect(rankSection!.querySelector(".rank-tbl .rt-row.rt-head")).toBeInTheDocument();
    expect(rankSection!.querySelectorAll(".rank-tbl .rt-row").length).toBeGreaterThan(1);
    // 文职/武职 sections keep their distinct accent classes.
    expect(rankSection!.querySelector(".rank-section.mil")).toBeInTheDocument();
  });

  it("renders the territory SVG figure for every dynasty without falling back to img", async () => {
    render(<AncientChinaPoliciesReactPage />);

    const dynastyButtons = screen.getAllByRole("button").filter((button) => {
      return /^(秦|汉|魏晋南北朝|隋|唐|宋|元|明|清)\s/.test(button.textContent ?? "");
    });

    for (const dynastyButton of dynastyButtons) {
      fireEvent.click(dynastyButton);
      fireEvent.click(screen.getByRole("button", { name: "疆域·地区划分" }));

      const activeSection = document.querySelector<HTMLElement>(".dim-section.active");
      expect(activeSection).toBeInTheDocument();

      // Figures are code-split chunks, so the inline SVG arrives after the click settles.
      await waitFor(() => {
        expect(activeSection?.querySelector(".policy-figure svg")).toBeInTheDocument();
      });
      expect(activeSection?.querySelector("img")).not.toBeInTheDocument();
    }
  });

  it("keeps territory map labels as plain SVG text without label frames", async () => {
    render(<AncientChinaPoliciesReactPage />);

    const dynastyButtons = screen.getAllByRole("button").filter((button) => {
      return /^(秦|汉|魏晋南北朝|隋|唐|宋|元|明|清)\s/.test(button.textContent ?? "");
    });

    for (const dynastyButton of dynastyButtons) {
      fireEvent.click(dynastyButton);
      fireEvent.click(screen.getByRole("button", { name: "疆域·地区划分" }));

      const activeSection = document.querySelector<HTMLElement>(".dim-section.active");

      await waitFor(() => {
        expect(activeSection?.querySelector(".policy-figure svg")).toBeInTheDocument();
      });

      const framedLabels = Array.from(
        activeSection?.querySelectorAll<SVGRectElement>(
          'svg > rect[fill="#fdf6e3"][fill-opacity="0.88"][stroke="#a89070"]',
        ) ?? [],
      );

      expect(framedLabels).toHaveLength(0);
    }
  });

  it("shows, moves, and hides glossary tooltips with viewport clamping", () => {
    render(<AncientChinaPoliciesReactPage />);

    const term = document.querySelector<HTMLElement>('[data-term="秦始皇"]');
    const tooltip = document.querySelector<HTMLElement>(".acp-tooltip");

    if (!term || !tooltip) {
      throw new Error("Expected glossary term and tooltip to render");
    }

    Object.defineProperty(tooltip, "offsetWidth", { configurable: true, value: 320 });
    Object.defineProperty(tooltip, "offsetHeight", { configurable: true, value: 220 });

    fireEvent.mouseMove(term, { clientX: 12, clientY: 12 });
    expect(tooltip).not.toHaveClass("show");

    fireEvent.mouseOver(term, { clientX: 230, clientY: 150 });

    expect(tooltip).toHaveClass("show");
    expect(tooltip).toHaveTextContent("秦始皇 嬴政");
    expect(tooltip).toHaveTextContent("人物");
    expect(tooltip).toHaveTextContent("中国首位皇帝");
    expect(tooltip.style.left).toBe("4px");
    expect(tooltip.style.top).toBe("4px");

    fireEvent.mouseMove(term, { clientX: 20, clientY: 20 });
    expect(tooltip).toHaveClass("show");

    fireEvent.mouseOut(term);
    expect(tooltip).not.toHaveClass("show");
  });

  it("opens the SVG figure lightbox from policy cards and closes it by click or Escape", async () => {
    render(<AncientChinaPoliciesReactPage />);

    fireEvent.click(screen.getByRole("button", { name: /^元 / }));
    // 「元」的 SVG 图形只在「疆域·地区划分」维度里。现在只挂载当前维度分区，
    // 需要先把维度切到含图的那一个，图形按钮才会在 DOM 里。
    fireEvent.click(screen.getByRole("button", { name: "疆域·地区划分" }));

    const contentArea = document.getElementById("contentArea");
    const figureButton = contentArea?.querySelector<HTMLButtonElement>(".policy-figure-button");

    if (!contentArea || !figureButton) {
      throw new Error("Expected Yuan SVG policy figure card to render");
    }

    await waitFor(() => {
      expect(contentArea.querySelector(".card-img svg")).toBeInTheDocument();
    });

    fireEvent.click(contentArea);
    expect(screen.queryByRole("img", { name: "放大图" })).not.toBeInTheDocument();

    fireEvent.click(figureButton);
    expect(
      await screen.findByRole("img", { name: /放大图：行省制·中国'省'制开端/ }),
    ).toBeInTheDocument();
    expect(document.querySelector(".acp-lightbox-figure svg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭放大图" }));
    expect(screen.queryByRole("img", { name: /放大图/ })).not.toBeInTheDocument();

    fireEvent.click(figureButton);
    expect(screen.getByRole("img", { name: /放大图/ })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("img", { name: /放大图/ })).not.toBeInTheDocument();
  });
});
