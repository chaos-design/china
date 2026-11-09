import type { RankDynasty, RankLevel, RankOffice } from "./types";

export interface SelectedOffice {
  dynasty: RankDynasty;
  level: RankLevel;
  office: RankOffice;
}

function DetailFacet({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono-tech text-[0.7rem] text-vermillion tracking-[0.2em] uppercase">
        {label}
      </dt>
      <dd className="text-foreground/90 text-sm leading-relaxed">{text}</dd>
    </div>
  );
}

/**
 * 官职四维详情卡：职能 / 秩俸 / 实态·沿革 / 古今对应（参考）。
 * 阶梯与立体树共用；缺失的维度直接省略，不占位。
 */
export function OfficeDetailCard({
  ariaLabel = "官职详情",
  emptyHint = "点选任一官职，查看职能、秩俸、实态沿革与古今对应。",
  selection,
}: {
  ariaLabel?: string;
  emptyHint?: string;
  selection: SelectedOffice | null;
}) {
  if (!selection) {
    return (
      <p className="rounded-xl border border-dashed border-ink/20 bg-paper/60 px-4 py-4 text-muted-foreground text-sm">
        {emptyHint}
      </p>
    );
  }

  const { office, dynasty } = selection;

  return (
    <aside
      aria-label={ariaLabel}
      className="min-h-[150px] rounded-xl border border-ink/15 bg-paper/70 p-5 shadow-[0_10px_28px_hsl(var(--ink)/0.08)]"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-brush text-2xl text-ink">{office.title}</span>
        <span className="rounded-sm bg-vermillion/10 px-2 py-0.5 font-brush text-vermillion text-base">
          {dynasty.name}
        </span>
        <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.12em]">
          {office.rank}
        </span>
      </div>
      <dl className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        <DetailFacet label="职能" text={office.duty} />
        {office.salary ? <DetailFacet label="秩俸" text={office.salary} /> : null}
        {office.note ? <DetailFacet label="实态 · 沿革" text={office.note} /> : null}
        {office.modern ? <DetailFacet label="古今对应（参考）" text={office.modern} /> : null}
      </dl>
    </aside>
  );
}
