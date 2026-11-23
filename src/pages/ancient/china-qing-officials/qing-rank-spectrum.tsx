import { cn } from "../../../lib/utils";
import { ArchiveSectionHead } from "./content-primitives";
import type { AtlasRankLevel, DynastyAtlas } from "./data";
import { HatIllustration, RankImageCredits, RobeIllustration } from "./rank-illustrations";
import { hatImage, type RankImage, robeImage } from "./rank-images";
import { formatCnyCompact, salaryToTaels, silverNote, silverTaelsToCny } from "./silver-value";

export function HatGlyph({ level }: { level: AtlasRankLevel }) {
  return <HatIllustration level={level} />;
}

export function RobeGlyph({ dynastyId, level }: { dynastyId: string; level: AtlasRankLevel }) {
  return <RobeIllustration dynastyId={dynastyId} level={level} />;
}

function SectionHead({ mark, title, note }: { mark: string; title: string; note?: string }) {
  return <ArchiveSectionHead mark={mark} title={title} note={note} />;
}

/** 顶戴全谱：每级一枚，点选与阶梯 / 档案卡联动。 */
function HatSpectrum({
  atlas,
  selectedLabel,
  onSelect,
}: {
  atlas: DynastyAtlas;
  selectedLabel: string;
  onSelect: (label: string) => void;
}) {
  const images = atlas.levels
    .map((item) => hatImage(item.hat))
    .filter((image): image is RankImage => image !== undefined);
  return (
    <section aria-label="顶戴全谱" className="flex flex-col gap-3">
      <SectionHead mark="冠" title="顶戴 · 全谱" note={atlas.notes.hat} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-9">
        {atlas.levels.map((item) => {
          const active = item.label === selectedLabel;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "border-vermillion/45 bg-vermillion/10"
                  : "border-ink/10 bg-card/70 hover:border-vermillion/25",
              )}
              key={item.label}
              onClick={() => onSelect(item.label)}
              type="button"
            >
              <span className={cn("font-brush text-sm", active ? "text-vermillion" : "text-ink")}>
                {item.label}
              </span>
              <HatGlyph level={item} />
              <span className="font-body text-xs leading-snug text-foreground/85">
                {item.hat ?? "未详"}
              </span>
              {item.hatBeads ? (
                <span className="text-[0.7rem] text-muted-foreground">{item.hatBeads}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <RankImageCredits images={images} />
    </section>
  );
}

/** 朝服全谱：按服色名连续分组，色块 + 覆盖品级。 */
function RobeSpectrum({ atlas }: { atlas: DynastyAtlas }) {
  const groups: { robe: string; color: string; members: AtlasRankLevel[] }[] = [];
  for (const item of atlas.levels) {
    const robe = item.robe ?? "未详";
    const last = groups[groups.length - 1];
    if (last && last.robe === robe) {
      last.members.push(item);
    } else {
      groups.push({ robe, color: item.robeColor ?? "#6a6a6a", members: [item] });
    }
  }
  const images = groups
    .map((group) => robeImage(atlas.id, group.robe))
    .filter((image): image is RankImage => image !== undefined);
  return (
    <section aria-label="朝服全谱" className="flex flex-col gap-3">
      <SectionHead mark="服" title="朝服 · 全谱" note={atlas.notes.robe} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {groups.map((group) => (
          <div
            className="flex flex-col items-center gap-1.5 rounded-lg border border-ink/10 bg-card/70 px-2 py-2.5 text-center"
            key={group.robe}
          >
            <RobeIllustration dynastyId={atlas.id} level={group.members[0]!} />
            <span
              aria-hidden="true"
              className="block h-1 w-8 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span className="font-brush text-sm leading-snug text-ink">{group.robe}</span>
            <span className="font-mono-tech text-[0.7rem] leading-relaxed text-muted-foreground">
              {group.members.map((member) => member.label).join(" · ")}
            </span>
          </div>
        ))}
      </div>
      <RankImageCredits images={images} />
    </section>
  );
}

/** 俸禄阶梯：每级一根柱，柱高为相对示意，标注岁俸实数（如有）。 */
function SalarySpectrum({
  atlas,
  fetchingSilver,
  onFetchSilverPrice,
  onSelect,
  onSilverInputChange,
  selectedLabel,
  silverInput,
  silverPrice,
  silverSource,
}: {
  atlas: DynastyAtlas;
  fetchingSilver: boolean;
  onFetchSilverPrice: () => void;
  onSelect: (label: string) => void;
  onSilverInputChange: (raw: string) => void;
  selectedLabel: string;
  silverInput: string;
  silverPrice: number;
  silverSource: string;
}) {
  const exact = salaryToTaels(atlas.levels[0]?.salary ?? 0, atlas.levels[0]?.salaryLabel).exact;

  return (
    <section aria-label="俸禄阶梯" className="flex flex-col gap-3">
      <SectionHead mark="俸" title="俸禄 · 阶梯" note="柱高为相对示意 · 金额随银价折算" />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/12 bg-paper/60 px-3 py-2">
        <label
          className="font-mono-tech text-[0.65rem] tracking-[0.1em] text-muted-foreground"
          htmlFor="silver-price-input"
        >
          银价 元/克
        </label>
        <input
          aria-label="银价（元/克）"
          className="w-24 rounded-md border border-ink/20 bg-card/80 px-2 py-1 font-mono-tech text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          id="silver-price-input"
          min="0.01"
          onChange={(event) => onSilverInputChange(event.target.value)}
          step="0.01"
          type="number"
          value={silverInput}
        />
        <button
          className="rounded-full border border-vermillion/35 bg-vermillion/10 px-3 py-1 font-body text-[0.7rem] text-vermillion transition-colors hover:bg-vermillion/15 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          disabled={fetchingSilver}
          onClick={onFetchSilverPrice}
          type="button"
        >
          {fetchingSilver ? "查询中…" : "查询银价"}
        </button>
        <span className="rounded-md border border-ochre/35 bg-ochre/10 px-2 py-0.5 font-mono-tech text-[0.62rem] text-ochre">
          {silverNote(silverPrice, silverSource, exact)}
        </span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[40rem] items-end gap-1.5">
          {atlas.levels.map((item) => {
            const active = item.label === selectedLabel;
            const salary = salaryToTaels(item.salary, item.salaryLabel);
            return (
              <button
                aria-pressed={active}
                className={cn(
                  "flex min-w-[2.75rem] flex-1 flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-vermillion/45 bg-vermillion/10"
                    : "border-transparent hover:border-vermillion/25",
                )}
                key={item.label}
                onClick={() => onSelect(item.label)}
                type="button"
              >
                <span className="font-mono-tech text-[0.7rem] whitespace-nowrap text-muted-foreground">
                  {item.salaryLabel ?? `${item.salary} 等`}
                </span>
                <span className="font-mono-tech text-[0.62rem] leading-none text-vermillion/85">
                  ≈{formatCnyCompact(silverTaelsToCny(salary.taels, silverPrice))}
                </span>
                <span className="flex h-24 w-full items-end justify-center sm:h-28">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative block w-5 rounded-t-sm shadow-[2px_-2px_0_hsl(var(--vermillion)/0.16)]",
                      active ? "bg-vermillion" : "bg-vermillion/60",
                    )}
                    style={{ height: `${Math.max(8, item.salary)}%` }}
                  >
                    <span className="absolute inset-y-0 -right-1.5 w-1.5 origin-left -skew-y-45 bg-vermillion/20" />
                    <span className="absolute -top-1 left-0 h-1.5 w-full -skew-x-45 bg-vermillion/25" />
                  </span>
                </span>
                <span
                  className={cn(
                    "font-body text-[0.7rem] leading-none",
                    active ? "text-vermillion" : "text-foreground/80",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 图二全谱条带：顶戴 / 朝服 / 俸禄一次看全，选中态与阶梯、档案卡共享。 */
export function QingRankSpectrum({
  atlas,
  fetchingSilver,
  onFetchSilverPrice,
  onSelect,
  onSilverInputChange,
  selectedLabel,
  silverInput,
  silverPrice,
  silverSource,
}: {
  atlas: DynastyAtlas;
  fetchingSilver: boolean;
  onFetchSilverPrice: () => void;
  onSelect: (label: string) => void;
  onSilverInputChange: (raw: string) => void;
  selectedLabel: string;
  silverInput: string;
  silverPrice: number;
  silverSource: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <HatSpectrum atlas={atlas} selectedLabel={selectedLabel} onSelect={onSelect} />
      <RobeSpectrum atlas={atlas} />
      <SalarySpectrum
        atlas={atlas}
        fetchingSilver={fetchingSilver}
        onFetchSilverPrice={onFetchSilverPrice}
        onSelect={onSelect}
        onSilverInputChange={onSilverInputChange}
        selectedLabel={selectedLabel}
        silverInput={silverInput}
        silverPrice={silverPrice}
        silverSource={silverSource}
      />
    </div>
  );
}
