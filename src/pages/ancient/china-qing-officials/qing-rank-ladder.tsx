import type { CSSProperties } from "react";
import { useState } from "react";

import { cn } from "../../../lib/utils";
import { ArchiveSectionHead } from "./content-primitives";
import type { DynastyAtlas } from "./data";
import { HatGlyph, QingRankSpectrum, RobeGlyph } from "./qing-rank-spectrum";
import {
  fetchSilverPriceCnyPerGram,
  formatCny,
  SILVER_PRICE_DATE,
  SILVER_PRICE_PER_GRAM_CNY,
  salaryToTaels,
  silverNote,
  silverTaelsToCny,
} from "./silver-value";

/* 阶梯金字塔化：首行最窄、末行占满，宽度随分组序号线性放宽（图二的塔形轮廓）。 */
function pyramidWidth(index: number, count: number): string {
  if (count <= 1) return "100%";
  return `${Math.round(52 + (48 * index) / (count - 1))}%`;
}

/** 图二：品秩阶梯（金字塔）＋ 选中级档案卡 ＋ 顶戴 / 朝服 / 俸禄全谱。 */
export function QingRankLadder({ atlas }: { atlas: DynastyAtlas }) {
  const [selectedLabel, setSelectedLabel] = useState(atlas.levels[0]?.label ?? "");
  const selected = atlas.levels.find((item) => item.label === selectedLabel) ?? atlas.levels[0]!;
  const groupCount = atlas.ladderGroups.length;
  const salary = salaryToTaels(selected.salary, selected.salaryLabel);
  const [silverInput, setSilverInput] = useState(String(SILVER_PRICE_PER_GRAM_CNY));
  const [silverPrice, setSilverPrice] = useState(SILVER_PRICE_PER_GRAM_CNY);
  const [silverSource, setSilverSource] = useState(SILVER_PRICE_DATE);
  const [fetchingSilver, setFetchingSilver] = useState(false);
  // 当前价格是否来自实时查询：用于价格徽标的强调档位；手动改价即回落为普通高亮。
  const [silverLive, setSilverLive] = useState(false);

  const changeSilverPrice = (raw: string) => {
    setSilverInput(raw);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      setSilverPrice(parsed);
      setSilverSource("自定义");
      setSilverLive(false);
    }
  };

  const refreshSilverPrice = async () => {
    setFetchingSilver(true);
    const live = await fetchSilverPriceCnyPerGram();
    if (live) {
      setSilverPrice(live.cnyPerGram);
      setSilverInput(String(live.cnyPerGram));
      setSilverSource(
        `现查 · ${live.usdPerOunce.toFixed(2)} 美元/盎司 × ${live.usdCnyRate.toFixed(3)}`,
      );
      setSilverLive(true);
    } else {
      setSilverSource("查询失败，沿用当前价");
      setSilverLive(false);
    }
    setFetchingSilver(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">品秩 · {atlas.rankSystemLabel}</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{atlas.rankIntro}</p>
      </div>

      {/* 阶梯：以分组为行，行内按品级从高到低排布，行宽自上而下放宽成塔形。 */}
      <section aria-label="品级阶梯" className="flex flex-col gap-3">
        <ArchiveSectionHead mark="阶" title="品秩阶梯" note="自上而下 · 品级由高至低" />
        {/* 透视轴与圆点共用同一中心（left-[15.5px] + w-px ⇒ 中轴 x=16），
            圆点即顶珠形制，与顶戴图标同源；行宽自上而下放宽成塔形。 */}
        <div className="relative flex flex-col gap-3 pl-8">
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[15.5px] top-3 w-px bg-[linear-gradient(180deg,hsl(var(--vermillion)/0.08),hsl(var(--vermillion)/0.4)_50%,hsl(var(--vermillion)/0.08))]"
          />
          {atlas.ladderGroups.map((entry, index) => (
            <div className="relative" key={entry.label}>
              <span
                aria-hidden="true"
                className="absolute left-[-16px] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute inset-0 rounded-full bg-vermillion/85 shadow-[0_1px_2px_hsl(var(--ink)/0.25)] ring-2 ring-paper" />
                <span className="absolute left-[20%] top-[16%] h-1 w-1 rounded-full bg-paper/85" />
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 bottom-0 h-2 rounded-b-lg bg-ink/[0.07] blur-[2px]"
              />
              <div
                className="relative flex items-stretch gap-2 sm:mx-auto sm:w-[var(--row-w)]"
                style={
                  {
                    "--row-w": pyramidWidth(index, groupCount),
                    transform: `perspective(1100px) rotateX(${1.5 + index * 0.9}deg)`,
                    transformOrigin: "center bottom",
                  } as CSSProperties
                }
              >
                <span className="flex w-20 shrink-0 items-center font-brush text-base text-ink sm:w-28 sm:text-lg">
                  {entry.label}
                </span>
                <div
                  className={cn(
                    "flex flex-1 flex-wrap gap-1.5 rounded-lg border border-ink/12 bg-paper/55 p-2",
                    index >= 3 && "bg-paper/70",
                  )}
                >
                  {atlas.levels
                    .filter(
                      (item) =>
                        entry.orders.includes(item.order) &&
                        (!entry.grade || item.grade === entry.grade),
                    )
                    .map((item) => {
                      const active = item.label === selectedLabel;
                      return (
                        <button
                          aria-pressed={active}
                          className={cn(
                            "flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            active
                              ? "border-vermillion/45 bg-vermillion/10"
                              : "border-ink/10 bg-card/70 hover:border-vermillion/25",
                          )}
                          key={item.label}
                          onClick={() => setSelectedLabel(item.label)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "font-brush text-sm",
                              active ? "text-vermillion" : "text-ink",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
                            {item.salaryLabel ?? `${item.salary} 等`}
                          </span>
                        </button>
                      );
                    })}
                  <span className="w-full font-body text-[0.7rem] text-muted-foreground sm:w-auto sm:flex-1 sm:self-center">
                    {entry.note}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="pl-8 font-mono-tech text-[0.6rem] text-muted-foreground">
          上层品秩高而窄 · 下层所辖广而深
        </p>
      </section>

      {/* 选中级的完整档案 */}
      <section
        aria-label={`${selected.label}档案`}
        className="flex flex-col gap-4 rounded-xl border border-ink/15 bg-card/75 p-4"
      >
        <ArchiveSectionHead
          mark="档"
          title={`${selected.label} · 本级档案`}
          note="顶戴 · 朝服 · 俸禄"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-mono-tech text-[0.7rem] text-vermillion">顶戴 · 章服</span>
            {/* 三列共用固定高度媒体槽：图形底部对齐，正文起点一致 */}
            <div className="flex h-24 w-full items-end justify-center">
              <HatGlyph level={selected} />
            </div>
            <span className="font-brush text-lg text-ink">{selected.hat ?? "未详"}</span>
            {selected.hatBeads ? (
              <span className="text-xs text-muted-foreground">{selected.hatBeads}</span>
            ) : null}
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{atlas.notes.hat}</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-mono-tech text-[0.7rem] text-vermillion">朝服</span>
            <div className="flex h-24 w-full items-end justify-center">
              <RobeGlyph dynastyId={atlas.id} level={selected} />
            </div>
            <span className="font-brush text-lg text-ink">{selected.robe ?? "未详"}</span>
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              {atlas.notes.robe}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-mono-tech text-[0.7rem] text-vermillion">俸禄 · 参考</span>
            <div className="flex h-24 w-full items-end justify-center">
              <span
                className="w-10 rounded-t-sm bg-vermillion/65"
                style={{ height: `${Math.max(6, Math.round(selected.salary * 0.62))}px` }}
              />
            </div>
            <span className="font-brush text-lg text-ink">
              {selected.salaryLabel ?? `${selected.salary} 等`}
            </span>
            <span className="rounded-full border border-vermillion/30 bg-vermillion/12 px-3 py-1 font-mono-tech text-sm font-semibold tracking-wide text-vermillion">
              约合 {formatCny(silverTaelsToCny(salary.taels, silverPrice))}
            </span>
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              {atlas.notes.salary}
            </p>
            <p className="text-[0.65rem] leading-relaxed text-muted-foreground/80">
              {silverNote(silverPrice, silverSource, salary.exact)}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className="font-mono-tech text-[0.7rem] text-vermillion">本级职官</span>
            <span className="font-brush text-base leading-snug text-ink">{selected.label}</span>
            <p className="text-xs leading-relaxed text-foreground/85">{selected.offices}</p>
            <p className="border-ink/10 border-t pt-1.5 text-[0.7rem] text-muted-foreground">
              制度口径：{atlas.rankSystemLabel}
            </p>
          </div>
        </div>
      </section>

      {/* 全谱条带：顶戴 / 朝服 / 俸禄一次看全 */}
      <QingRankSpectrum
        atlas={atlas}
        fetchingSilver={fetchingSilver}
        onFetchSilverPrice={refreshSilverPrice}
        onSelect={setSelectedLabel}
        onSilverInputChange={changeSilverPrice}
        selectedLabel={selectedLabel}
        silverInput={silverInput}
        silverLive={silverLive}
        silverPrice={silverPrice}
        silverSource={silverSource}
      />
    </div>
  );
}
