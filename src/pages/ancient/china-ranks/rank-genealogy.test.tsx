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

  it("can keep multiple grade branches open at once", () => {
    render(<RanksPage />);
    const section = screen.getByLabelText("品级族谱");

    fireEvent.click(levelButton(section, 1));
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "true");
    // 多级可同时展开：第一级不被收起
    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "true");
    // 秦 中二千石：七文官 + 一武官（卫尉）。
    expect(genealogy().getByText("文官 · 7")).toBeInTheDocument();

    // 再次点击收起该级，其余级不受影响
    fireEvent.click(levelButton(section, 1));
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "false");
    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "true");
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

    // 多个官职详情可同时展开：点太尉后丞相详情仍在
    fireEvent.click(genealogy().getByRole("button", { name: /掌全国武事/ }));
    expect(genealogy().getByLabelText("丞相官职详情")).toBeInTheDocument();
    expect(genealogy().getByLabelText("太尉官职详情")).toBeInTheDocument();
  });

  it("expand-all opens every grade and office, collapse-all closes them", () => {
    render(<RanksPage />);
    const section = screen.getByLabelText("品级族谱");

    fireEvent.click(within(section).getByRole("button", { name: "全部展开" }));
    // 全部品级展开；默认第一级之外也都展开
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "true");
    expect(genealogy().getByText("已全展开")).toBeInTheDocument();
    // 官职详情随「全部展开」一并打开（秦万石 · 丞相）
    expect(genealogy().getByLabelText("丞相官职详情")).toBeInTheDocument();

    fireEvent.click(within(section).getByRole("button", { name: "收起全部" }));
    expect(levelButton(section, 0)).toHaveAttribute("aria-expanded", "false");
    expect(levelButton(section, 1)).toHaveAttribute("aria-expanded", "false");
    expect(genealogy().queryByLabelText("丞相官职详情")).not.toBeInTheDocument();
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
