import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AtlasExplorer } from "./atlas-explorer";
import { ATLAS_ITEMS, ATLAS_LAYER_OPTIONS, ATLAS_VIEW, type AtlasLayerId } from "./atlas-items";
import { ATLAS_TOPIC_COLOR, FLOW_DOTS } from "./atlas-map";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { MIGRATION_EVENTS } from "./migration-events";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";

function renderExplorer(initialLayer?: AtlasLayerId) {
  const result = render(
    <MemoryRouter>
      <AtlasExplorer initialLayer={initialLayer} />
    </MemoryRouter>,
  );
  return { ...result, map: () => result.container.querySelector('svg[role="img"]') };
}

function switchTo(label: string) {
  const nav = screen.getByRole("navigation", { name: "图谱导航" });
  if (label === "全部图谱") {
    fireEvent.click(within(nav).getByRole("button", { name: "全部图谱" }));
    return;
  }
  const option = ATLAS_LAYER_OPTIONS.find((candidate) => candidate.label === label);
  if (!option) throw new Error(`未知图层：${label}`);
  fireEvent.change(within(nav).getByRole("combobox", { name: "专题图层" }), {
    target: { value: option.id },
  });
}

/** SVG 在 Testing Library 的 within() 里按 HTMLElement 处理，这里只做查询用途。 */
function svgWithin(svg: Element | null) {
  return within(svg as unknown as HTMLElement);
}

