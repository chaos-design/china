import { useState } from "react";

import { cn } from "../../../lib/utils";
import { DynastyChips } from "./dynasty-chips";
import type { SelectedOffice } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";
import {
  getRankDynasty,
  nextDynastyId,
  RANK_DYNASTIES,
  RANK_TRACKS,
  resolveOfficeBand,
} from "./rank-data";
import { LadderStep } from "./rank-step-glyph";
import { RankTreeSection } from "./rank-tree-section";
import type { RankBand, RankDynasty, RankDynastyId, RankLevel, RankOffice } from "./types";

const GRADE_BANDS: readonly RankBand[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const GRADE_LABELS: Record<RankBand, string> = {
  1: "一品",
  2: "二品",
  3: "三品",
  4: "四品",
  5: "五品",
  6: "六品",
  7: "七品",
  8: "八品",
  9: "九品",
};

function OfficeRow({
  isSelected,
  level,
  office,
  onSelect,
  selectedKey,
}: {
  isSelected: boolean;
  level: RankLevel;
  office: RankOffice;
  onSelect: (office: RankOffice, level: RankLevel) => void;
  selectedKey: string;
}) {
  return (
    <button
      aria-expanded={isSelected}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-vermillion/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected && "bg-vermillion/10",
      )}
      key={selectedKey}
      onClick={() => {
        onSelect(office, level);
      }}
      type="button"
    >
      <span className="flex flex-wrap items-baseline gap-x-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full",
            office.branch === "civil" ? "bg-vermillion" : "bg-blueprint",
          )}
        />
        <span className="font-brush text-lg leading-snug text-ink">{office.title}</span>
        <span className="font-mono-tech text-[0.7rem] tracking-[0.08em] text-muted-foreground">
          {office.rank}
        </span>
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">{office.duty}</span>
    </button>
  );
}

