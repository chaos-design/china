import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { DynastyChips } from "./dynasty-chips";
import type { SelectedOffice } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";
import { getRankDynasty, nextDynastyId } from "./rank-data";
import type { RankTreeSpan, RankTreeSplit, RankTreeTier } from "./rank-tree-layout";
import { findComparableTier, formatBandLabel, layoutRankTree } from "./rank-tree-layout";
import type {
  RankTreeCameraPreset,
  RankTreeHover,
  RankTreePick,
  RankTreeScene,
} from "./rank-tree-scene";
import { createRankTreeScene, readRankTreeColors } from "./rank-tree-scene";
import type { RankDynasty, RankDynastyId, RankOffice } from "./types";

const SPAN_OPTIONS: readonly { id: RankTreeSpan; hint: string; label: string }[] = [
  { id: "band", hint: "按品序对齐，两朝同一高度即同一品", label: "品序对齐" },
  { id: "even", hint: "每级等距，看这一朝自己的层级结构", label: "层级等距" },
];

const SPLIT_OPTIONS: readonly { id: RankTreeSplit; hint: string; label: string }[] = [
  { id: "merged", hint: "文武同环，按数据顺序排布", label: "合列" },
  { id: "branch", hint: "文官居左半环、武官居右半环", label: "文武分列" },
];

const PRESET_OPTIONS: readonly { id: RankTreeCameraPreset; label: string }[] = [
  { id: "three-quarter", label: "斜侧" },
  { id: "front", label: "正视" },
];

function countOffices(dynasty: RankDynasty): number {
  return dynasty.levels.reduce((total, level) => total + level.offices.length, 0);
}

function OptionPill({
  active,
  hint,
  label,
  onSelect,
}: {
  active: boolean;
  hint?: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
          : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30 hover:bg-vermillion/5",
      )}
      onClick={onSelect}
      title={hint}
      type="button"
    >
      {label}
    </button>
  );
}

function TierColumn({
  bandLabel,
  dynasty,
  selected,
  tier,
  onSelectOffice,
}: {
  bandLabel: string;
  dynasty: RankDynasty;
  onSelectOffice: (tier: RankTreeTier, office: RankOffice) => void;
  selected: RankTreePick | null;
  tier: RankTreeTier | undefined;
}) {
  return (
    <section
      aria-label={`${dynasty.name}本级职权`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink/12 bg-card/55 p-4"
    >
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h3 className="font-brush text-2xl text-ink">{dynasty.name}</h3>
        <span className="font-mono-tech text-[0.68rem] text-muted-foreground tracking-[0.12em]">
          {dynasty.period}
        </span>
        <span className="rounded-full border border-vermillion/25 bg-vermillion/10 px-2 py-0.5 font-body text-[0.68rem] text-vermillion">
          {dynasty.system}
        </span>
      </header>

      {tier ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono-tech text-vermillion text-xs tracking-[0.16em]">
              {tier.grade}
            </span>
            {tier.level.approxGrade !== undefined ? (
              <span className="rounded border border-dashed border-ochre px-1.5 font-body text-[0.68rem] text-ochre">
                约当{formatBandLabel(tier.band)}
              </span>
            ) : null}
            {tier.level.outOfRank === true ? (
              <span className="font-body text-[0.68rem] text-muted-foreground">品外</span>
            ) : null}
            <span className="font-mono-tech text-[0.68rem] text-muted-foreground">
              {tier.officeCount} 官 · 文 {tier.civilCount} / 武 {tier.militaryCount}
            </span>
          </div>
          <p className="font-mono-tech text-[0.65rem] text-muted-foreground tracking-[0.12em]">
            本级职权范围
          </p>
          <ul className="flex flex-col gap-1">
            {tier.level.offices.map((office) => {
              const active =
                selected?.kind === "office" &&
                selected.dynastyId === dynasty.id &&
                selected.levelIndex === tier.levelIndex &&
                selected.officeTitle === office.title;

              return (
                <li key={office.title}>
                  <button
                    aria-pressed={active}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-vermillion/20 hover:bg-vermillion/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active && "border-vermillion/25 bg-vermillion/10",
                    )}
                    onClick={() => {
                      onSelectOffice(tier, office);
                    }}
                    type="button"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full",
                          office.branch === "civil" ? "bg-vermillion" : "bg-blueprint",
                        )}
                      />
                      <span className="font-brush text-lg leading-snug text-ink">
                        {office.title}
                      </span>
                      <span className="font-mono-tech text-[0.65rem] text-muted-foreground tracking-[0.08em]">
                        {office.rank}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {office.duty}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          此朝在「{bandLabel}」无同品设官——品级体系不同，留白本身也是一种对照。
        </p>
      )}
    </section>
  );
}

