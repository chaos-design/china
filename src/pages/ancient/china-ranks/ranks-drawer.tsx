import { useState } from "react";

import { cn } from "../../../lib/utils";
import type {
  OfficialPost,
  OfficialsDynasty,
  OfficialsDynastyId,
} from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";
import { getRankDynasty, RANK_DYNASTIES, RANK_TRACKS, resolveOfficeBand } from "./rank-data";
import { RankGenealogyPanel } from "./rank-genealogy";
import { GRADE_BANDS, GRADE_LABELS, RankLadderPanel } from "./rank-ladder-panel";
import type { RankTreeTier } from "./rank-tree-layout";
import type { RankTreePick } from "./rank-tree-scene";
import { OptionPill } from "./ranks-option-pill";
import type { RankBand, RankDynasty, RankDynastyId, RankLevel, RankOffice } from "./types";

export type RanksDrawerTab = "tree" | "genealogy" | "ladder" | "track" | "grade";

const DRAWER_TABS: readonly { id: RanksDrawerTab; label: string }[] = [
  { id: "tree", label: "树" },
  { id: "genealogy", label: "族谱" },
  { id: "ladder", label: "阶梯" },
  { id: "track", label: "追踪" },
  { id: "grade", label: "断面" },
];

function TierColumn({
  bandLabel,
  dynasty,
  onSelectOffice,
  selected,
  tier,
}: {
  bandLabel: string;
  dynasty: OfficialsDynasty;
  onSelectOffice: (dynasty: OfficialsDynasty, tier: RankTreeTier, office: OfficialPost) => void;
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
        <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.12em]">
          {dynasty.period}
        </span>
        <span className="rounded-full border border-vermillion/25 bg-vermillion/10 px-2 py-0.5 font-body text-xs text-vermillion">
          {dynasty.system}
        </span>
      </header>

      {tier ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono-tech text-vermillion text-[0.7rem] tracking-[0.16em]">
              {tier.grade.label}
            </span>
            {tier.grade.approx ? (
              <span className="rounded border border-dashed border-ochre px-1.5 font-body text-[0.7rem] text-ochre">
                {tier.grade.approx}
              </span>
            ) : null}
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
              {tier.officeCount} 官 · 文 {tier.civilCount} / 武 {tier.militaryCount}
            </span>
          </div>
          <p className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.12em]">
            本级职权范围
          </p>
          <ul className="flex flex-col gap-1">
            {tier.grade.posts.map((post) => {
              const active =
                selected?.kind === "office" &&
                selected.dynastyId === dynasty.id &&
                selected.gradeIndex === tier.gradeIndex &&
                selected.officeTitle === post.title;
              const rankLine = post.rank ?? tier.grade.approx;

              return (
                <li key={post.title}>
                  <button
                    aria-pressed={active}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-vermillion/20 hover:bg-vermillion/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active && "border-vermillion/25 bg-vermillion/10",
                    )}
                    onClick={() => {
                      onSelectOffice(dynasty, tier, post);
                    }}
                    type="button"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full",
                          post.branch === "civil" ? "bg-vermillion" : "bg-blueprint",
                        )}
                      />
                      <span className="font-brush text-lg leading-snug text-ink">{post.title}</span>
                      {rankLine ? (
                        <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em]">
                          {rankLine}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {post.intro}
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

/** 树 tab：tier chips（键盘可达画布节点）+ 主/对比本级职权 + 共享详情卡 + 读图口径。 */
function TreePanel({
  compareDynasty,
  compareTier,
  focusBand,
  focusLabel,
  mainDynasty,
  mainLayout,
  mainTier,
  onSelectOffice,
  onTierFocus,
  selected,
  selection,
}: {
  compareDynasty: OfficialsDynasty | undefined;
  compareTier: RankTreeTier | undefined;
  focusBand: number;
  focusLabel: string;
  mainDynasty: OfficialsDynasty;
  mainLayout: { tiers: readonly RankTreeTier[] };
  mainTier: RankTreeTier | undefined;
  onSelectOffice: (dynasty: OfficialsDynasty, tier: RankTreeTier, office: OfficialPost) => void;
  onTierFocus: (tier: RankTreeTier) => void;
  selected: RankTreePick | null;
  selection: OfficeDetail | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset aria-label="树状品级选择" className="flex flex-wrap gap-1.5">
        {mainLayout.tiers.map((tier) => (
          <button
            aria-pressed={tier.band === focusBand}
            className={cn(
              "rounded-md border px-2.5 py-1.5 font-mono-tech text-[0.7rem] tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tier.band === focusBand
                ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30 hover:text-ink",
            )}
            key={`${tier.gradeIndex}-${tier.grade.label}`}
            onClick={() => {
              onTierFocus(tier);
            }}
            type="button"
          >
            {tier.grade.label}
          </button>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
          品级 · 职权
        </span>
        <p className="text-muted-foreground text-xs leading-relaxed">
          选一级，展开这一级所有官职的职权范围；点官职看秩俸、沿革与名臣名将。
        </p>
      </div>

      <TierColumn
        bandLabel={focusLabel}
        dynasty={mainDynasty}
        onSelectOffice={onSelectOffice}
        selected={selected}
        tier={mainTier}
      />
      {compareDynasty ? (
        <TierColumn
          bandLabel={focusLabel}
          dynasty={compareDynasty}
          onSelectOffice={onSelectOffice}
          selected={selected}
          tier={compareTier}
        />
      ) : null}

      <OfficeDetailCard
        ariaLabel="品级树详情"
        emptyHint="点选树上的官职节点或本级职权列表，查看该官的职权、秩俸、沿革与相关名臣名将。"
        selection={selection}
      />

      <p className="text-muted-foreground text-xs leading-relaxed">
        读图口径：树取的是 officials
        名录里的全部官职，品序轴按各朝自定级序落位（超品、九品、流外同轴），秦汉无品以「约当 N
        品」示意对照；文武分列时枝条位置示意从属，不表示地理或实权方位。「层级等距」只比较结构，不比较高低；双朝并置的竖轴同尺，横向留白即该朝未设此品。
      </p>
    </div>
  );
}

/** 追踪 tab：六条职系 chips 单选，纵向列出该职系在八个王朝的停靠点。 */
function TrackPanel() {
  const [trackId, setTrackId] = useState(RANK_TRACKS[0]?.id ?? "");
  const track = RANK_TRACKS.find((candidate) => candidate.id === trackId) ?? RANK_TRACKS[0]!;

  return (
    <section aria-label="同职追踪" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">横 · 同职追踪</span>
        <p className="text-muted-foreground text-xs leading-relaxed">
          六条职系各追一遍八朝：名称、品秩与实权如何一起变——品级与实权脱钩之处，正是制度史的转折点。
        </p>
      </div>

      <fieldset aria-label="职系选择" className="flex flex-wrap gap-2">
        {RANK_TRACKS.map((candidate) => (
          <OptionPill
            active={candidate.id === trackId}
            label={candidate.name}
            key={candidate.id}
            onSelect={() => {
              setTrackId(candidate.id);
            }}
          />
        ))}
      </fieldset>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-brush text-xl text-ink">{track.name}</h3>
          <span className="text-muted-foreground text-xs">{track.blurb}</span>
        </div>
        <ol className="flex flex-col gap-2">
          {track.stops.map((stop) => (
            <li
              className="flex flex-col gap-1 rounded-lg border border-ink/15 bg-card/80 p-3"
              key={stop.dynastyId}
            >
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.14em]">
                {getRankDynasty(stop.dynastyId)?.name ?? stop.dynastyId}
              </span>
              <span className="font-brush text-ink text-lg leading-snug">{stop.title}</span>
              <span className="font-mono-tech text-vermillion text-[0.7rem] tracking-[0.06em]">
                {stop.rank}
              </span>
              <span className="text-muted-foreground text-xs leading-relaxed">{stop.power}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 断面 tab：品序 chips × 八朝纵向卡片；秦汉「约当」保留示意标注与口径脚注。 */
function GradePanel() {
  const [gradeBand, setGradeBand] = useState<RankBand>(1);

  return (
    <section aria-label="同品断面" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">断面 · 同品对照</span>
        <p className="text-muted-foreground text-xs leading-relaxed">
          选一品序，看八个王朝在同一级台阶上都摆了什么官。
        </p>
      </div>

      <fieldset aria-label="品序选择" className="flex flex-wrap gap-2">
        {GRADE_BANDS.map((band) => (
          <OptionPill
            active={band === gradeBand}
            label={GRADE_LABELS[band]}
            key={band}
            onSelect={() => {
              setGradeBand(band);
            }}
          />
        ))}
      </fieldset>

      <ol className="flex flex-col gap-2">
        {RANK_DYNASTIES.map((dynasty) => {
          const matches = dynasty.levels.flatMap((level) =>
            level.offices
              .filter((office) => resolveOfficeBand(level, office) === gradeBand)
              .map((office) => ({
                approx: office.band === undefined,
                office,
              })),
          );

          return (
            <li
              className="flex flex-col gap-1.5 rounded-lg border border-ink/15 bg-card/80 p-3"
              key={dynasty.id}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="font-brush text-ink text-lg">{dynasty.name}</span>
                <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.14em]">
                  {dynasty.period}
                </span>
              </div>
              {matches.length === 0 ? (
                <span className="text-muted-foreground text-xs">本级无设官</span>
              ) : (
                matches.map((match) => (
                  <div className="flex flex-col" key={match.office.title}>
                    <span className="font-brush text-ink text-lg leading-snug">
                      {match.office.title}
                    </span>
                    <span className="font-mono-tech text-muted-foreground text-[0.7rem]">
                      {match.office.rank}
                    </span>
                    {match.approx ? (
                      <span className="font-body text-ochre text-[0.7rem]">约当</span>
                    ) : null}
                  </div>
                ))
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-muted-foreground text-xs leading-relaxed">
        秦汉未行九品，「约当 N
        品」按秩石高下示意排布，仅作对照参考；「古今对应」同为量级类比，非严格等价。品秩以正史职官志通行记载为准，存疑处以「约」标示。
      </p>
    </section>
  );
}

/**
 * 品级资料抽屉：仿 /china/timeline 右侧 #panel 的滑入式资料面板。
 * 桌面（lg+）为右缘滑入竖栏（translateX），窄屏为底部 sheet（translateY）。
 * 五个 tab 对应旧页的五个 section：树（本级职权）/ 族谱 / 阶梯 / 追踪 / 断面；
 * 关闭时内容仍挂载但 inert，键盘焦点与读屏不可达。
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
        "absolute z-40 flex flex-col overflow-hidden border-ink/15 bg-paper/90 shadow-[0_-18px_48px_hsl(var(--ink)/0.14)] backdrop-blur-xl transition-transform duration-300",
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
        className="min-h-0 flex-1 overflow-y-auto p-4"
        role="tabpanel"
        aria-label={`品级资料 · ${DRAWER_TABS.find((candidate) => candidate.id === tab)?.label ?? ""}`}
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