function LadderColumn({
  dynasty,
  onSelectOffice,
  selectedKey,
}: {
  dynasty: RankDynasty;
  onSelectOffice: (office: RankOffice, level: RankLevel, dynasty: RankDynasty) => void;
  selectedKey: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-brush text-2xl text-ink">{dynasty.name}</h3>
          <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.18em]">
            {dynasty.period}
          </span>
          <span className="rounded-full border border-vermillion/30 bg-vermillion/10 px-2.5 py-0.5 font-body text-vermillion text-xs">
            {dynasty.system}
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{dynasty.systemNote}</p>
        <p className="font-mono-tech text-[0.7rem] text-muted-foreground/80 tracking-[0.12em]">
          出处 · {dynasty.source}
        </p>
      </header>
      <ol className="flex flex-col gap-2">
        {dynasty.levels.map((level, levelIndex) => (
          <li
            className="flex gap-2"
            key={level.grade}
            style={{ marginLeft: `${Math.min(levelIndex * 14, 112)}px` }}
          >
            <LadderStep apex={levelIndex === 0} />
            <div
              className="min-w-0 flex-1 rounded-r-lg border border-ink/15 border-l-4 bg-card/90 py-2 pl-3 pr-3 shadow-[0_1px_0_hsl(var(--ink)/0.05)]"
              style={{
                borderLeftColor: `hsl(var(--vermillion) / ${Math.max(0.25, 0.85 - levelIndex * 0.08)})`,
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-mono-tech text-vermillion text-xs tracking-[0.14em]">
                  {level.grade}
                </span>
                {level.approxGrade !== undefined ? (
                  <span className="rounded border border-dashed border-ochre px-1.5 font-body text-ochre text-[0.7rem]">
                    约当{GRADE_LABELS[level.approxGrade]}
                  </span>
                ) : null}
                {level.outOfRank === true ? (
                  <span className="font-body text-[0.7rem] text-muted-foreground">品外</span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {level.offices.map((office) => {
                  const key = `${dynasty.id}:${level.grade}:${office.title}`;

                  return (
                    <OfficeRow
                      isSelected={selectedKey === key}
                      key={key}
                      level={level}
                      office={office}
                      onSelect={(selectedOffice, selectedLevel) => {
                        onSelectOffice(selectedOffice, selectedLevel, dynasty);
                      }}
                      selectedKey={key}
                    />
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LadderSection({
  compareEnabled,
  compareId,
  dynastyId,
  selection,
  onCompareChange,
  onToggleCompare,
  onSelectDynasty,
  onSelectOffice,
}: {
  compareEnabled: boolean;
  compareId: RankDynastyId;
  dynastyId: RankDynastyId;
  selection: SelectedOffice | null;
  onCompareChange: (id: RankDynastyId) => void;
  onToggleCompare: (enabled: boolean) => void;
  onSelectDynasty: (id: RankDynastyId) => void;
  onSelectOffice: (office: RankOffice, level: RankLevel, dynasty: RankDynasty) => void;
}) {
  const mainDynasty = getRankDynasty(dynastyId);
  if (!mainDynasty) {
    return null;
  }

  // 对比朝代与主朝代相同时（如把主朝代切到原对比朝代），自动顺延一位。
  const compareDynasty =
    compareEnabled && compareId !== dynastyId ? getRankDynasty(compareId) : undefined;

  return (
    <section aria-label="品级阶梯" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">纵 · 品级阶梯</span>
        <h2 className="font-brush text-3xl text-ink">一品到九品：这一朝的官阶台阶</h2>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            阶梯朝代
          </span>
          <DynastyChips ariaLabel="阶梯朝代选择" currentId={dynastyId} onSelect={onSelectDynasty} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            对比模式
          </span>
          <fieldset aria-label="阶梯模式" className="flex gap-2">
            <button
              aria-pressed={!compareEnabled}
              className={cn(
                "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !compareEnabled
                  ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                  : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30",
              )}
              onClick={() => {
                onToggleCompare(false);
              }}
              type="button"
            >
              单朝
            </button>
            <button
              aria-pressed={compareEnabled}
              className={cn(
                "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                compareEnabled
                  ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                  : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30",
              )}
              onClick={() => {
                onToggleCompare(true);
              }}
              type="button"
            >
              朝代对比
            </button>
          </fieldset>
          {compareEnabled ? (
            <DynastyChips
              ariaLabel="对比朝代选择"
              currentId={compareId}
              disabledId={dynastyId}
              onSelect={onCompareChange}
            />
          ) : null}
        </div>
      </div>

      <div className={cn("grid gap-8", compareEnabled ? "xl:grid-cols-2" : "grid-cols-1")}>
        <LadderColumn
          dynasty={mainDynasty}
          onSelectOffice={onSelectOffice}
          selectedKey={
            selection && selection.dynasty.id === mainDynasty.id
              ? `${selection.dynasty.id}:${selection.level.grade}:${selection.office.title}`
              : null
          }
        />
        {compareDynasty ? (
          <LadderColumn
            dynasty={compareDynasty}
            onSelectOffice={onSelectOffice}
            selectedKey={
              selection && selection.dynasty.id === compareDynasty.id
                ? `${selection.dynasty.id}:${selection.level.grade}:${selection.office.title}`
                : null
            }
          />
        ) : null}
      </div>

      <OfficeDetailCard selection={selection} />
    </section>
  );
}

function TrackSection() {
  return (
    <section aria-label="同职追踪" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">横 · 同职追踪</span>
        <h2 className="font-brush text-3xl text-ink">同一职位，八个王朝</h2>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          六条职系各追一遍八朝：名称、品秩与实权如何一起变——品级与实权脱钩之处，正是制度史的转折点。
        </p>
      </div>
      {RANK_TRACKS.map((track) => (
        <div className="flex flex-col gap-2" key={track.id}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-brush text-xl text-ink">{track.name}</h3>
            <span className="text-muted-foreground text-xs">{track.blurb}</span>
          </div>
          <div className="overflow-x-auto pb-1">
            <ol className="grid min-w-[880px] grid-cols-8 gap-2">
              {track.stops.map((stop) => (
                <li
                  className="flex flex-col gap-1 rounded-lg border border-ink/15 bg-card/80 p-2.5"
                  key={stop.dynastyId}
                >
                  <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.14em]">
                    {getRankDynasty(stop.dynastyId)?.name ?? stop.dynastyId}
                  </span>
                  <span className="font-brush text-ink text-lg leading-snug">{stop.title}</span>
                  <span className="font-mono-tech text-vermillion text-[0.7rem] tracking-[0.06em]">
                    {stop.rank}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {stop.power}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </section>
  );
}

function GradeSection({
  gradeBand,
  onGradeChange,
}: {
  gradeBand: RankBand;
  onGradeChange: (band: RankBand) => void;
}) {
  return (
    <section aria-label="同品断面" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">断面 · 同品对照</span>
        <h2 className="font-brush text-3xl text-ink">同一品级，谁在任上</h2>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          选一品序，看八个王朝在同一级台阶上都摆了什么官。
        </p>
      </div>

      <fieldset aria-label="品序选择" className="flex flex-wrap gap-2">
        {GRADE_BANDS.map((band) => (
          <button
            aria-pressed={band === gradeBand}
            className={cn(
              "rounded-full border px-3 py-1 font-mono-tech text-xs tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              band === gradeBand
                ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30 hover:bg-vermillion/5",
            )}
            key={band}
            onClick={() => {
              onGradeChange(band);
            }}
            type="button"
          >
            {GRADE_LABELS[band]}
          </button>
        ))}
      </fieldset>

      <div className="overflow-x-auto pb-1">
        <ol className="grid min-w-[960px] grid-cols-8 gap-2">
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
                className="flex flex-col gap-1.5 rounded-lg border border-ink/15 bg-card/80 p-2.5"
                key={dynasty.id}
              >
                <span className="font-brush text-ink text-lg">{dynasty.name}</span>
                {matches.length === 0 ? (
                  <span className="text-muted-foreground text-xs">本级无设官</span>
                ) : (
                  matches.map((match) => (
                    <div className="flex flex-col" key={match.office.title}>
                      <span className="font-brush text-ink text-base">{match.office.title}</span>
                      <span className="font-mono-tech text-muted-foreground text-[0.65rem]">
                        {match.office.rank}
                      </span>
                      {match.approx ? (
                        <span className="font-body text-ochre text-[0.65rem]">约当</span>
                      ) : null}
                    </div>
                  ))
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        秦汉未行九品，「约当 N
        品」按秩石高下示意排布，仅作对照参考；「古今对应」同为量级类比，非严格等价。品秩以正史职官志通行记载为准，存疑处以「约」标示。
      </p>
    </section>
  );
}

/**
 * 品级纵横：官位品级跨朝代对比页。
 * 三条立体视角共用一版式：纵（单朝/双朝阶梯）、横（六条职系追踪）、
 * 断面（同品序八朝对照）；阶梯官职可点开四维详情卡。
 */
export function RanksPage() {
  const [dynastyId, setDynastyId] = useState<RankDynastyId>("qin");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareId, setCompareId] = useState<RankDynastyId>("qing");
  const [gradeBand, setGradeBand] = useState<RankBand>(1);
  const [selection, setSelection] = useState<SelectedOffice | null>(null);

  // 主朝代切到原对比朝代时，对比列自动顺延到下一位，保证两列不重合。
  const effectiveCompareId = compareId === dynastyId ? nextDynastyId(dynastyId) : compareId;

  return (
    <article className="flex flex-col">
      <header className="border-ink/10 border-b px-4 py-6 lg:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="font-brush text-3xl text-ink sm:text-4xl">品级纵横</h1>
            <span className="rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-muted-foreground text-xs tracking-widest">
              职官 · 品阶 · 朝代对照
            </span>
            <span className="font-body text-vermillion text-xs font-medium tracking-[0.3em]">
              典章制度 · 品级图谱
            </span>
          </div>
          <p className="max-w-3xl font-body text-ink/85 text-sm leading-relaxed">
            先看立体树：树干自皇权垂下，平台是品级，枝头是文武百官，两朝按品并置即可同高对读；再看阶梯、职系与同品断面——品级如何从秩石走向九品十八级，又如何一次次与实权脱钩。
          </p>
          <a
            className="w-fit rounded-full border border-vermillion/35 bg-vermillion/10 px-3 py-1 font-body text-xs text-vermillion transition-colors hover:bg-vermillion/20"
            href="/china/officials"
          >
            进入全屏「品秩全景」→
          </a>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6">
        <RankTreeSection />
        <LadderSection
          compareEnabled={compareEnabled}
          compareId={effectiveCompareId}
          dynastyId={dynastyId}
          onCompareChange={(id) => {
            setCompareId(id);
          }}
          onSelectDynasty={(id) => {
            setDynastyId(id);
          }}
          onSelectOffice={(office, level, dynasty) => {
            setSelection({ dynasty, level, office });
          }}
          onToggleCompare={(enabled) => {
            setCompareEnabled(enabled);
          }}
          selection={selection}
        />
        <TrackSection />
        <GradeSection
          gradeBand={gradeBand}
          onGradeChange={(band) => {
            setGradeBand(band);
          }}
        />

        <footer className="border-ink/10 border-t pt-4">
          <p className="font-mono-tech text-muted-foreground/80 text-[0.7rem] tracking-[0.12em]">
            数据口径 ·
            品秩以正史职官志为准；「约当N品」为秩石与九品的示意对照；古今对应仅为量级参考。
          </p>
        </footer>
      </div>
    </article>
  );
}