export function RankTreeSection() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<RankTreeScene | null>(null);
  const [mainId, setMainId] = useState<RankDynastyId>("qin");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareId, setCompareId] = useState<RankDynastyId>("qing");
  const [span, setSpan] = useState<RankTreeSpan>("band");
  const [split, setSplit] = useState<RankTreeSplit>("merged");
  const [focusBand, setFocusBand] = useState(1);
  const [selected, setSelected] = useState<RankTreePick | null>(null);
  const [hover, setHover] = useState<RankTreeHover | null>(null);
  const [preset, setPreset] = useState<RankTreeCameraPreset | null>("three-quarter");
  const [autoRotate, setAutoRotate] = useState(false);
  const [failed, setFailed] = useState(false);

  const mainDynasty = getRankDynasty(mainId) ?? getRankDynasty("qin")!;
  const effectiveCompareId = compareId === mainId ? nextDynastyId(mainId) : compareId;
  const compareDynasty = compareEnabled ? getRankDynasty(effectiveCompareId) : undefined;

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
  const focusLabel = mainTier?.grade ?? compareTier?.grade ?? formatBandLabel(focusBand);
  const mainTierIndex = mainTier?.levelIndex ?? -1;
  const compareTierIndex = compareTier?.levelIndex ?? -1;
  const compareTierDynastyId = compareDynasty?.id ?? null;

  const focusPicks = useMemo<{ compare: RankTreePick | null; main: RankTreePick | null }>(
    () => ({
      compare:
        compareTierDynastyId !== null && compareTierIndex >= 0
          ? {
              dynastyId: compareTierDynastyId,
              kind: "tier",
              levelIndex: compareTierIndex,
            }
          : null,
      main:
        mainTierIndex >= 0 ? { dynastyId: mainId, kind: "tier", levelIndex: mainTierIndex } : null,
    }),
    [compareTierDynastyId, compareTierIndex, mainId, mainTierIndex],
  );

  const selectedOffice = useMemo<SelectedOffice | null>(() => {
    if (selected?.kind !== "office") {
      return null;
    }
    const dynasty = getRankDynasty(selected.dynastyId);
    const level = dynasty?.levels[selected.levelIndex];
    const office = level?.offices.find((candidate) => candidate.title === selected.officeTitle);
    if (!dynasty || !level || !office) {
      return null;
    }
    return { dynasty, level, office };
  }, [selected]);

  const onPickRef = useRef<(pick: RankTreePick | null) => void>(() => {});

  const handlePick = useCallback(
    (pick: RankTreePick | null) => {
      if (!pick) {
        setSelected(null);
        return;
      }
      if (pick.kind === "office") {
        setSelected(pick);
      } else {
        setSelected(null);
      }
      const layout = pick.dynastyId === mainId ? mainLayout : compareLayout;
      const tier = layout?.tiers.find((candidate) => candidate.levelIndex === pick.levelIndex);
      if (tier) {
        setFocusBand(tier.band);
      }
    },
    [compareLayout, mainId, mainLayout],
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
      },
    });
    if (!scene) {
      setFailed(true);
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
    const nextDynasty = getRankDynasty(id);
    if (!nextDynasty) {
      return;
    }
    const fallback = findComparableTier(nextDynasty, focusBand);
    setMainId(id);
    setSelected(null);
    if (compareEnabled && compareId === id) {
      setCompareId(nextDynastyId(id));
    }
    if (fallback) {
      setFocusBand(fallback.band);
    }
  };

  const chooseCompare = (id: RankDynastyId) => {
    setCompareId(id);
    setSelected(null);
  };

  const toggleCompare = (enabled: boolean) => {
    setCompareEnabled(enabled);
    setSelected(null);
    if (enabled && compareId === mainId) {
      setCompareId(nextDynastyId(mainId));
    }
    if (!enabled) {
      const fallback = findComparableTier(mainDynasty, focusBand);
      if (fallback) {
        setFocusBand(fallback.band);
      }
    }
  };

  const chooseSpan = (next: RankTreeSpan) => {
    setSpan(next);
    setPreset("three-quarter");
  };

  const chooseSplit = (next: RankTreeSplit) => {
    setSplit(next);
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

  const selectOffice = (dynasty: RankDynasty, tier: RankTreeTier, office: RankOffice) => {
    setSelected({
      dynastyId: dynasty.id,
      kind: "office",
      levelIndex: tier.levelIndex,
      officeTitle: office.title,
    });
    setFocusBand(tier.band);
    setHover(null);
    sceneRef.current?.focusTier(dynasty.id, tier.levelIndex);
  };

  const focusTierChip = (tier: RankTreeTier) => {
    setSelected(null);
    setFocusBand(tier.band);
    sceneRef.current?.focusTier(mainId, tier.levelIndex);
  };

  const officeCount = countOffices(mainDynasty);
  const compareOfficeCount = compareDynasty ? countOffices(compareDynasty) : 0;
  const detailCard = (
    <OfficeDetailCard
      ariaLabel="品级树详情"
      emptyHint="点选树上的官职节点或下方列表，查看该官的职权、秩俸与沿革。"
      selection={selectedOffice}
    />
  );

  return (
    <section aria-label="立体品级树" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">立体 · 品级树</span>
        <h2 className="font-brush text-3xl text-ink">一树看尽：品级如何从皇权长出官职</h2>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          每个朝代是一棵树：树干自皇权垂下，六棱平台是品级，枝头的朱点、蓝点是文武百官——点到哪一级，就看哪一级的职权范围。两朝并置、按品对齐后，同一高度就是同一品，留白即这一朝没有设官的品级。
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            树 · 朝代
          </span>
          <DynastyChips ariaLabel="树状朝代选择" currentId={mainId} onSelect={chooseMain} />
          <span className="font-mono-tech text-[0.68rem] text-muted-foreground">
            {mainDynasty.levels.length} 级 · {officeCount} 官
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            双朝并置
          </span>
          <fieldset aria-label="树状对比模式" className="flex gap-2">
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
          </fieldset>
          {compareEnabled && compareDynasty ? (
            <>
              <DynastyChips
                ariaLabel="树状对比朝代选择"
                currentId={effectiveCompareId}
                disabledId={mainId}
                onSelect={chooseCompare}
              />
              <span className="font-mono-tech text-[0.68rem] text-muted-foreground">
                {compareDynasty.levels.length} 级 · {compareOfficeCount} 官
              </span>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
              层高
            </span>
            <fieldset aria-label="层高模式" className="flex gap-2">
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
            </fieldset>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
              分列
            </span>
            <fieldset aria-label="分列模式" className="flex gap-2">
              {SPLIT_OPTIONS.map((option) => (
                <OptionPill
                  active={split === option.id}
                  hint={option.hint}
                  key={option.id}
                  label={option.label}
                  onSelect={() => {
                    chooseSplit(option.id);
                  }}
                />
              ))}
            </fieldset>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
              视角
            </span>
            <fieldset aria-label="视角预设" className="flex gap-2">
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
            </fieldset>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-ink/12 bg-[radial-gradient(ellipse_at_50%_38%,hsl(var(--ink)/0.07),transparent_68%)]">
        <div
          aria-label={`${mainDynasty.name}官品立体树：${mainDynasty.levels.length} 级、${officeCount} 个官职${
            compareDynasty ? `；与${compareDynasty.name}并置对照` : ""
          }。拖拽旋转、滚轮缩放、点击节点查看职权。`}
          className="relative h-[clamp(420px,62vh,640px)] w-full"
          ref={hostRef}
          role="img"
        />

        {failed ? (
          <div className="absolute inset-0 grid place-items-center bg-paper/85 p-6 text-center">
            <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
              当前浏览器未能启用
              WebGL，立体树无法绘制。下方的「品级阶梯」与「同品断面」仍可查看全部品级与职权。
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-ink/10 border-t bg-paper/45 px-3 py-2.5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
            <div className="min-w-0 flex-1">
              {hover ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-brush text-xl text-ink">{hover.title}</span>
                    <span className="font-mono-tech text-[0.65rem] text-muted-foreground tracking-[0.06em]">
                      {hover.subtitle}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                    {hover.detail}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  拖拽旋转 · 滚轮缩放 · 点击平台或官职查看本级职权
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] text-muted-foreground">
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
                品级 · 从属
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono-tech text-[0.65rem] text-muted-foreground tracking-[0.08em]">
              {span === "band" ? "品序轴 · 超品↓流外" : "层级轴 · 等距"} ·{" "}
              {split === "branch" ? "文武分列" : "文武合列"}
            </span>
            <span className="rounded-full border border-vermillion/25 bg-vermillion/10 px-2.5 py-1 font-body text-[0.68rem] text-vermillion">
              聚焦 {formatBandLabel(focusBand)}
              {compareDynasty ? ` · ${mainDynasty.name} / ${compareDynasty.name}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
              品级 · 职权
            </span>
            <p className="text-muted-foreground text-xs leading-relaxed">
              选一级，展开这一级所有官职的职权范围；点官职看秩俸与沿革。
            </p>
          </div>
          <fieldset aria-label="树状品级选择" className="flex flex-wrap gap-1.5">
            {mainLayout.tiers.map((tier) => (
              <button
                aria-pressed={tier.band === focusBand}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  tier.band === focusBand
                    ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                    : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30 hover:text-ink",
                )}
                key={`${tier.levelIndex}-${tier.grade}`}
                onClick={() => {
                  focusTierChip(tier);
                }}
                type="button"
              >
                {tier.grade}
              </button>
            ))}
          </fieldset>
        </div>

        <div
          className={cn(
            "grid items-start gap-4",
            compareDynasty ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
          )}
        >
          <TierColumn
            bandLabel={focusLabel}
            dynasty={mainDynasty}
            onSelectOffice={(tier, office) => {
              selectOffice(mainDynasty, tier, office);
            }}
            selected={selected}
            tier={mainTier}
          />
          {compareDynasty ? (
            <TierColumn
              bandLabel={focusLabel}
              dynasty={compareDynasty}
              onSelectOffice={(tier, office) => {
                selectOffice(compareDynasty, tier, office);
              }}
              selected={selected}
              tier={compareTier}
            />
          ) : (
            detailCard
          )}
        </div>
      </div>

      {compareDynasty ? detailCard : null}

      <p className="text-muted-foreground text-xs leading-relaxed">
        读图口径：层高「品序对齐」时，秦汉以「约当 N
        品」示意、元代「路府州县」按前后层内插，只用于布局，不改史料口径；正、从相邻两阶占半格，同一层跨两品者按首品落位。「层级等距」只比较结构，不比较高低；双朝并置的竖轴同尺，横向留白即该朝未设此品。
      </p>
    </section>
  );
}
