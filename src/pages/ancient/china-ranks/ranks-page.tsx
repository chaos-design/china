import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import type { OfficialPost, OfficialsDynasty } from "../china-officials/officials-data";
import { countPosts, getOfficialsDynasty } from "../china-officials/officials-data";
import { DynastyChips } from "./dynasty-chips";
import type { OfficeDetail } from "./office-detail-card";
import { rankOfficeDetail } from "./office-detail-card";
import { getRankDynasty, nextDynastyId } from "./rank-data";
import {
  findComparableGrade,
  formatBandLabel,
  layoutRankTree,
  type RankTreeSpan,
  type RankTreeSplit,
  type RankTreeTier,
} from "./rank-tree-layout";
import {
  createRankTreeScene,
  type RankTreeCameraPreset,
  type RankTreeHover,
  type RankTreePick,
  type RankTreeScene,
  readRankTreeColors,
} from "./rank-tree-scene";
import { RanksDrawer, type RanksDrawerTab } from "./ranks-drawer";
import { OptionPill } from "./ranks-option-pill";
import type { RankDynastyId } from "./types";

const SPAN_OPTIONS: readonly { id: RankTreeSpan; hint: string; label: string }[] = [
  { id: "band", hint: "按品序对齐，两朝同一高度即同一品", label: "品序对齐" },
  { id: "even", hint: "每级等距，看这一朝自己的层级结构", label: "层级等距" },
];

const SPLIT_OPTIONS: readonly { id: RankTreeSplit; hint: string; label: string }[] = [
  { id: "branch", hint: "皇权分出文武两大枝，文官居左、武官居右", label: "文武分列" },
  { id: "merged", hint: "文武同环，按数据顺序排布", label: "合列" },
];

const PRESET_OPTIONS: readonly { id: RankTreeCameraPreset; label: string }[] = [
  { id: "three-quarter", label: "斜侧" },
  { id: "front", label: "正视" },
];

/** 3D 树官职 pick → 共享详情卡视图模型（品序取 grade.label，秦汉补 approx）。 */
function rankTreePickDetail(pick: RankTreePick): OfficeDetail | null {
  if (pick.kind !== "office") {
    return null;
  }
  const dynasty = getOfficialsDynasty(pick.dynastyId);
  const grade = dynasty?.grades[pick.gradeIndex];
  const post = grade?.posts.find((candidate) => candidate.title === pick.officeTitle);
  if (!dynasty || !grade || !post) {
    return null;
  }
  return {
    title: post.title,
    dynastyName: dynasty.name,
    rank: post.rank ?? (grade.approx ? `${grade.label} · ${grade.approx}` : grade.label),
    duty: post.intro,
    salary: post.salary,
    note: post.note,
    modern: post.modern,
    figures: post.figures,
  };
}

/**
 * 品级纵横：八朝官位品级对比的**单屏沉浸页**。
 *
 * 布局参照 /china/timeline：页面根 `h-full overflow-hidden` 铺满 main（definite 高度）
 * 的可视区域，整页永不滚动；Three.js 画布 `absolute inset-0` 全幅垫底，所有 UI 都是
 * 画布上方的悬浮面板：
 * - 顶部条：页题（左）+「品级资料」开关（右）+ 居中工具条
 *   （分列 / 层高 / 视角 / 自动旋转 / 重置）；
 * - 左下筛选面板：朝代选择 + 双朝并置 + 文武图例（可收起）；
 * - 底部居中：`pointer-events-none` 的 hover 读出 / 聚焦提示；
 * - 右侧滑入抽屉（`ranks-drawer.tsx`，默认打开，顶条「品级资料」按钮切换开合）：树 / 族谱 /
 *   阶梯 / 追踪 / 断面五个 tab，即旧版四个滚动 section 的全部数据口径，纵排进 420px 抽屉宽度。
 * 画布取景随全幅容器（场景 ResizeObserver 自适应）；面板是小块玻璃卡浮在角落，
 * 与 timeline 的 #cv + 悬浮面板同一模式。勿改回「舞台 + 下方滚动 section」的结构。
 */
