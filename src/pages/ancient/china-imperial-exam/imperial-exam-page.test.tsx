import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { ImperialExamPage } from "./imperial-exam-page";
import { EXAM_STAGES } from "./ladder";
import { IMPERIAL_EXAM_SECTIONS } from "./sections";

function renderSection(sectionId: string) {
  return render(
    <MemoryRouter>
      <ImperialExamPage sectionId={sectionId} />
    </MemoryRouter>,
  );
}

describe("<ImperialExamPage /> 共用外壳", () => {
  it("renders the pinned header with badge, milestones and the section menu", () => {
    renderSection("stages");

    expect(screen.getByRole("heading", { level: 1, name: "科举之路" })).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 1, name: "科举之路" }).closest("header");
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText("入仕 · 晋升 · 官途")).toBeInTheDocument();
    expect(within(header as HTMLElement).getByLabelText("制度里程碑")).toBeInTheDocument();

    const menu = within(screen.getByRole("navigation", { name: "科举之路目录" }));
    for (const section of IMPERIAL_EXAM_SECTIONS) {
      expect(menu.getByRole("link", { name: new RegExp(`^${section.name}`) })).toHaveAttribute(
        "href",
        `/china/imperial-exam/${section.id}`,
      );
    }
    expect(menu.getByRole("link", { name: /^登科之阶/ })).toHaveAttribute("aria-current", "page");
  });

  it("marks the active menu entry per section", () => {
    renderSection("dynasties");

    const menu = within(screen.getByRole("navigation", { name: "科举之路目录" }));
    expect(menu.getByRole("link", { name: /^历代官途/ })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: /^登科之阶/ })).not.toHaveAttribute("aria-current");
  });

  it("falls back to a friendly card for an unknown section id", () => {
    renderSection("nonexistent");

    expect(screen.getByRole("heading", { name: "条目尚未收录" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "科举之路目录" })).not.toBeInTheDocument();
  });
});

describe("<ImperialExamPage /> 登科之阶", () => {
  it("renders the seven-stage chain with images, funnel and cadence", () => {
    renderSection("stages");

    const ladder = screen.getByRole("region", { name: "登科之阶" });
    // 七站链：每站一张编号卡（站名 + 地点 + 时点 + 身份）
    for (const stage of EXAM_STAGES) {
      expect(
        within(ladder).getByRole("heading", { level: 3, name: stage.name }),
      ).toBeInTheDocument();
      expect(within(ladder).getByText(stage.place)).toBeInTheDocument();
      expect(within(ladder).getByText(stage.identity)).toBeInTheDocument();
    }
    // 每站一张主图 + 部分站点的细节缩略图：全链至少 7 张 <img>
    //（jsdom 不加载图片，只断言 DOM 存在）
    expect(ladder.querySelectorAll("img").length).toBeGreaterThanOrEqual(EXAM_STAGES.length);

    // 右侧漏斗（lg 吸顶）与底部节奏轴、图例
    const funnel = within(ladder).getByRole("complementary", { name: "读书人晋身之路" });
    expect(funnel).toBeInTheDocument();
    // 吸顶：lg 下 sticky 钉在内容滚动容器顶部，超出高度时卡片内部滚动兜底
    expect(funnel.className).toContain("lg:sticky");
    expect(funnel.className).toContain("lg:top-0");
    expect(funnel.className).toContain("lg:overflow-y-auto");
    expect(screen.getByText(/科举之路时间线 · 每三年一科/)).toBeInTheDocument();
    expect(within(ladder).getByText("第一年 · 八月")).toBeInTheDocument();
    expect(within(ladder).getByText("朝廷铨选，授以官职")).toBeInTheDocument();
    // 五个考试站各带「考试科目 / 考试方式」双栏块
    expect(within(ladder).getAllByText("考试科目")).toHaveLength(5);
    expect(within(ladder).getAllByText("考试方式")).toHaveLength(5);
    expect(within(ladder).getAllByText("考什么")).toHaveLength(5);
    expect(within(ladder).getByText("第一场 · 四书文")).toBeInTheDocument();

    // 正途之外的岔路恒常可见
    expect(screen.getByText("岔路 · 正途之外的入仕")).toBeInTheDocument();
    expect(screen.getByText(/天花板/)).toBeInTheDocument();
  });

  it("lists the image credits in the stages footer", () => {
    renderSection("stages");

    expect(screen.getByText("图片出处")).toBeInTheDocument();
    expect(screen.getAllByText(/Wikimedia Commons · /).length).toBeGreaterThanOrEqual(10);
    // 资料出处（历代正史）不在本页
    expect(screen.queryByText("资料出处")).not.toBeInTheDocument();
  });
});

