import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QingOfficialsPage } from "./qing-officials-page";

describe("<QingOfficialsPage /> — 清代官制图谱", () => {
  it("renders the office chart by default with 皇帝 and six branches", () => {
    render(<QingOfficialsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "清代官制图谱" })).toBeInTheDocument();
    expect(screen.getByText("皇帝")).toBeInTheDocument();
    for (const title of ["中枢部", "佐理部", "帝室部", "行省", "藩部", "府州县"]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { level: 3, name: "荣衔 · 三公三孤与东宫官" }),
    ).toBeInTheDocument();
  });

  it("expands a tree node to reveal its subordinate offices", () => {
    render(<QingOfficialsPage />);

    const sixBoards = screen.getByRole("button", { name: /六部/ });
    expect(sixBoards).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(sixBoards);
    expect(sixBoards).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("吏部").length).toBeGreaterThan(0);
    expect(screen.getAllByText("工部").length).toBeGreaterThan(0);
  });

  it("switches to the nine-rank view and links the ladder to the detail card", () => {
    render(<QingOfficialsPage />);

    fireEvent.click(screen.getByRole("tab", { name: "九品十八级" }));
    expect(screen.getByLabelText("品级阶梯")).toBeInTheDocument();

    const ladder = screen.getByLabelText("品级阶梯");
    const qingLevel = within(ladder)
      .getAllByRole("button", { name: /正一品/ })
      .find((button) => button.getAttribute("aria-pressed") !== null);
    expect(qingLevel).toHaveAttribute("aria-pressed", "true");

    const fifth = within(ladder)
      .getAllByRole("button", { name: /正五品/ })
      .find((button) => button.getAttribute("aria-pressed") !== null)!;
    fireEvent.click(fifth);
    expect(fifth).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("水晶顶");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("绿色");
  });

  it("shows both badge sets and the ritual note in the ranks view", () => {
    render(<QingOfficialsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "九品十八级" }));

    expect(screen.getByLabelText("文官补子 · 飞禽")).toHaveTextContent("仙鹤");
    expect(screen.getByLabelText("武官补子 · 走兽")).toHaveTextContent("麒麟");
    expect(screen.getByLabelText("礼序")).toHaveTextContent("品级决定朝会");
  });
});
