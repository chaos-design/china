import { useCallback, useMemo, useState } from "react";

import type { OfficialPost, OfficialsDynasty } from "../china-officials/officials-data";
import { countPosts, getOfficialsDynasty } from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import { getRankDynasty, nextDynastyId } from "./rank-data";
import type { RankTreeTier } from "./rank-tree-layout";
import {
  findComparableGrade,
  formatBandLabel,
  layoutRankTree,
  type RankTreeSpan,
  type RankTreeSplit,
} from "./rank-tree-layout";
import type {
  RankTreeCameraPreset,
  RankTreeHover,
  RankTreePick,
  RankTreeSceneEntry,
} from "./rank-tree-scene";
import type { RanksDrawerTab } from "./ranks-drawer";
import { rankTreePickDetail } from "./ranks-view-model";
import type { RankDynastyId } from "./types";
import { type RankTreeSceneController, useRankTreeScene } from "./use-rank-tree-scene";

/** 品级纵横舞台的单一状态源 + 派生视图模型 + 交互命令。 */
export interface RanksStage {
  // —— 朝代 / 对照 ——
  dynastyId: RankDynastyId;
  mainDynasty: OfficialsDynasty;
  compareEnabled: boolean;
  compareId: RankDynastyId;
  effectiveCompareId: RankDynastyId;
  compareDynasty: OfficialsDynasty | undefined;
  ladderCompareDynasty: ReturnType<typeof getRankDynasty>;
  officeCount: number;
  compareOfficeCount: number;

  // —— 聚焦层 / 选中官职 ——
  focusBand: number;
  focusLabel: string;
  mainTier: RankTreeTier | undefined;
  compareTier: RankTreeTier | undefined;
  selected: RankTreePick | null;
  selection: OfficeDetail | null;
  hover: RankTreeHover | null;

  // —— 立体树视图参数 ——
  span: RankTreeSpan;
  split: RankTreeSplit;
  preset: RankTreeCameraPreset | null;
  autoRotate: boolean;
  mainLayout: ReturnType<typeof layoutRankTree>;
  compareLayout: ReturnType<typeof layoutRankTree> | null;

  // —— 悬浮面板 ——
  filterCollapsed: boolean;
  drawerOpen: boolean;
  drawerTab: RanksDrawerTab;

  // —— 场景生命周期 ——
  scene: RankTreeSceneController;
  entries: readonly RankTreeSceneEntry[];
  focusPicks: { main: RankTreePick | null; compare: RankTreePick | null };

  // —— 交互命令 ——
  chooseMain: (id: RankDynastyId) => void;
  chooseCompare: (id: RankDynastyId) => void;
  toggleCompare: (enabled: boolean) => void;
  chooseSpan: (span: RankTreeSpan) => void;
  chooseSplit: (split: RankTreeSplit) => void;
  applyPreset: (preset: RankTreeCameraPreset) => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
  selectTreeOffice: (dynasty: OfficialsDynasty, tier: RankTreeTier, office: OfficialPost) => void;
  focusTierChip: (tier: RankTreeTier) => void;
  toggleFilterCollapsed: () => void;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  openGenealogy: () => void;
  setDrawerTab: (tab: RanksDrawerTab) => void;
  setHover: (hover: RankTreeHover | null) => void;
  setSelectionFromLadder: (detail: OfficeDetail) => void;
}

