import { cn } from "../../../lib/utils";
import type {
  OfficialPost,
  OfficialsDynasty,
  OfficialsDynastyId,
} from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import { RankGenealogyPanel } from "./rank-genealogy";
import { RankLadderPanel } from "./rank-ladder-panel";
import type { RankTreeTier } from "./rank-tree-layout";
import type { RankTreePick } from "./rank-tree-scene";
import { GradePanel } from "./ranks-grade-panel";
import { TrackPanel } from "./ranks-track-panel";
import { TreePanel } from "./ranks-tree-panel";
import type { RankDynasty, RankDynastyId, RankLevel, RankOffice } from "./types";

export type RanksDrawerTab = "tree" | "genealogy" | "ladder" | "track" | "grade";

const DRAWER_TABS: readonly { id: RanksDrawerTab; label: string }[] = [
  { id: "tree", label: "树" },
  { id: "genealogy", label: "族谱" },
  { id: "ladder", label: "阶梯" },
  { id: "track", label: "追踪" },
  { id: "grade", label: "断面" },
];

/**
 * 品级资料抽屉：仿 /china/timeline 右侧 #panel 的滑入式资料面板。
 * 桌面（lg+）为右缘滑入竖栏（translateX），窄屏为底部 sheet（translateY）。
 * 五个 tab 对应旧页的五个 section：树（本级职权）/ 族谱 / 阶梯 / 追踪 / 断面；
 * 关闭时内容仍挂载但 inert，键盘焦点与读屏不可达。
 * 各 tab 的正文拆到独立组件，这里只负责外壳、tab 条与面板分发。
 */
export function RanksDrawer({
  compareDynasty,
  compareTier,
  ladderCompareDynasty,
  compareEnabled,
  compareId,
  dynastyId,
  focusBand,
  focusLabel,
  mainDynasty,
  mainLayout,
  mainTier,
  open,
  onSelectLadderOffice,
  onSelectTreeOffice,
  onTabChange,
  onClose,
  onCompareChange,
  onTierFocus,
  onToggleCompare,
  selected,
  selection,
  tab,
}: {
  compareDynasty: OfficialsDynasty | undefined;
  compareTier: RankTreeTier | undefined;
  ladderCompareDynasty: RankDynasty | undefined;
  compareEnabled: boolean;
  compareId: RankDynastyId;
  dynastyId: OfficialsDynastyId;
  focusBand: number;
  focusLabel: string;
  mainDynasty: OfficialsDynasty;
  mainLayout: { tiers: readonly RankTreeTier[] };
  mainTier: RankTreeTier | undefined;
  open: boolean;
  onSelectLadderOffice: (office: RankOffice, level: RankLevel, dynasty: RankDynasty) => void;
  onSelectTreeOffice: (dynasty: OfficialsDynasty, tier: RankTreeTier, office: OfficialPost) => void;
  onTabChange: (tab: RanksDrawerTab) => void;
  onClose: () => void;
  onCompareChange: (id: RankDynastyId) => void;
  onTierFocus: (tier: RankTreeTier) => void;
  onToggleCompare: (enabled: boolean) => void;
  selected: RankTreePick | null;
  selection: OfficeDetail | null;
  tab: RanksDrawerTab;
}) {
  return (
    <aside
      aria-hidden={open ? undefined : true}
      aria-label="品级资料"
      className={cn(
        "absolute z-40 flex flex-col overflow-hidden border-ink/15 bg-paper/90 shadow-[0_-18px_48px_hsl(var(--ink)/0.14)] backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none",
        "inset-x-0 bottom-0 max-h-[45vh] rounded-t-2xl border-t",
        "lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:max-h-none lg:w-[420px] lg:rounded-l-2xl lg:border-l lg:border-t-0 lg:shadow-[0_18px_48px_hsl(var(--ink)/0.14)]",
        open
          ? "translate-y-0 lg:translate-x-0"
          : "translate-y-full lg:translate-x-[105%] lg:translate-y-0",
      )}
      inert={!open || undefined}
    >
      <div className="flex items-center gap-3 border-ink/10 border-b px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-1.5" role="tablist">
          {DRAWER_TABS.map((candidate) => (
            <button
              aria-selected={candidate.id === tab}
              className={cn(
                "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                candidate.id === tab
                  ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                  : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30",
              )}
              key={candidate.id}
              onClick={() => {
                onTabChange(candidate.id);
              }}
              role="tab"
              type="button"
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <button
          aria-label="关闭品级资料抽屉"
          className="rounded-full border border-ink/15 bg-card/70 px-2.5 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
      </div>

      <div
        aria-label={`品级资料 · ${DRAWER_TABS.find((candidate) => candidate.id === tab)?.label ?? ""}`}
        className="min-h-0 flex-1 overflow-y-auto p-4"
        role="tabpanel"
      >
        {tab === "tree" ? (
          <TreePanel
            compareDynasty={compareDynasty}
            compareTier={compareTier}
            focusBand={focusBand}
            focusLabel={focusLabel}
            mainDynasty={mainDynasty}
            mainLayout={mainLayout}
            mainTier={mainTier}
            onSelectOffice={onSelectTreeOffice}
            onTierFocus={onTierFocus}
            selected={selected}
            selection={selection}
          />
        ) : null}
        {tab === "genealogy" ? <RankGenealogyPanel dynastyId={dynastyId} /> : null}
        {tab === "ladder" ? (
          <RankLadderPanel
            compareDynasty={ladderCompareDynasty}
            compareEnabled={compareEnabled}
            compareId={compareId}
            dynastyId={dynastyId}
            onCompareChange={onCompareChange}
            onSelectOffice={onSelectLadderOffice}
            onToggleCompare={onToggleCompare}
            selection={selection}
          />
        ) : null}
        {tab === "track" ? <TrackPanel /> : null}
        {tab === "grade" ? <GradePanel /> : null}
      </div>
    </aside>
  );
}