describe("<AtlasExplorer /> 统一功能页", () => {
  it("图谱导航只留「全部图谱」与「专题图层」，三个专题收进选择器", () => {
    const { map } = renderExplorer();

    expect(screen.getByRole("heading", { level: 1, name: "疆域与民族图谱" })).toBeInTheDocument();
    expect(screen.getByText("三谱同图 · 汉唐宋元")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "图谱导航" });
    expect(within(nav).getByRole("button", { name: "全部图谱" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const picker = within(nav).getByRole("combobox", { name: "专题图层" }) as HTMLSelectElement;
    expect(picker.value).toBe("");
    // 一个占位「专题图层」+ 三个专题选项
    expect(within(picker).getAllByRole("option")).toHaveLength(ATLAS_LAYER_OPTIONS.length);
    expect(within(nav).queryByRole("button", { name: "民族迁徙" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "边疆治理" })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "图谱条目目录" })).toBeInTheDocument();
    expect(svgWithin(map()).getAllByRole("button")).toHaveLength(ATLAS_ITEMS.length);
  });

  it("切到专题后选择器回显当前专题，回到全部图谱时复位", () => {
    renderExplorer();
    const nav = screen.getByRole("navigation", { name: "图谱导航" });
    const picker = () => within(nav).getByRole("combobox", { name: "专题图层" });

    switchTo("民族迁徙");
    expect(picker()).toHaveValue("migration");
    expect(within(nav).getByRole("button", { name: "全部图谱" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    switchTo("全部图谱");
    expect(picker()).toHaveValue("");
    expect(within(nav).getByRole("button", { name: "全部图谱" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("切换全部与单项时不重挂载地图：同一 SVG、同一视野、同一底图节点", () => {
    const { map } = renderExplorer();
    const svg = map();
    expect(svg).not.toBeNull();
    const viewBox = svg?.getAttribute("viewBox");
    const firstBasemapPath = svg?.querySelector("path");
    const basemapCount = svg?.querySelectorAll("path").length;
    expect(viewBox).toBe(ATLAS_VIEW.box);

    switchTo("民族迁徙");
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).toBe(viewBox);
    expect(svg?.querySelector("path")).toBe(firstBasemapPath);

    // 单选某一条也不改视野，详情卡高度固定，地图因此不会跳动
    fireEvent.click(
      within(screen.getByRole("complementary")).getByRole("button", {
        name: new RegExp(MIGRATION_EVENTS[1]!.group),
      }),
    );
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).toBe(viewBox);

    switchTo("全部图谱");
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).toBe(viewBox);
    expect(svg?.querySelectorAll("path").length).toBeGreaterThanOrEqual(basemapCount ?? 0);
  });

  it("每条标注都带引导线，标签框按固定布局绘制在最上层", () => {
    const { map } = renderExplorer();
    const svg = map() as SVGSVGElement;
    const placements = ATLAS_ITEMS.length;
    expect(svg.querySelectorAll(".atlas-leader")).toHaveLength(placements);
    expect(svg.querySelectorAll(".atlas-label-box")).toHaveLength(placements);
    // 标签 g 全部在标图点 g 之后，不会被底图或路线盖住
    const labelGroups = Array.from(svg.querySelectorAll('g[role="button"]'));
    const lastLabel = labelGroups[labelGroups.length - 1];
    expect(lastLabel?.nextSibling).toBeNull();

    switchTo("疆域变迁");
    expect(svg.querySelectorAll(".atlas-leader")).toHaveLength(TERRITORY_SNAPSHOTS.length);
    switchTo("边疆治理");
    expect(svg.querySelectorAll(".atlas-leader")).toHaveLength(FRONTIER_POLICIES.length);
  });

  it("悬停 / 键盘聚焦展开详情，内容逐字取自史料数据", () => {
    const { map } = renderExplorer();
    const snapshot = TERRITORY_SNAPSHOTS[1]!;
    const label = svgWithin(map()).getByRole("button", {
      name: `地图标注 · ${snapshot.label}`,
    });

    fireEvent.mouseEnter(label);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent(snapshot.description);
    expect(tooltip).toHaveTextContent(`都城 · ${snapshot.capital.name}`);
    for (const source of snapshot.sources) {
      expect(tooltip).toHaveTextContent(source);
    }
    fireEvent.mouseLeave(label);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.focus(label);
    expect(screen.getByRole("tooltip")).toHaveTextContent(snapshot.description);
    fireEvent.keyDown(label, { key: "Enter" });
    expect(screen.getAllByText(snapshot.description).length).toBeGreaterThan(0);
  });

  it("点选标注把详情固定在下方，返回全览后回到提示", () => {
    const { map } = renderExplorer();
    const policy = FRONTIER_POLICIES[0]!;
    fireEvent.click(
      svgWithin(map()).getByRole("button", {
        name: `地图标注 · ${policy.institution}`,
      }),
    );

    expect(screen.getByText(policy.description)).toBeInTheDocument();
    expect(screen.getByText(`治所 · ${policy.seat.name}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全览 · 全部图谱" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "全览 · 全部图谱" }));
    expect(screen.queryByText(policy.description)).not.toBeInTheDocument();
    expect(screen.getByText(/全览模式：六幅疆域快照/)).toBeInTheDocument();
  });

  it("动画开关统一控制全部路线，且默认开启", () => {
    const { map } = renderExplorer();
    const toggle = screen.getByRole("button", { name: /动画 · / });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(map()?.querySelectorAll("animateMotion")).toHaveLength(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );

    fireEvent.click(toggle);
    expect(map()?.querySelectorAll("animateMotion")).toHaveLength(0);
    expect(map()?.querySelectorAll("animate")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /动画 · / }));
    expect(map()?.querySelectorAll("animateMotion")).toHaveLength(
      MIGRATION_EVENTS.length * FLOW_DOTS.length,
    );
  });

  it("切换图层会清掉选中项与悬停详情，不残留跨图层的浮层", () => {
    const { map } = renderExplorer();
    const route = MIGRATION_EVENTS[0]!;
    const label = svgWithin(map()).getByRole("button", {
      name: `地图标注 · ${route.group}`,
    });
    fireEvent.mouseEnter(label);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    switchTo("边疆治理");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByText(/全览模式：八项制度的治所与防御范围同步呈现/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全览 · 全部治所" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("疆域图层保留时间轴，点年份可聚焦单个断面", () => {
    renderExplorer("territory");
    expect(screen.getByRole("list", { name: "疆域快照时间轴" })).toBeInTheDocument();
    const last = TERRITORY_SNAPSHOTS[TERRITORY_SNAPSHOTS.length - 1]!;
    fireEvent.click(screen.getByRole("button", { name: `${last.year}` }));
    expect(screen.getByText(last.description)).toBeInTheDocument();
    expect(screen.getByText(`都城 · ${last.capital.name}`)).toBeInTheDocument();
  });

  it.each([
    ["migration", "民族迁徙", "首批八条路线 · 汉唐宋元", "迁徙路线目录"],
    ["frontier", "边疆治理", "首批八项制度 · 汉唐宋元", "边疆制度目录"],
  ] as const)("预设图层 %s 的页头与菜单保持原样", (layer, heading, badge, menuLabel) => {
    renderExplorer(layer);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: menuLabel })).toBeInTheDocument();
  });

  it("所有图层都不再出现「图层说明」，顶条恒为时间轴且高度不变", () => {
    const { map } = renderExplorer();
    const svg = map();
    const viewBox = svg?.getAttribute("viewBox");

    for (const label of ["全部图谱", "疆域变迁", "民族迁徙", "边疆治理"]) {
      switchTo(label);
      expect(screen.queryByText("图层说明")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "疆域快照时间轴" })).toBeInTheDocument();
      expect(screen.getByText("时间轴 · 疆域断面（前111 — 1330）")).toBeInTheDocument();
      expect(map()).toBe(svg);
      expect(svg?.getAttribute("viewBox")).toBe(viewBox);
    }
  });

  it("边疆图层补出防御范围示意环与史料可据的范围说明", () => {
    const { map } = renderExplorer("frontier");
    expect(map()?.querySelectorAll(".atlas-defense-ring")).toHaveLength(FRONTIER_POLICIES.length);
    expect(screen.getByText("防御范围（示意）")).toBeInTheDocument();

    const first = FRONTIER_POLICIES[0]!;
    fireEvent.click(
      within(screen.getByRole("complementary", { name: "边疆制度目录" })).getByRole("button", {
        name: new RegExp(first.institution),
      }),
    );
    expect(screen.getByText(`防御范围 · ${first.defenseScope}`)).toBeInTheDocument();
    expect(screen.getByText(first.description)).toBeInTheDocument();
  });

  it("图例按图层收敛：防御范围示意只在含边疆图层出现", () => {
    const { map } = renderExplorer();
    expect(screen.getByText("防御范围（示意）")).toBeInTheDocument();

    switchTo("民族迁徙");
    expect(screen.queryByText("防御范围（示意）")).not.toBeInTheDocument();
    expect(map()?.querySelectorAll(".atlas-defense-ring")).toHaveLength(0);

    switchTo("边疆治理");
    expect(screen.getByText("防御范围（示意）")).toBeInTheDocument();
    expect(map()?.querySelectorAll(".atlas-defense-ring")).toHaveLength(FRONTIER_POLICIES.length);
  });

  it("迁徙回到更亮的朱色，且颜色是固定常量", () => {
    const [, hue, saturation, lightness] =
      ATLAS_TOPIC_COLOR.migration.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/) ?? [];
    expect(Number(hue)).toBeLessThan(20);
    expect(Number(saturation)).toBeGreaterThan(70);
    expect(Number(lightness)).toBeGreaterThan(55);
    expect(ATLAS_TOPIC_COLOR.migration).not.toContain("blueprint");
  });
});
