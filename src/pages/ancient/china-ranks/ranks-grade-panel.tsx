import { useState } from "react";

import { RANK_DYNASTIES, resolveOfficeBand } from "./rank-data";
import { GRADE_BANDS, GRADE_LABELS } from "./rank-ladder-panel";
import { OptionPill } from "./ranks-option-pill";
import type { RankBand } from "./types";

/** 断面 tab：品序 chips × 八朝纵向卡片；秦汉「约当」保留示意标注与口径脚注。 */
export function GradePanel() {
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
