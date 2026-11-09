import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RanksPage } from "./ranks-page";

describe("<RanksPage />", () => {
  it("renders the header and the three comparison sections", () => {
    render(<RanksPage />);

    expect(screen.getByRole("heading", { level: 1, name: "品级纵横" })).toBeInTheDocument();
    expect(screen.getByText(/职官 · 品阶 · 朝代对照/)).toBeInTheDocument();
    for (const label of ["品级阶梯", "同职追踪", "同品断面"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/点选任一官职/)).toBeInTheDocument();
  });

  it("shows the qin ladder by default with its schematic 品 mapping", () => {
    render(<RanksPage />);

    const ladder = screen.getByLabelText("品级阶梯");
    expect(within(ladder).getByRole("heading", { level: 3, name: "秦" })).toBeInTheDocument();
    expect(within(ladder).getByRole("button", { name: /百官之长，助理万机/ })).toBeInTheDocument();
    expect(within(ladder).getAllByText(/约当/).length).toBeGreaterThan(0);
  });

  it("opens the four-facet detail card when an office is clicked", () => {
    render(<RanksPage />);

    fireEvent.click(screen.getByRole("button", { name: /百官之长，助理万机/ }));

    const card = screen.getByLabelText("官职详情");
    expect(within(card).getByText("职能")).toBeInTheDocument();
    expect(within(card).getByText("实态 · 沿革")).toBeInTheDocument();
    expect(within(card).getByText("古今对应（参考）")).toBeInTheDocument();
    expect(within(card).getByText(/李斯由廷尉进位丞相/)).toBeInTheDocument();
  });

  it("omits absent facets in the detail card", () => {
    render(<RanksPage />);

    fireEvent.click(screen.getByRole("button", { name: /亭长/ }));

    const card = screen.getByLabelText("官职详情");
    expect(within(card).getByText(/十里一亭/)).toBeInTheDocument();
    expect(within(card).queryByText("秩俸")).not.toBeInTheDocument();
  });

  it("switches the ladder dynasty", () => {
    render(<RanksPage />);

    fireEvent.click(
      within(screen.getByLabelText("阶梯朝代选择")).getByRole("button", { name: "明" }),
    );

    const ladder = screen.getByLabelText("品级阶梯");
    expect(within(ladder).getByRole("heading", { level: 3, name: "明" })).toBeInTheDocument();
    expect(within(ladder).getByRole("button", { name: /殿阁大学士掌票拟/ })).toBeInTheDocument();
    expect(within(ladder).getAllByText(/正一品/).length).toBeGreaterThan(0);
  });

  it("compares two dynasties side by side and disables the main one in the compare picker", () => {
    render(<RanksPage />);

    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));

    const ladder = screen.getByLabelText("品级阶梯");
    expect(within(ladder).getByRole("heading", { level: 3, name: "秦" })).toBeInTheDocument();
    expect(within(ladder).getByRole("heading", { level: 3, name: "清" })).toBeInTheDocument();
    expect(within(ladder).getByText("军机大臣")).toBeInTheDocument();
    expect(within(ladder).getByText("超品")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("对比朝代选择")).getByRole("button", { name: "秦" }),
    ).toBeDisabled();
  });

  it("keeps the two ladder columns apart when the main dynasty reaches the compare one", () => {
    render(<RanksPage />);

    fireEvent.click(screen.getByRole("button", { name: "朝代对比" }));
    fireEvent.click(
      within(screen.getByLabelText("阶梯朝代选择")).getByRole("button", { name: "清" }),
    );

    const ladder = screen.getByLabelText("品级阶梯");
    // 对比列自动顺延到下一位（清 → 秦），两列不重合
    expect(within(ladder).getByRole("heading", { level: 3, name: "清" })).toBeInTheDocument();
    expect(within(ladder).getByRole("heading", { level: 3, name: "秦" })).toBeInTheDocument();
  });

  it("renders six tracks with all eight dynasty stops", () => {
    render(<RanksPage />);

    const section = screen.getByLabelText("同职追踪");
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(6);
    expect(within(section).getByText("宰辅 · 百官之长")).toBeInTheDocument();
    for (const name of ["秦", "汉", "魏晋南北朝", "隋唐", "宋", "元", "明", "清"]) {
      expect(within(section).getAllByText(name)).toHaveLength(6);
    }
    expect(within(section).getByText(/票拟须批红而后行/)).toBeInTheDocument();
  });

  it("compares the same grade across dynasties with a picker", () => {
    render(<RanksPage />);

    const section = screen.getByLabelText("同品断面");
    const picker = within(screen.getByLabelText("品序选择"));
    expect(picker.getAllByRole("button")).toHaveLength(9);

    // 默认一品：清列在军机大臣；秦列带「约当」示意标记
    expect(within(section).getAllByText("军机大臣").length).toBeGreaterThan(0);
    expect(within(section).getAllByText("约当").length).toBeGreaterThan(0);

    fireEvent.click(picker.getByRole("button", { name: "三品" }));
    expect(within(section).getAllByText("六部尚书").length).toBeGreaterThan(0);

    fireEvent.click(picker.getByRole("button", { name: "四品" }));
    // 秦行秩石无四品设官、元无此带设官
    expect(within(section).getAllByText("本级无设官").length).toBeGreaterThan(0);
  });

  it("marks qin/han grade matches as approximate", () => {
    render(<RanksPage />);

    const section = screen.getByLabelText("同品断面");
    fireEvent.click(
      within(screen.getByLabelText("品序选择")).getByRole("button", { name: "五品" }),
    );

    // 秦、汉以秩石约当五品的县级长官对照出现
    expect(within(section).getAllByText("县令 · 县长")).toHaveLength(2);
    expect(within(section).getAllByText("约当").length).toBeGreaterThan(0);
  });
});
