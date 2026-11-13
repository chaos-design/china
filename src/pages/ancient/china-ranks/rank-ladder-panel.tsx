import { cn } from "../../../lib/utils";
import { DynastyChips } from "./dynasty-chips";
import type { OfficeDetail } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";
import { getRankDynasty } from "./rank-data";
import { LadderStep } from "./rank-step-glyph";
import { OptionPill } from "./ranks-option-pill";
import type { RankBand, RankDynasty, RankDynastyId, RankLevel, RankOffice } from "./types";

/** 一品…九品标签（阶梯「约当」标注与断面 tab 共用）。 */
export const GRADE_LABELS: Record<RankBand, string> = {
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

export const GRADE_BANDS: readonly RankBand[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-brush text-2xl text-ink">{dynasty.name}</h3>
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.18em]">
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
                <span className="font-mono-tech text-vermillion text-[0.7rem] tracking-[0.14em]">
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

/**
 * 品级阶梯面板（资料抽屉 tab）：一品到九品的官阶台阶（rank-data 秩石口径）。
 * 主朝代与双朝并置状态由页面统一驱动；双朝模式下第二列在抽屉内纵向堆叠（不再并排）。
 * 点击官职写入共享 OfficeDetail，供详情卡展示。
 */
export function RankLadderPanel({
  compareDynasty,
  compareEnabled,
  compareId,
  dynastyId,
  onCompareChange,
  onSelectOffice,
  onToggleCompare,
  selection,
}: {
  compareDynasty: RankDynasty | undefined;
  compareEnabled: boolean;
  compareId: RankDynastyId;
  dynastyId: RankDynastyId;
  onCompareChange: (id: RankDynastyId) => void;
  onSelectOffice: (office: RankOffice, level: RankLevel, dynasty: RankDynasty) => void;
  onToggleCompare: (enabled: boolean) => void;
  selection: OfficeDetail | null;
}) {
  const mainDynasty = getRankDynasty(dynastyId);
  if (!mainDynasty) {
    return null;
  }

  return (
    <section aria-label="品级阶梯" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">纵 · 品级阶梯</span>
        <p className="text-muted-foreground text-xs leading-relaxed">
          一品到九品：这一朝的官阶台阶；双朝模式纵列堆叠对照。
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-card/60 p-3">
        <fieldset aria-label="阶梯模式" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
            对比模式
          </span>
          <div className="flex gap-2">
            <OptionPill
              active={!compareEnabled}
              label="单朝"
              onSelect={() => {
                onToggleCompare(false);
              }}
            />
            <OptionPill
              active={compareEnabled}
              label="朝代对比"
              onSelect={() => {
                onToggleCompare(true);
              }}
            />
          </div>
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

      <LadderColumn
        dynasty={mainDynasty}
        onSelectOffice={onSelectOffice}
        selectedKey={selection?.key ?? null}
      />
      {compareDynasty ? (
        <LadderColumn
          dynasty={compareDynasty}
          onSelectOffice={onSelectOffice}
          selectedKey={selection?.key ?? null}
        />
      ) : null}

      <OfficeDetailCard
        emptyHint="点选任一官职，查看职能、秩俸、实态沿革、古今对应与相关名臣名将。"
        selection={selection}
      />
    </section>
  );
}
