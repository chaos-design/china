import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { DYNASTY_ATLASES } from "./data";
import { QingOfficialsPage } from "./qing-officials-page";

function renderAt(entry = "/china/qing-officials") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <QingOfficialsPage />
    </MemoryRouter>,
  );
}

describe("<QingOfficialsPage /> — 朝代数据驱动", () => {
  it("renders the Qing chart by default with the full branch set", () => {
    renderAt();

    expect(screen.getByRole("heading", { level: 1, name: "官制图谱" })).toBeInTheDocument();
    expect(screen.getByText("皇帝")).toBeInTheDocument();
    for (const title of ["中枢部", "佐理部", "帝室部", "行省", "藩部", "府州县"]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it("lists all eight dynasties and switches the atlas content", () => {
    renderAt();

    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getAllByRole("button")).toHaveLength(8);
    expect(within(picker).getByRole("button", { name: "清" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(picker).getByRole("button", { name: "汉" }));
    expect(within(picker).getByRole("button", { name: "汉" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/秩石十六等/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "军机处" })).toBeNull();
  });

  it.each(
    DYNASTY_ATLASES.map((atlas) => [atlas.id, atlas.name] as const),
  )("loads dynasty %s (%s) from the URL", (id, name) => {
    renderAt(`/china/qing-officials?dynasty=${id}`);
    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 1, name: "官制图谱" })).toBeInTheDocument();
    expect(screen.getByText("皇帝")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  it("falls back to Qing with a notice for an unknown dynasty", () => {
    renderAt("/china/qing-officials?dynasty=not-a-dynasty");

    expect(screen.getByText(/未收录该朝代/)).toBeInTheDocument();
    const picker = screen.getByLabelText("朝代选择");
    expect(within(picker).getByRole("button", { name: "清" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("expands a tree node to reveal its subordinate offices", () => {
    renderAt();

    const sixBoards = screen.getByRole("button", { name: /六部/ });
    expect(sixBoards).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(sixBoards);
    expect(sixBoards).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("吏部").length).toBeGreaterThan(0);
    expect(screen.getAllByText("工部").length).toBeGreaterThan(0);
  });

  it("links the ladder to the detail card in the rank view", () => {
    renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));

    const ladder = screen.getByLabelText("品级阶梯");
    const fifth = within(ladder)
      .getAllByRole("button", { name: /正五品/ })
      .find((button) => button.getAttribute("aria-pressed") !== null)!;
    fireEvent.click(fifth);
    expect(fifth).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("水晶顶");
    expect(screen.getByLabelText("正五品档案")).toHaveTextContent("绿色");
  });

  it("shows badges for Qing and an explanatory note for dynasties without them", () => {
    const { unmount } = renderAt();
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));
    expect(screen.getByLabelText("文官补子 · 飞禽")).toHaveTextContent("仙鹤");
    expect(screen.getByLabelText("武官补子 · 走兽")).toHaveTextContent("麒麟");
    unmount();

    renderAt("/china/qing-officials?dynasty=han");
    fireEvent.click(screen.getByRole("tab", { name: "品级礼制" }));
    expect(screen.queryByLabelText("文官补子 · 飞禽")).toBeNull();
    expect(screen.getByLabelText("补子制度")).toHaveTextContent("补子尚未出现");
  });
});