export function RanksPage() {
  // —— 单一状态源：朝代 / 对比 / 品序断面 / 共享详情 ——
  const [dynastyId, setDynastyId] = useState<RankDynastyId>("qin");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareId, setCompareId] = useState<RankDynastyId>("qing");
  const [selection, setSelection] = useState<OfficeDetail | null>(null);

  // —— 3D 树舞台状态（场景接口 + 取景参数）——
  const [span, setSpan] = useState<RankTreeSpan>("band");
  const [split, setSplit] = useState<RankTreeSplit>("branch");
  const [focusBand, setFocusBand] = useState(1);
  const [selected, setSelected] = useState<RankTreePick | null>(null);
  const [hover, setHover] = useState<RankTreeHover | null>(null);
  const [preset, setPreset] = useState<RankTreeCameraPreset | null>("three-quarter");
  const [autoRotate, setAutoRotate] = useState(false);
  const [failed, setFailed] = useState(false);

  // —— 悬浮面板状态 ——
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<RanksDrawerTab>("tree");

  const mainDynasty = getOfficialsDynasty(dynastyId) ?? getOfficialsDynasty("qin")!;
  const effectiveCompareId = compareId === dynastyId ? nextDynastyId(dynastyId) : compareId;
  const compareDynasty = compareEnabled ? getOfficialsDynasty(effectiveCompareId) : undefined;
  const ladderCompareDynasty = compareEnabled ? getRankDynasty(effectiveCompareId) : undefined;

  const mainLayout = useMemo(
    () => layoutRankTree(mainDynasty, { span, split }),
    [mainDynasty, span, split],
  );
  const compareLayout = useMemo(
    () => (compareDynasty ? layoutRankTree(compareDynasty, { span, split }) : null),
    [compareDynasty, span, split],
  );

  const mainTier = mainLayout.tiers.find((tier) => tier.band === focusBand);
  const compareTier = compareLayout?.tiers.find((tier) => tier.band === focusBand);
  const focusLabel =
    mainTier?.grade.label ?? compareTier?.grade.label ?? formatBandLabel(focusBand);
  const mainTierIndex = mainTier?.gradeIndex ?? -1;
  const compareTierIndex = compareTier?.gradeIndex ?? -1;
  const compareTierDynastyId = compareDynasty?.id ?? null;

  const focusPicks = useMemo<{ compare: RankTreePick | null; main: RankTreePick | null }>(
    () => ({
      compare:
        compareTierDynastyId !== null && compareTierIndex >= 0
          ? {
              dynastyId: compareTierDynastyId,
              kind: "tier",
              gradeIndex: compareTierIndex,
            }
          : null,
      main:
        mainTierIndex >= 0
          ? { dynastyId: dynastyId, kind: "tier", gradeIndex: mainTierIndex }
          : null,
    }),
    [compareTierDynastyId, compareTierIndex, dynastyId, mainTierIndex],
  );

  // —— 场景生命周期（自 rank-tree-section 迁移，画布 host 现为全幅容器）——
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<RankTreeScene | null>(null);
  const onPickRef = useRef<(pick: RankTreePick | null) => void>(() => {});

  const handlePick = useCallback(
    (pick: RankTreePick | null) => {
      if (!pick) {
        setSelected(null);
        setSelection(null);
        return;
      }
      if (pick.kind === "office") {
        setSelected(pick);
        setSelection(rankTreePickDetail(pick));
      } else {
        setSelected(null);
        setSelection(null);
      }
      const layout = pick.dynastyId === dynastyId ? mainLayout : compareLayout;
      const tier = layout?.tiers.find((candidate) => candidate.gradeIndex === pick.gradeIndex);
      if (tier) {
        setFocusBand(tier.band);
      }
      // 仿 timeline：点选画布节点即滑出右侧资料面板。
      setDrawerOpen(true);
      setDrawerTab("tree");
    },
    [compareLayout, dynastyId, mainLayout],
  );

  useEffect(() => {
    onPickRef.current = handlePick;
  }, [handlePick]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const scene = createRankTreeScene(host, readRankTreeColors(host), {
      onHover: setHover,
      onPick: (pick) => {
        onPickRef.current(pick);
      },
      onUnavailable: () => {
        setFailed(true);
        setDrawerOpen(true);
        setDrawerTab("genealogy");
      },
    });
    if (!scene) {
      setFailed(true);
      setDrawerOpen(true);
      setDrawerTab("genealogy");
      return;
    }
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    const entries = [{ dynasty: mainDynasty, layout: mainLayout }];
    if (compareDynasty && compareLayout) {
      entries.push({ dynasty: compareDynasty, layout: compareLayout });
    }
    scene.setTrees(entries, { span });
  }, [compareDynasty, compareLayout, mainDynasty, mainLayout, span]);

  useEffect(() => {
    sceneRef.current?.setFocus(focusPicks.main, focusPicks.compare);
  }, [focusPicks]);

  useEffect(() => {
    sceneRef.current?.setSelection(selected);
  }, [selected]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const chooseMain = (id: RankDynastyId) => {
    const nextDynasty = getOfficialsDynasty(id);
    if (!nextDynasty) {
      return;
    }
    const fallback = findComparableGrade(nextDynasty, focusBand);
    setDynastyId(id);
    setSelected(null);
    setSelection(null);
    if (compareEnabled && compareId === id) {
      setCompareId(nextDynastyId(id));
    }
    if (fallback) {
      setFocusBand(fallback.band);
    }
  };

  const chooseCompare = (id: RankDynastyId) => {
    setCompareId(id);
    setSelection(null);
  };

  const toggleCompare = (enabled: boolean) => {
    setCompareEnabled(enabled);
    setSelection(null);
    if (enabled && compareId === dynastyId) {
      setCompareId(nextDynastyId(dynastyId));
    }
    if (!enabled) {
      const fallback = findComparableGrade(mainDynasty, focusBand);
      if (fallback) {
        setFocusBand(fallback.band);
      }
    }
  };

  const chooseSpan = (next: RankTreeSpan) => {
    setSpan(next);
    setPreset("three-quarter");
  };

  const applyPreset = (next: RankTreeCameraPreset) => {
    setPreset(next);
    setAutoRotate(false);
    sceneRef.current?.applyPreset(next);
  };

  const resetView = () => {
    setPreset("three-quarter");
    setAutoRotate(false);
    sceneRef.current?.resetView();
  };

  const selectTreeOffice = (
    dynasty: OfficialsDynasty,
    tier: RankTreeTier,
    office: OfficialPost,
  ) => {
    const pick: RankTreePick = {
      dynastyId: dynasty.id,
      kind: "office",
      gradeIndex: tier.gradeIndex,
      officeTitle: office.title,
    };
    setSelected(pick);
    setSelection(rankTreePickDetail(pick));
    setFocusBand(tier.band);
    setHover(null);
    sceneRef.current?.focusTier(dynasty.id, tier.gradeIndex);
  };

  const focusTierChip = (tier: RankTreeTier) => {
    setSelected(null);
    setSelection(null);
    setFocusBand(tier.band);
    sceneRef.current?.focusTier(dynastyId, tier.gradeIndex);
  };

  const officeCount = countPosts(mainDynasty);
  const compareOfficeCount = compareDynasty ? countPosts(compareDynasty) : 0;

  const toggleDrawer = () => {
    setDrawerOpen((previous) => !previous);
  };

  return (
    <article className="bg-paper relative h-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_38%,hsl(var(--ink)/0.07),transparent_68%)]">
      {/* 全幅画布宿主：场景 ResizeObserver 自适应容器，取景自动随全幅宽高比。 */}
      <div className="absolute inset-0 z-0">
        <div
          aria-label={`${mainDynasty.name}官品立体树：${mainDynasty.grades.length} 级、${officeCount} 个官职${
            compareDynasty ? `；与${compareDynasty.name}并置对照` : ""
          }。拖拽旋转、滚轮缩放、点击节点查看职权。`}
          className="h-full w-full"
          ref={hostRef}
          role="img"
        />
        {failed ? (
          <div className="absolute left-1/2 top-1/2 z-10 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink/15 bg-paper/95 p-5 text-center shadow-[0_18px_48px_hsl(var(--ink)/0.18)]">
            <p className="text-muted-foreground text-sm leading-relaxed">
              当前浏览器未能启用
              WebGL，立体树无法绘制。右侧「品级资料」抽屉的族谱、阶梯与断面仍可查看全部品级与职权。
            </p>
            <button
              className="mt-3 rounded-full border border-vermillion/35 bg-vermillion/10 px-3 py-1 font-body text-xs text-vermillion transition-colors hover:bg-vermillion/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                setDrawerOpen(true);
                setDrawerTab("genealogy");
              }}
              type="button"
            >
              打开「族谱」对照 →
            </button>
          </div>
        ) : null}
      </div>

      {/* 顶部条：页题（左）+「品级资料」开关（右）。工具条已并入
          左侧「对照 · 视图」面板——舞台中央不再有任何悬浮控件。
          整条 pointer-events-none，交互子元素各自重新开启。 */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-3 lg:inset-x-5 lg:top-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="font-brush text-3xl text-ink lg:text-4xl">品级纵横</h1>
            <span className="hidden rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-muted-foreground text-xs tracking-widest sm:inline">
              职官 · 品阶 · 朝代对照
            </span>
          </div>
          <p className="hidden max-w-[260px] text-muted-foreground text-xs leading-relaxed lg:block">
            一树看尽：品级如何从皇权长出官职
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <button
            aria-expanded={drawerOpen}
            className={cn(
              "rounded-full border px-3 py-1 font-body text-xs shadow-[0_8px_24px_hsl(var(--ink)/0.10)] backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              drawerOpen
                ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                : "border-ink/15 bg-paper/85 text-ink hover:border-vermillion/30",
            )}
            onClick={toggleDrawer}
            type="button"
          >
            品级资料
          </button>
        </div>
      </div>

      {/* 左侧「对照 · 视图」面板：朝代 / 双朝并置 / 图例 + 立体树视图控件
          （分列 / 层高 / 视角 / 自动旋转 / 重置），全部收进这一个可收起菜单，
          舞台中央与顶边不再有任何悬浮控件（timeline #filterbar 的对应物）。
          max-h 把展开高度钳在「不吞没画布中部」的上限，溢出内部滚动；
          收起后只剩一行，给不需要的用户让出整片画布。 */}
      <section
        aria-label="对照视图"
        className="absolute bottom-3 left-3 z-20 flex max-h-[calc(100%-1.5rem)] w-[min(360px,calc(100%-1.5rem))] flex-col gap-3 overflow-y-auto rounded-2xl border border-ink/15 bg-paper/85 p-4 shadow-[0_18px_48px_hsl(var(--ink)/0.14)] backdrop-blur-xl lg:bottom-5 lg:left-5 lg:w-[360px]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            对照 · 视图
          </span>
          <button
            aria-expanded={!filterCollapsed}
            className="rounded-full border border-ink/15 bg-card/70 px-2.5 py-0.5 font-body text-[0.7rem] text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              setFilterCollapsed((previous) => !previous);
            }}
            type="button"
          >
            {filterCollapsed ? "展开" : "收起"}
          </button>
        </div>

        {!filterCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <DynastyChips ariaLabel="朝代选择" currentId={dynastyId} onSelect={chooseMain} />
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
                {mainDynasty.grades.length} 级 · {officeCount} 官
                {compareDynasty
                  ? ` / ${compareDynasty.name} ${compareDynasty.grades.length} 级 · ${compareOfficeCount} 官`
                  : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <fieldset
                aria-label="双朝并置"
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                  双朝并置
                </span>
                <div className="flex gap-2">
                  <OptionPill
                    active={!compareEnabled}
                    label="单朝"
                    onSelect={() => {
                      toggleCompare(false);
                    }}
                  />
                  <OptionPill
                    active={compareEnabled}
                    label="朝代对比"
                    onSelect={() => {
                      toggleCompare(true);
                    }}
                  />
                </div>
              </fieldset>
              {compareEnabled ? (
                <DynastyChips
                  ariaLabel="对比朝代选择"
                  currentId={effectiveCompareId}
                  disabledId={dynastyId}
                  onSelect={chooseCompare}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5 border-ink/10 border-t pt-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-vermillion" />
                  文官
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blueprint" />
                  武官
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-px w-3 bg-ink/40" />
                  双枝 · 品级台
                </span>
              </div>
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em]">
                {span === "band" ? "品序轴 · 超品↓流外" : "层级轴 · 等距"} ·{" "}
                {split === "branch" ? "文武分列" : "文武合列"}
              </span>
            </div>

            {/* 立体树视图控件（原顶置工具条并入此菜单）：分列 / 层高 / 视角。 */}
            <div className="flex flex-col gap-2.5 border-ink/10 border-t pt-2.5">
              <fieldset
                aria-label="分列模式"
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                  分列
                </span>
                <div className="flex flex-wrap gap-2">
                  {SPLIT_OPTIONS.map((option) => (
                    <OptionPill
                      active={split === option.id}
                      hint={option.hint}
                      key={option.id}
                      label={option.label}
                      onSelect={() => {
                        setSplit(option.id);
                      }}
                    />
                  ))}
                </div>
              </fieldset>
              <fieldset
                aria-label="层高模式"
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                  层高
                </span>
                <div className="flex flex-wrap gap-2">
                  {SPAN_OPTIONS.map((option) => (
                    <OptionPill
                      active={span === option.id}
                      hint={option.hint}
                      key={option.id}
                      label={option.label}
                      onSelect={() => {
                        chooseSpan(option.id);
                      }}
                    />
                  ))}
                </div>
              </fieldset>
              <fieldset
                aria-label="视角预设"
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                  视角
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_OPTIONS.map((option) => (
                    <OptionPill
                      active={preset === option.id}
                      key={option.id}
                      label={option.label}
                      onSelect={() => {
                        applyPreset(option.id);
                      }}
                    />
                  ))}
                  <OptionPill
                    active={autoRotate}
                    label={autoRotate ? "停止旋转" : "自动旋转"}
                    onSelect={() => {
                      setAutoRotate((previous) => !previous);
                      setPreset(null);
                    }}
                  />
                  <OptionPill active={false} label="重置视角" onSelect={resetView} />
                </div>
              </fieldset>
            </div>
          </div>
        ) : null}
      </section>

      {/* 底部居中读出：hover 信息 / 聚焦提示。pointer-events-none，不挡画布拖拽。 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 hidden justify-center lg:bottom-5 lg:flex">
        {hover ? (
          <div className="rounded-xl border border-ink/10 bg-paper/85 px-4 py-2.5 text-center shadow-[0_12px_32px_hsl(var(--ink)/0.12)] backdrop-blur-md">
            <div className="flex flex-wrap items-baseline justify-center gap-x-2">
              <span className="font-brush text-xl text-ink">{hover.title}</span>
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.06em]">
                {hover.subtitle}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {hover.detail}
            </p>
          </div>
        ) : (
          <span className="rounded-full border border-ink/10 bg-paper/85 px-4 py-1.5 font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em] backdrop-blur-md">
            聚焦 {focusLabel}
            {compareDynasty ? ` · ${mainDynasty.name} / ${compareDynasty.name}` : ""} · 拖拽旋转
            滚轮缩放 点选节点
          </span>
        )}
      </div>

      {/* 右侧资料抽屉：旧版四个滚动 section 的全部数据口径，纵排进 420px 抽屉。 */}
      <RanksDrawer
        compareDynasty={compareDynasty}
        compareTier={compareTier}
        ladderCompareDynasty={ladderCompareDynasty}
        compareEnabled={compareEnabled}
        compareId={effectiveCompareId}
        dynastyId={dynastyId}
        focusBand={focusBand}
        focusLabel={focusLabel}
        mainDynasty={mainDynasty}
        mainLayout={mainLayout}
        mainTier={mainTier}
        open={drawerOpen}
        onSelectLadderOffice={(office, level, dynasty) => {
          setSelection(rankOfficeDetail(dynasty, level, office));
        }}
        onSelectTreeOffice={selectTreeOffice}
        onTabChange={setDrawerTab}
        onClose={() => {
          setDrawerOpen(false);
        }}
        onCompareChange={chooseCompare}
        onTierFocus={focusTierChip}
        onToggleCompare={toggleCompare}
        selected={selected}
        selection={selection}
        tab={drawerTab}
      />
    </article>
  );
}
