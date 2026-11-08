import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AtlasExplorer } from "./atlas-explorer";
import { getAtlasFocus, regionOfPoints } from "./atlas-focus";
import { ATLAS_ITEMS, ATLAS_LAYER_OPTIONS, ATLAS_VIEW, type AtlasLayerId } from "./atlas-items";
import { ATLAS_TOPIC_COLOR, FLOW_DOTS } from "./atlas-map";
import { getDynastyOutline } from "./dynasty-overlay";
import { DYNASTY_TERRITORIES, getDynastyTerritory } from "./dynasty-territories";
import { FRONTIER_POLICIES } from "./frontier-policies";
import { MIGRATION_EVENTS } from "./migration-events";
import { projectMigration } from "./migration-projection";
import { TERRITORY_SNAPSHOTS } from "./territory-snapshots";

function renderExplorer(initialLayer?: AtlasLayerId) {
  const result = render(
    <MemoryRouter>
      <AtlasExplorer initialLayer={initialLayer} />
    </MemoryRouter>,
  );
  return { ...result, map: () => result.container.querySelector('svg[role="img"]') };
}

/** 铺平后的一级菜单：点专题标题即切换图层，不再有下拉选择器。 */
function switchTo(label: string) {
  const option = ATLAS_LAYER_OPTIONS.find((candidate) => candidate.label === label);
  if (!option) throw new Error(`未知图层：${label}`);
  const header = screen.getByRole("button", { name: label });
  if (header.getAttribute("aria-expanded") === "true" && option.id === "all") {
    // 已经是当前专题时标题只负责折叠，这里先收起再重新展开以模拟重复点击
    fireEvent.click(header);
    fireEvent.click(header);
    return;
  }
  fireEvent.click(header);
}

/** SVG 在 Testing Library 的 within() 里按 HTMLElement 处理，这里只做查询用途。 */
function svgWithin(svg: Element | null) {
  return within(svg as unknown as HTMLElement);
}

