import { ArchiveSectionHead } from "./content-primitives";
import type { AtlasBadge, DynastyAtlas } from "./data";
import {
  BadgeIllustration,
  EssentialIllustration,
  type EssentialName,
  RankImageCredits,
} from "./rank-illustrations";
import { badgeImage, type RankImage } from "./rank-images";

const BADGE_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 补子纹样：真实刺绣藏品照优先（按朝代取本朝实物，缺图回落手绘），动物名退为图下小注。 */
function BadgeGlyph({
  animal,
  kind,
  dynastyId,
}: {
  animal: string;
  kind: "civil" | "military";
  dynastyId?: string;
}) {
  return <BadgeIllustration animal={animal} kind={kind} dynastyId={dynastyId} />;
}

function BadgeGrid({
  badges,
  kind,
  title,
  dynastyId,
}: {
  badges: readonly AtlasBadge[];
  kind: "civil" | "military";
  title: string;
  dynastyId?: string;
}) {
  const images = badges
    .map((badge) => badgeImage(badge.animal, dynastyId))
    .filter((image): image is RankImage => image !== undefined);
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
            <BadgeGlyph animal={badge.animal} kind={kind} dynastyId={dynastyId} />
            <span className="font-mono-tech text-[0.7rem] text-vermillion">
              {BADGE_NAMES[badge.order - 1] ?? badge.order}品
            </span>
            <span className="font-brush text-sm text-ink">{badge.animal}</span>
          </li>
        ))}
      </ol>
      <RankImageCredits images={images} />
    </section>
  );
}

const ESSENTIALS: readonly { key: EssentialName; title: string }[] = [
  { key: "rank", title: "品级" },
  { key: "badge", title: "补子" },
  { key: "hat", title: "顶戴" },
  { key: "robe", title: "朝服" },
  { key: "salary", title: "俸禄" },
  { key: "ritual", title: "礼序" },
];

/** 六项要义：品级 / 补子 / 顶戴 / 朝服 / 俸禄 / 礼序 的口径一览（图二底部条带）。 */
function EssentialsStrip({ atlas }: { atlas: DynastyAtlas }) {
  return (
    <section aria-label="六项要义" className="flex flex-col gap-3">
      <ArchiveSectionHead mark="要" title="六项要义" note="品级决定一切的一图速览" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ESSENTIALS.map(({ key, title }) => (
          <div
            className="flex flex-col items-center gap-1.5 rounded-lg border border-ink/10 bg-paper/60 px-2 py-3 text-center"
            key={key}
          >
            <EssentialIllustration name={key} />
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
          <BadgeGrid
            badges={atlas.civilBadges}
            dynastyId={atlas.id}
            kind="civil"
            title="文官补子 · 飞禽"
          />
          <BadgeGrid
            badges={atlas.militaryBadges}
            dynastyId={atlas.id}
            kind="military"
            title="武官补子 · 走兽"
          />
        </div>
      ) : null}

      <section
        aria-label="补子制度"
        className="flex flex-col gap-1.5 rounded-xl border border-dashed border-ink/20 bg-paper/60 px-4 py-3"
      >
        <span className="font-mono-tech text-[0.7rem] text-vermillion">章服制度</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{atlas.badgeNote}</p>
      </section>

      <section
        aria-label="礼序"
        className="flex flex-col gap-3 rounded-xl border border-ochre/25 bg-paper/65 p-5 sm:flex-row sm:items-center sm:gap-6"
      >
        <div aria-hidden="true" className="flex shrink-0 flex-col items-center">
          <div className="flex items-end gap-1.5">
            {[3, 4, 5, 6, 5, 4, 3].map((height, index) => {
              const distance = Math.abs(index - 3);
              return (
                <span
                  className="relative block w-3 rounded-t-sm bg-ink/45 shadow-[2px_-2px_0_hsl(var(--ink)/0.07)]"
                  key={index}
                  style={{
                    height: `${height * 6}px`,
                    transform: `perspective(420px) rotateY(${(index - 3) * 6}deg) scale(${1 - distance * 0.07})`,
                    transformOrigin: "bottom center",
                  }}
                />
              );
            })}
          </div>
          <span className="mt-1 h-2 w-32 rounded-[50%] border border-vermillion/20 bg-vermillion/[0.04]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="flex flex-col gap-1.5 font-brush text-2xl text-ink">
            <span className="font-mono-tech text-[0.7rem] text-vermillion">礼序、朝会位次</span>
            {atlas.ritual.title}
          </h3>
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
