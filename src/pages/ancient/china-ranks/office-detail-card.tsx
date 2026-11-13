import type { RankDynasty, RankLevel, RankOffice } from "./types";

/**
 * 详情卡视图模型：阶梯（rank-data）、立体树与品级族谱（officials-data）
 * 各自映射成此形状后共用一张卡；缺失的维度直接省略，不占位。
 */
export interface OfficeDetail {
  /** 职能一句话。 */
  duty: string;
  dynastyName: string;
  figures?: readonly { name: string; note: string }[];
  /** 稳定标识：`朝代:层:官名`，供列表高亮比对；树与族谱可省略。 */
  key?: string;
  modern?: string;
  note?: string;
  /** 印绶·秩石或确切品秩写法；缺失时不渲染 meta 行。 */
  rank?: string;
  salary?: string;
  title: string;
}

/** 品级阶梯的 rank-data 官职映射（rank 为必填，不会缺 meta 行）。 */
export function rankOfficeDetail(
  dynasty: RankDynasty,
  level: RankLevel,
  office: RankOffice,
): OfficeDetail {
  return {
    title: office.title,
    dynastyName: dynasty.name,
    key: `${dynasty.id}:${level.grade}:${office.title}`,
    rank: office.rank,
    duty: office.duty,
    salary: office.salary,
    note: office.note,
    modern: office.modern,
  };
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
 * 官职五维详情卡：职能 / 秩俸 / 实态·沿革 / 古今对应（参考） / 相关名臣·名将。
 * 阶梯、立体树与品级族谱共用；缺失的维度直接省略，不占位。
 */
export function OfficeDetailCard({
  ariaLabel = "官职详情",
  emptyHint = "点选任一官职，查看职能、秩俸、实态沿革、古今对应与相关名臣名将。",
  selection,
}: {
  ariaLabel?: string;
  emptyHint?: string;
  selection: OfficeDetail | null;
}) {
  if (!selection) {
    return (
      <p className="rounded-xl border border-dashed border-ink/20 bg-paper/60 px-4 py-4 text-muted-foreground text-sm">
        {emptyHint}
      </p>
    );
  }

  const office = selection;

  return (
    <aside
      aria-label={ariaLabel}
      className="min-h-[150px] rounded-xl border border-ink/15 bg-paper/70 p-5 shadow-[0_10px_28px_hsl(var(--ink)/0.08)]"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-brush text-2xl text-ink">{office.title}</span>
        <span className="rounded-sm bg-vermillion/10 px-2 py-0.5 font-brush text-vermillion text-base">
          {office.dynastyName}
        </span>
        {office.rank ? (
          <span className="font-mono-tech text-muted-foreground text-[0.7rem] tracking-[0.12em]">
            {office.rank}
          </span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        <DetailFacet label="职能" text={office.duty} />
        {office.salary ? <DetailFacet label="秩俸" text={office.salary} /> : null}
        {office.note ? <DetailFacet label="实态 · 沿革" text={office.note} /> : null}
        {office.modern ? <DetailFacet label="古今对应（参考）" text={office.modern} /> : null}
      </dl>
      {office.figures && office.figures.length > 0 ? (
        <div className="mt-3 border-t border-ink/10 pt-3">
          <span className="font-mono-tech text-[0.7rem] text-vermillion tracking-[0.2em] uppercase">
            相关名臣 · 名将
          </span>
          <ul className="mt-2 flex flex-col gap-1.5">
            {office.figures.map((figure) => (
              <li
                className="flex flex-wrap items-baseline gap-x-2 text-foreground/85 text-sm leading-relaxed"
                key={figure.name}
              >
                <span className="font-brush text-ink text-base">{figure.name}</span>
                <span>{figure.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
