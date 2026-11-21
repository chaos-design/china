import { cn } from "../../../lib/utils";
import type { OfficialPost, OfficialsDynasty } from "../china-officials/officials-data";
import type { OfficeDetail } from "./office-detail-card";
import { OfficeDetailCard } from "./office-detail-card";
import type { RankTreeTier } from "./rank-tree-layout";
import type { RankTreePick } from "./rank-tree-scene";

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
export function TreePanel({
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
