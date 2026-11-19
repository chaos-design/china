import type { ReactNode } from "react";

import { ArchiveSectionHead } from "./content-primitives";
import type { AtlasBadge, DynastyAtlas } from "./data";

const BADGE_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 补子纹样占位图：方补框内居中动物名示意，避免引入未经授权的图片。 */
function BadgeGlyph({ kind, animal }: { kind: "civil" | "military"; animal: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-10 w-14 overflow-hidden rounded-sm border border-ochre/40 bg-[#e8dcc3]"
    >
      <span className="absolute inset-1 border border-ochre/30" />
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-brush text-base leading-none text-ink/75 ${
          kind === "civil" ? "-rotate-3" : "rotate-3"
        }`}
      >
        {animal}
      </span>
    </span>
  );
}

function BadgeGrid({
  badges,
  kind,
  title,
}: {
  badges: readonly AtlasBadge[];
  kind: "civil" | "military";
  title: string;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-xl border border-ink/15 bg-card/70 p-4"
    >
      <ArchiveSectionHead
        mark={kind === "civil" ? "文" : "武"}
        title={title}
        note={kind === "civil" ? "飞禽 · 文阶" : "走兽 · 武阶"}
      />
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
        {badges.map((badge) => (
          <li
            className="flex flex-col items-center gap-1.5 rounded-lg border border-ink/10 bg-paper/60 p-2 text-center"
            key={`${kind}-${badge.order}`}
          >
            <BadgeGlyph animal={badge.animal} kind={kind} />
            <span className="font-mono-tech text-[0.7rem] text-vermillion tracking-[0.1em]">
              {BADGE_NAMES[badge.order - 1] ?? badge.order}品
            </span>
            <span className="font-brush text-sm text-ink">{badge.animal}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* 六项要义小字形装饰（图二底部条带的对应物），纯静态、aria-hidden。 */
function essentialsGlyphs(): Record<string, ReactNode> {
  return {
    rank: (
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="h-2 w-2 bg-ink/45" />
        <span className="h-3 w-2 bg-ink/55" />
        <span className="h-4 w-2 bg-ink/70" />
      </span>
    ),
    badge: (
      <span
        aria-hidden="true"
        className="flex h-4 w-5 items-center justify-center border border-ochre/60 bg-[#e8dcc3]"
      >
        <span className="h-2 w-3 border border-ochre/50" />
      </span>
    ),
    hat: (
      <span aria-hidden="true" className="flex flex-col items-center gap-0.5">
        <span className="h-2 w-2 rounded-full bg-vermillion/70" />
        <span className="h-1 w-6 rounded-[50%] border border-ink/30 bg-ink/70" />
      </span>
    ),
    robe: (
      <span
        aria-hidden="true"
        className="inline-block h-4 w-3 rounded-t-[40%] rounded-b-sm border border-ink/30 bg-ink/55"
      />
    ),
    salary: (
      <span aria-hidden="true" className="flex items-end">
        <span className="h-5 w-2.5 rounded-t-sm bg-vermillion/65" />
      </span>
    ),
    ritual: (
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="h-2 w-3 rounded-t-sm bg-ink/40" />
        <span className="h-3 w-3 rounded-t-sm bg-ink/55" />
        <span className="h-4 w-3 rounded-t-sm bg-ink/70" />
      </span>
    ),
  };
}

const ESSENTIALS: readonly { key: keyof DynastyAtlas["notes"]; title: string }[] = [
  { key: "rank", title: "品级" },
  { key: "badge", title: "补子" },
  { key: "hat", title: "顶戴" },
  { key: "robe", title: "朝服" },
  { key: "salary", title: "俸禄" },
  { key: "ritual", title: "礼序" },
];

/** 六项要义：品级 / 补子 / 顶戴 / 朝服 / 俸禄 / 礼序 的口径一览（图二底部条带）。 */
function EssentialsStrip({ atlas }: { atlas: DynastyAtlas }) {
  const glyphs = essentialsGlyphs();
  return (
    <section aria-label="六项要义" className="flex flex-col gap-3">
      <ArchiveSectionHead mark="要" title="六项要义" note="品级决定一切的一图速览" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ESSENTIALS.map(({ key, title }) => (
          <div
            className="flex flex-col items-center gap-1.5 rounded-lg border border-ink/10 bg-paper/60 px-2 py-3 text-center"
            key={key}
          >
            {glyphs[key]}
            <span className="font-brush text-base text-ink">{title}</span>
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              {atlas.notes[key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 图二：文武补子（明清才有）、礼序与六项要义。 */
export function QingRegalia({ atlas }: { atlas: DynastyAtlas }) {
  return (
    <div className="flex flex-col gap-4">
      {atlas.badgesAvailable ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <BadgeGrid badges={atlas.civilBadges} kind="civil" title="文官补子 · 飞禽" />
          <BadgeGrid badges={atlas.militaryBadges} kind="military" title="武官补子 · 走兽" />
        </div>
      ) : null}

      <section
        aria-label="补子制度"
        className="flex flex-col gap-1.5 rounded-xl border border-dashed border-ink/20 bg-paper/60 px-4 py-3"
      >
        <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
          章服制度
        </span>
        <p className="text-xs leading-relaxed text-muted-foreground">{atlas.badgeNote}</p>
      </section>

      <section
        aria-label="礼序"
        className="flex flex-col gap-3 rounded-xl border border-ochre/25 bg-paper/65 p-5 sm:flex-row sm:items-center sm:gap-6"
      >
        <div aria-hidden="true" className="flex shrink-0 items-end gap-1.5">
          {[3, 4, 5, 6, 5, 4, 3].map((height, index) => (
            <span
              className="w-3 rounded-t-sm bg-ink/45"
              key={index}
              style={{ height: `${height * 6}px` }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-vermillion uppercase">
            礼序 · 朝会位次
          </span>
          <h3 className="font-brush text-2xl text-ink">{atlas.ritual.title}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
            {atlas.ritual.text}
          </p>
          <div className="flex items-center gap-2 font-mono-tech text-[0.7rem] text-muted-foreground">
            <span>{atlas.ritual.left}</span>
            <span aria-hidden="true" className="h-px w-16 bg-vermillion/50" />
            <span>{atlas.ritual.right}</span>
          </div>
        </div>
      </section>

      <EssentialsStrip atlas={atlas} />
    </div>
  );
}
