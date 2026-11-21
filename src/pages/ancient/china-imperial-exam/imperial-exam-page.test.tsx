import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IMPERIAL_EXAM_DYNASTIES } from "./dynasties";
import { ImperialExamPage } from "./imperial-exam-page";
import { IMPERIAL_EXAM_LADDER } from "./ladder";

describe("<ImperialExamPage />", () => {
  it("renders the header, the five exam gates and the side-route aside", () => {
    render(<ImperialExamPage />);

    expect(screen.getByRole("heading", { level: 1, name: "科举之路" })).toBeInTheDocument();
    expect(screen.getByText(/登科之阶：从童生到翰林/)).toBeInTheDocument();

    const ladder = screen.getByRole("region", { name: "登科之阶" });
    // 五道关卡各有一条「关卡 · 考试」横条：院试 → 乡试 → 会试 → 殿试 → 庶吉士之选
    expect(within(ladder).getAllByText("关卡 · 考试")).toHaveLength(
      IMPERIAL_EXAM_LADDER.length - 1,
    );
    for (const gateName of ["院试", "乡试（秋闱）", "会试（春闱）", "殿试", "庶吉士之选"]) {
      expect(within(ladder).getByText(gateName)).toBeInTheDocument();
    }
    for (const station of ["童生", "秀才（生员）", "举人", "进士", "翰林（庶吉士）"]) {
      expect(within(ladder).getByRole("heading", { level: 3, name: station })).toBeInTheDocument();
    }

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

  it("lists per-dynasty sources in the footer", () => {
    render(<ImperialExamPage />);

    expect(screen.getByText("资料出处")).toBeInTheDocument();
    expect(screen.getByText(/《元史·张养浩传》/)).toBeInTheDocument();
    expect(screen.getByText(/《明史·张居正传》/)).toBeInTheDocument();
    expect(screen.getByText(/估算数字以「约」标示/)).toBeInTheDocument();
  });
});
