import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RanksPage } from "./ranks-page";

/**
 * 品级族谱现在是资料抽屉的一个 tab（无 WebGL / 键盘可达的 2D 镜像）：
 * jsdom 下场景不可用，页面自动停在「族谱」tab，直接可断言；
 * 换朝走页面统一的「朝代选择」筛选面板，族谱展开状态随之重置。
 */
function genealogy() {
  return within(screen.getByLabelText("品级族谱"));
}

/** 品级节点只取主干 <ol> 的一级 <li>（展开块里嵌套的官职 <ol> 不算）。 */
function levelButton(section: HTMLElement, index: number): HTMLButtonElement {
  const mainOl = section.querySelector("ol")!;
  const item = mainOl.querySelectorAll(":scope > li")[index]!;
  return item.querySelector(":scope > button") as HTMLButtonElement;
}

describe("rank genealogy panel（资料抽屉 · 族谱 tab）", () => {
  it("expands only the first grade by default and marks the schematic 品 mapping", () => {
    render(<RanksPage />);
    const section = screen.getByLabelText("品级族谱");

    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "true");
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "false");
    // 品级牌与未合并官名的品序回退都会显示「约当一品」。
    expect(genealogy().getAllByText("约当一品").length).toBeGreaterThanOrEqual(2);
    // 秦 万石：丞相、御史大夫（文）+ 太尉、国尉（武）。
    expect(genealogy().getByText("文官 · 2")).toBeInTheDocument();
    expect(genealogy().getByText("武官 · 2")).toBeInTheDocument();
    // 未展开的等级不渲染其官职
    expect(genealogy().queryByText("廷尉")).not.toBeInTheDocument();
  });

  it("opens one grade branch at a time", () => {
    render(<RanksPage />);
    const section = screen.getByLabelText("品级族谱");

    fireEvent.click(levelButton(section, 1));
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "true");
    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "false");
    // 秦 中二千石：七文官 + 一武官（卫尉）。
    expect(genealogy().getByText("文官 · 7")).toBeInTheDocument();

    // 再次点击收起
    fireEvent.click(levelButton(section, 1));
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "false");
  });

  it("expands the five-facet detail with figures under an office leaf", () => {
    render(<RanksPage />);

    const office = genealogy().getByRole("button", { name: /掌丞天子、助理万机/ });
    expect(office).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(office);
    expect(office).toHaveAttribute("aria-expanded", "true");

    const card = genealogy().getByLabelText("丞相官职详情");
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(within(card).getByText("古今对应（参考）")).toBeInTheDocument();
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();
    expect(within(card).getByText("相关名臣 · 名将")).toBeInTheDocument();
    expect(within(card).getByText("王绾")).toBeInTheDocument();

    // 同时只展开一个官职详情
    fireEvent.click(genealogy().getByRole("button", { name: /掌全国武事/ }));
    expect(genealogy().queryByLabelText("丞相官职详情")).not.toBeInTheDocument();
    expect(genealogy().getByLabelText("太尉官职详情")).toBeInTheDocument();
  });

  it("follows the unified dynasty picker and resets the expansion state", () => {
    render(<RanksPage />);
    const section = screen.getByLabelText("品级族谱");

    fireEvent.click(levelButton(section, 1));
    fireEvent.click(genealogy().getByRole("button", { name: /最高司法长官/ }));
    expect(genealogy().getByLabelText("廷尉官职详情")).toBeInTheDocument();

    fireEvent.click(within(screen.getByLabelText("朝代选择")).getByRole("button", { name: "清" }));
    // 换朝即重置：回到默认展开第一级（清 = 超品），详情清空
    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "true");
    expect(genealogy().getAllByText("超品").length).toBeGreaterThan(0);
    expect(genealogy().queryByLabelText("廷尉官职详情")).not.toBeInTheDocument();
  });
});
