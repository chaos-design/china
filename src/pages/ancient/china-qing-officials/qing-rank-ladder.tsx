import { useState } from "react";

import { cn } from "../../../lib/utils";
import type { AtlasRankLevel, DynastyAtlas } from "./data";

function HatGlyph({ level }: { level: AtlasRankLevel }) {
  return (
    <span aria-hidden="true" className="flex flex-col items-center gap-0.5">
      <span
        className="h-3 w-3 rounded-full border border-ink/25 shadow-[inset_0_-2px_3px_hsl(var(--ink)/0.2)]"
        style={{ backgroundColor: level.hatColor ?? "#8a8a8a" }}
      />
      <span className="h-1.5 w-9 rounded-[50%] border border-ink/30 bg-ink/70" />
    </span>
  );
}

function RobeGlyph({ level }: { level: AtlasRankLevel }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-7 w-5 rounded-t-[40%] rounded-b-md border border-ink/25 shadow-[inset_0_0_0_2px_hsl(var(--paper)/0.25)]"
      style={{ backgroundColor: level.robeColor ?? "#6a6a6a" }}
    />
  );
}

/** 图二：品秩阶梯。点选一级，下方联动顶戴 / 朝服 / 俸禄 / 职官。 */
export function QingRankLadder({ atlas }: { atlas: DynastyAtlas }) {
  const [selectedLabel, setSelectedLabel] = useState(atlas.levels[0]?.label ?? "");
  const selected = atlas.levels.find((item) => item.label === selectedLabel) ?? atlas.levels[0]!;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">品秩 · {atlas.rankSystemLabel}</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{atlas.rankIntro}</p>
      </div>

      {/* 阶梯：以分组为行，行内按品级从高到低排布，越往下档位越宽。 */}
      <section aria-label="品级阶梯" className="flex flex-col gap-2">
        {atlas.ladderGroups.map((entry, index) => (
          <div className="flex items-stretch gap-2" key={entry.label}>
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
                .filter((item) => entry.orders.includes(item.order))
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
        ))}
      </section>

      {/* 选中级的完整档案 */}
      <section
        aria-label={`${selected.label}档案`}
        className="grid gap-3 rounded-xl border border-ink/15 bg-card/75 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
            顶戴 · 章服
          </span>
          <HatGlyph level={selected} />
          <span className="font-brush text-lg text-ink">{selected.hat ?? "未详"}</span>
          {selected.hatBeads ? (
            <span className="text-xs text-muted-foreground">{selected.hatBeads}</span>
          ) : null}
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{atlas.notes.hat}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
            朝服
          </span>
          <RobeGlyph level={selected} />
          <span className="font-brush text-lg text-ink">{selected.robe ?? "未详"}</span>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{atlas.notes.robe}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
            俸禄 · 参考
          </span>
          <div className="flex h-12 w-full items-end justify-center">
            <span
              className="w-10 rounded-t-sm bg-vermillion/65"
              style={{ height: `${Math.max(8, selected.salary)}%` }}
            />
          </div>
          <span className="font-brush text-lg text-ink">
            {selected.salaryLabel ?? `${selected.salary} 等`}
          </span>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            {atlas.notes.salary}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
            本级职官
          </span>
          <span className="font-brush text-base leading-snug text-ink">{selected.label}</span>
          <p className="text-xs leading-relaxed text-foreground/85">{selected.offices}</p>
          <p className="border-ink/10 border-t pt-1.5 text-[0.7rem] text-muted-foreground">
            制度口径：{atlas.rankSystemLabel}
          </p>
        </div>
      </section>
    </div>
  );
}
