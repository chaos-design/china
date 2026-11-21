import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { ImperialExamPage } from "./imperial-exam-page";
import { EXAM_STAGES } from "./ladder";

describe("<ImperialExamPage />", () => {
  it("renders the header, the seven-stage chain with images, funnel and cadence", () => {
    render(<ImperialExamPage />);

    expect(screen.getByRole("heading", { level: 1, name: "科举之路" })).toBeInTheDocument();
    expect(screen.getByText(/一张考卷，怎样换来一顶官帽/)).toBeInTheDocument();

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

    // 右侧漏斗与底部节奏轴、图例
    expect(
      within(ladder).getByRole("complementary", { name: "读书人晋身之路" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/科举之路时间线 · 每三年一科/)).toBeInTheDocument();
    expect(within(ladder).getByText("第一年 · 八月")).toBeInTheDocument();
    expect(within(ladder).getByText("朝廷铨选，授以官职")).toBeInTheDocument();

    // 正途之外的岔路恒常可见
    expect(screen.getByText("岔路 · 正途之外的入仕")).toBeInTheDocument();
    expect(screen.getByText(/天花板/)).toBeInTheDocument();
  });

  it("shows the 先秦 panel by default with its routes and career sample", () => {
    render(<ImperialExamPage />);

    const panel = screen.getByRole("article", { name: "先秦官途" });
    expect(within(panel).getByText("世卿世禄")).toBeInTheDocument();
    expect(within(panel).getByText("李斯")).toBeInTheDocument();
    expect(within(panel).getByText("《史记·李斯列传》")).toBeInTheDocument();
    // 迁转链终点高亮为「将·相」
    expect(within(panel).getByText("将·相")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "先秦" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to 汉 and shows its entry routes, promotion mechanisms and career", () => {
    render(<ImperialExamPage />);

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
    render(<ImperialExamPage />);

    fireEvent.click(screen.getByRole("button", { name: "清" }));

    const panel = screen.getByRole("article", { name: "清官途" });
    expect(within(panel).getByText("曾国藩")).toBeInTheDocument();
    expect(within(panel).getByText("克金陵，封一等毅勇侯")).toBeInTheDocument();
    expect(within(panel).getByText("《清史稿·曾国藩传》")).toBeInTheDocument();
    // 「十年七迁，连跃十级」出现在履历补注里（subjectIntro 亦含「十年七迁」，故用全句）
    expect(within(panel).getByText(/十年七迁，连跃十级/)).toBeInTheDocument();
  });

  it("renders the comparison table with one row per dynasty", () => {
    render(<ImperialExamPage />);

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(IMPERIAL_EXAM_DYNASTIES.length + 1);
    expect(within(table).getByText("上品无寒门，起家看门第")).toBeInTheDocument();
    // 「怎么进门」「怎么上去」两列把途径与机制名合并成一句话
    expect(within(table).getByText(/科举正途/)).toBeInTheDocument();
    expect(within(table).getByText("京察大计、铨选月选、议叙加级")).toBeInTheDocument();
  });

  it("lists per-dynasty sources and image credits in the footer", () => {
    render(<ImperialExamPage />);

    expect(screen.getByText("资料出处")).toBeInTheDocument();
    expect(screen.getByText(/《元史·张养浩传》/)).toBeInTheDocument();
    expect(screen.getByText(/《明史·张居正传》/)).toBeInTheDocument();
    expect(screen.getByText(/估算数字以「约」标示/)).toBeInTheDocument();
    // 真实影像的出处清单
    expect(screen.getByText("图片出处")).toBeInTheDocument();
    expect(screen.getAllByText(/Wikimedia Commons · /).length).toBeGreaterThanOrEqual(10);
  });
});