describe("<ImperialExamPage /> 历代官途", () => {
  it("shows the 先秦 panel by default with its routes and career sample", () => {
    renderSection("dynasties");

    const panel = screen.getByRole("article", { name: "先秦官途" });
    expect(within(panel).getByText("世卿世禄")).toBeInTheDocument();
    expect(within(panel).getByText("李斯")).toBeInTheDocument();
    expect(within(panel).getByText("《史记·李斯列传》")).toBeInTheDocument();
    // 迁转链终点高亮为「将·相」
    expect(within(panel).getByText("将·相")).toBeInTheDocument();

    // 朝代选择吸顶：滚动到长履历时 chips 钉在滚动容器顶部
    const chips = screen.getByRole("group", { name: "朝代选择" });
    expect(chips.className).toContain("sticky");
    expect(chips.className).toContain("top-0");
    expect(chips.className).toContain("bg-paper");

    expect(screen.getByRole("button", { name: "先秦" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to 汉 and shows its entry routes, promotion mechanisms and career", () => {
    renderSection("dynasties");

    fireEvent.click(screen.getByRole("button", { name: "汉" }));

    const panel = screen.getByRole("article", { name: "汉官途" });
    expect(within(panel).getByText("察举")).toBeInTheDocument();
    expect(within(panel).getByText("上计考课")).toBeInTheDocument();
    expect(within(panel).getByText("郡守国相")).toBeInTheDocument();
    expect(within(panel).getByText("张衡")).toBeInTheDocument();
    expect(within(panel).getByText("《后汉书·张衡传》")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "汉" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "先秦" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("article", { name: "先秦官途" })).not.toBeInTheDocument();
  });

  it("switches to 清 and shows the 曾国藩 career sourced from 清史稿", () => {
    renderSection("dynasties");

    fireEvent.click(screen.getByRole("button", { name: "清" }));

    const panel = screen.getByRole("article", { name: "清官途" });
    expect(within(panel).getByText("曾国藩")).toBeInTheDocument();
    expect(within(panel).getByText("克金陵，封一等毅勇侯")).toBeInTheDocument();
    expect(within(panel).getByText("《清史稿·曾国藩传》")).toBeInTheDocument();
    // 「十年七迁，连跃十级」出现在履历补注里（subjectIntro 亦含「十年七迁」，故用全句）
    expect(within(panel).getByText(/十年七迁，连跃十级/)).toBeInTheDocument();
  });
});

describe("<ImperialExamPage /> 对照一览", () => {
  it("renders the comparison table with one row per dynasty", () => {
    renderSection("compare");

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(IMPERIAL_EXAM_DYNASTIES.length + 1);
    expect(within(table).getByText("上品无寒门，起家看门第")).toBeInTheDocument();
    // 「怎么进门」「怎么上去」两列把途径与机制名合并成一句话
    expect(within(table).getByText(/科举正途/)).toBeInTheDocument();
    expect(within(table).getByText("京察大计、铨选月选、议叙加级")).toBeInTheDocument();
  });

  it("lists per-dynasty sources in the compare footer", () => {
    renderSection("compare");

    expect(screen.getByText("资料出处")).toBeInTheDocument();
    expect(screen.getByText(/《元史·张养浩传》/)).toBeInTheDocument();
    expect(screen.getByText(/《明史·张居正传》/)).toBeInTheDocument();
    expect(screen.getByText(/估算数字以「约」标示/)).toBeInTheDocument();
    // 图片出处只在登科之阶页
    expect(screen.queryByText("图片出处")).not.toBeInTheDocument();
  });
});