export function useRanksStage(): RanksStage {
  // —— 原始状态：按「数据 / 场景 / 面板」分组，便于定位 ——
  const [dynastyId, setDynastyId] = useState<RankDynastyId>("qin");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareId, setCompareId] = useState<RankDynastyId>("qing");
  const [selection, setSelection] = useState<OfficeDetail | null>(null);

  const [span, setSpan] = useState<RankTreeSpan>("band");
  const [split, setSplit] = useState<RankTreeSplit>("branch");
  const [focusBand, setFocusBand] = useState(1);
  const [selected, setSelected] = useState<RankTreePick | null>(null);
  const [hover, setHover] = useState<RankTreeHover | null>(null);
  const [preset, setPreset] = useState<RankTreeCameraPreset | null>("three-quarter");
  const [autoRotate, setAutoRotate] = useState(false);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<RanksDrawerTab>("tree");

  // —— 派生数据：全部由原始状态推导，不额外 useState ——
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

  const focusPicks = useMemo<{ main: RankTreePick | null; compare: RankTreePick | null }>(
    () => ({
      compare:
        compareTierDynastyId !== null && compareTierIndex >= 0
          ? {
              dynastyId: compareTierDynastyId,
              kind: "tier",
              gradeIndex: compareTierIndex,
            }
          : null,
      main: mainTierIndex >= 0 ? { dynastyId, kind: "tier", gradeIndex: mainTierIndex } : null,
    }),
    [compareTierDynastyId, compareTierIndex, dynastyId, mainTierIndex],
  );

  const entries = useMemo<RankTreeSceneEntry[]>(() => {
    const list: RankTreeSceneEntry[] = [{ dynasty: mainDynasty, layout: mainLayout }];
    if (compareDynasty && compareLayout) {
      list.push({ dynasty: compareDynasty, layout: compareLayout });
    }
    return list;
  }, [compareDynasty, compareLayout, mainDynasty, mainLayout]);

  const officeCount = countPosts(mainDynasty);
  const compareOfficeCount = compareDynasty ? countPosts(compareDynasty) : 0;

  // —— 场景回调：声明在场景 hook 之前，作为 ref 交给场景，避免重建 ——
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
      // 点选画布节点即滑出右侧资料面板，并停在该节点的职权 tab。
      setDrawerOpen(true);
      setDrawerTab("tree");
    },
    [compareLayout, dynastyId, mainLayout],
  );

  const handleUnavailable = useCallback(() => {
    setDrawerOpen(true);
    setDrawerTab("genealogy");
  }, []);

  const scene = useRankTreeScene(
    {
      entries,
      span,
      focus: focusPicks,
      selected,
      autoRotate,
    },
    {
      onHover: setHover,
      onPick: handlePick,
      onUnavailable: handleUnavailable,
    },
  );

  // —— 交互命令 ——
  const chooseMain = useCallback(
    (id: RankDynastyId) => {
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
    },
    [compareEnabled, compareId, focusBand],
  );

  const chooseCompare = useCallback((id: RankDynastyId) => {
    setCompareId(id);
    setSelection(null);
  }, []);

  const toggleCompare = useCallback(
    (enabled: boolean) => {
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
    },
    [compareId, dynastyId, focusBand, mainDynasty],
  );

  const chooseSpan = useCallback((next: RankTreeSpan) => {
    setSpan(next);
    setPreset("three-quarter");
  }, []);

  const chooseSplit = useCallback((next: RankTreeSplit) => {
    setSplit(next);
  }, []);

  const applyPreset = useCallback(
    (next: RankTreeCameraPreset) => {
      setPreset(next);
      setAutoRotate(false);
      scene.applyPreset(next);
    },
    [scene],
  );

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((previous) => !previous);
    setPreset(null);
  }, []);

  const resetView = useCallback(() => {
    setPreset("three-quarter");
    setAutoRotate(false);
    scene.resetView();
  }, [scene]);

  const selectTreeOffice = useCallback(
    (dynasty: OfficialsDynasty, tier: RankTreeTier, office: OfficialPost) => {
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
      scene.focusTier(dynasty.id, tier.gradeIndex);
    },
    [scene],
  );

  const focusTierChip = useCallback(
    (tier: RankTreeTier) => {
      setSelected(null);
      setSelection(null);
      setFocusBand(tier.band);
      scene.focusTier(dynastyId, tier.gradeIndex);
    },
    [dynastyId, scene],
  );

  const toggleFilterCollapsed = useCallback(() => {
    setFilterCollapsed((previous) => !previous);
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((previous) => !previous);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const openGenealogy = useCallback(() => {
    setDrawerOpen(true);
    setDrawerTab("genealogy");
  }, []);

  const setSelectionFromLadder = useCallback((detail: OfficeDetail) => {
    setSelection(detail);
  }, []);

  return {
    dynastyId,
    mainDynasty,
    compareEnabled,
    compareId,
    effectiveCompareId,
    compareDynasty,
    ladderCompareDynasty,
    officeCount,
    compareOfficeCount,
    focusBand,
    focusLabel,
    mainTier,
    compareTier,
    selected,
    selection,
    hover,
    span,
    split,
    preset,
    autoRotate,
    mainLayout,
    compareLayout,
    filterCollapsed,
    drawerOpen,
    drawerTab,
    scene,
    entries,
    focusPicks,
    chooseMain,
    chooseCompare,
    toggleCompare,
    chooseSpan,
    chooseSplit,
    applyPreset,
    toggleAutoRotate,
    resetView,
    selectTreeOffice,
    focusTierChip,
    toggleFilterCollapsed,
    toggleDrawer,
    closeDrawer,
    openGenealogy,
    setDrawerTab,
    setHover,
    setSelectionFromLadder,
  };
}