describe("<AtlasExplorer /> 统一功能页", () => {
  it("顶部只留一张菜单：四个专题铺平、三个专题不再收进选择器", () => {
    const { map } = renderExplorer();

    expect(screen.getByRole("heading", { level: 1, name: "历史地理图谱" })).toBeInTheDocument();
    expect(screen.getByText("三谱同图 · 汉唐宋元")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "专题图层" })).not.toBeInTheDocument();
    for (const { label } of ATLAS_LAYER_OPTIONS) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("complementary", { name: "图谱条目目录" })).toBeInTheDocument();
    expect(svgWithin(map()).getAllByRole("button")).toHaveLength(ATLAS_ITEMS.length);
  });

  it("条目右侧不再挂「迁徙 / 治所 / 快照」之类的类型标签", () => {
    renderExplorer();
    const aside = screen.getByRole("complementary", { name: "图谱条目目录" });
    for (const tag of ["迁徙", "治所", "快照"]) {
      expect(within(aside).queryByText(tag)).not.toBeInTheDocument();
    }
    // 名称仍全部在菜单里，只是不再带右侧类型文字
    expect(within(aside).getAllByRole("button").length).toBeGreaterThan(ATLAS_ITEMS.length);
  });

  it("每个专题是一节可折叠菜单，节内数据按朝代分组", () => {
    renderExplorer();
    const all = screen.getByRole("button", { name: "全部图谱" });
    const aside = screen.getByRole("complementary");
    expect(all).toHaveAttribute("aria-expanded", "true");
    expect(within(aside).getAllByText("汉").length).toBeGreaterThan(0);

    fireEvent.click(all);
    expect(all).toHaveAttribute("aria-expanded", "false");
    expect(within(aside).queryByRole("button", { name: /南越置郡/ })).not.toBeInTheDocument();

    fireEvent.click(all);
    expect(all).toHaveAttribute("aria-expanded", "true");
    expect(within(aside).getByRole("button", { name: /南越置郡/ })).toBeInTheDocument();

    switchTo("民族迁徙");
    expect(screen.getByRole("heading", { level: 1, name: "民族迁徙" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "民族迁徙" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(all).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "全部图谱" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("选中条目朱色高亮，并聚焦到条目所在地区；复位后回到全图", () => {
    const { map } = renderExplorer("frontier");
    const policy = FRONTIER_POLICIES[0]!;
    const svg = map();
    expect(svg?.getAttribute("data-zoom")).toBe("1");
    expect(svg?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);

    fireEvent.click(
      within(screen.getByRole("complementary", { name: "边疆制度目录" })).getByRole("button", {
        name: new RegExp(policy.institution),
      }),
    );

    const row = within(screen.getByRole("complementary", { name: "边疆制度目录" })).getByRole(
      "button",
      { name: new RegExp(policy.institution) },
    );
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(row.className).toContain("text-vermillion");
    expect(map()).toBe(svg);
    expect(Number(svg?.getAttribute("data-zoom"))).toBeGreaterThan(1);
    const focusedBox = svg?.getAttribute("viewBox");
    expect(focusedBox).not.toBe(ATLAS_VIEW.box);
    // 焦点中心 = viewBox 中心 = 可视区中心，视野完全按预期公式算出
    const expected = getAtlasFocus({
      maxZoom: 2.2,
      padding: 12,
      region: regionOfPoints([projectMigration(...policy.seat.ll)]),
    });
    expect(focusedBox).toBe(expected.box);
    const [x, y, width, height] = expected.box.split(" ").map(Number);
    expect(expected.cx).toBeCloseTo(x! + width! / 2, 1);
    expect(expected.cy).toBeCloseTo(y! + height! / 2, 1);
    // 聚焦后视图说明卡给出朝代、都城与倍率
    expect(screen.getByRole("button", { name: "回到全览" })).toBeInTheDocument();
    expect(screen.getByText(/放大 \d/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "回到全览" }));
    expect(svg?.getAttribute("data-zoom")).toBe("1");
    expect(svg?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
  });

  it("底图恒为现今疆域，切换朝代叠加该朝疆域示意与都城、大城市标记", () => {
    const { map } = renderExplorer();
    expect(screen.getByText("底图 · 现今中国疆域")).toBeInTheDocument();
    expect(map()?.querySelector(".atlas-dynasty-area")).toBeNull();

    const chips = screen.getByRole("group", { name: "朝代切换" });
    fireEvent.click(within(chips).getByRole("button", { name: "唐" }));

    const tang = getDynastyTerritory("tang");
    expect(DYNASTY_TERRITORIES).toContain(tang);
    expect(map()?.querySelector(".atlas-dynasty-area")).not.toBeNull();
    expect(map()?.querySelectorAll(".atlas-city-label")).toHaveLength(tang.cities.length);
    expect(svgWithin(map()).getByText("长安 · 都城")).toBeInTheDocument();
    expect(screen.getByText(/唐 · 疆域示意（非实测边界）/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "唐 · 都城与主要城市" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`都城 · ${tang.capital}`)).length).toBeGreaterThan(0);
    for (const source of tang.sources) {
      expect(screen.getByText(`资料出处 · ${source}`)).toBeInTheDocument();
    }

    // 切换朝代自动把视野定位到该朝疆域范围，中心对齐可视区
    const { bounds } = getDynastyOutline(tang);
    const expected = getAtlasFocus({
      maxZoom: 1.8,
      padding: 9,
      region: { x0: bounds.x0, x1: bounds.x1, y0: bounds.y0, y1: bounds.y1 },
    });
    expect(map()?.getAttribute("viewBox")).toBe(expected.box);
    expect(Number(map()?.getAttribute("data-zoom"))).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "回到全览" })).toBeInTheDocument();

    fireEvent.click(within(chips).getByRole("button", { name: "全部朝代" }));
    expect(map()?.querySelector(".atlas-dynasty-area")).toBeNull();
    expect(map()?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
    expect(screen.getByText(/全览模式：六幅疆域快照/)).toBeInTheDocument();
  });

  it("切换全部与单项时不重挂载地图：同一 SVG、同一底图节点", () => {
    const { map } = renderExplorer();
    const svg = map();
    expect(svg).not.toBeNull();
    const firstBasemapPath = svg?.querySelector("path");
    const basemapCount = svg?.querySelectorAll("path").length;
    expect(svg?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);

    switchTo("民族迁徙");
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
    expect(svg?.querySelector("path")).toBe(firstBasemapPath);

    // 选中条目换的是 viewBox（中心对齐），不是重挂载 SVG 或底图
    fireEvent.click(
      within(screen.getByRole("complementary")).getByRole("button", {
        name: new RegExp(MIGRATION_EVENTS[1]!.group),
      }),
    );
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).not.toBe(ATLAS_VIEW.box);
    expect(svg?.querySelector("path")).toBe(firstBasemapPath);

    switchTo("全部图谱");
    expect(map()).toBe(svg);
    expect(svg?.getAttribute("viewBox")).toBe(ATLAS_VIEW.box);
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

  it("疆域图层保留时间轴，点年份可聚焦断面并叠加当朝疆域", () => {
    renderExplorer("territory");
    expect(screen.getByRole("list", { name: "疆域快照时间轴" })).toBeInTheDocument();
    const last = TERRITORY_SNAPSHOTS[TERRITORY_SNAPSHOTS.length - 1]!;
    fireEvent.click(screen.getByRole("button", { name: `${last.year}` }));
    expect(screen.getByText(last.description)).toBeInTheDocument();
    expect(screen.getByText(`都城 · ${last.capital.name}`)).toBeInTheDocument();
    expect(screen.getByText(/元 · 疆域示意（非实测边界）/)).toBeInTheDocument();
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
