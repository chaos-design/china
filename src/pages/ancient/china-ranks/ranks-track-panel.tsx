import { useState } from "react";

import { getRankDynasty, RANK_TRACKS } from "./rank-data";
import { OptionPill } from "./ranks-option-pill";

/** 追踪 tab：六条职系 chips 单选，纵向列出该职系在八个王朝的停靠点。 */
export function TrackPanel() {
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
