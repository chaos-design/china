import { cn } from "../../../lib/utils";
import {
  QING_CIVIL_BADGES,
  QING_MILITARY_BADGES,
  QING_RANK_NOTES,
  type QingBadge,
} from "./qing-officials-data";

const BADGE_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 补子纹样占位图：以对称符号示意飞禽 / 走兽，避免引入未经授权的图片。 */
function BadgeGlyph({ kind }: { kind: "civil" | "military" }) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-10 w-14 overflow-hidden rounded-sm border border-ochre/40 bg-[#e8dcc3]"
    >
      <span className="absolute inset-1 border border-ochre/30" />
      <span
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-brush text-2xl text-ink/70",
          kind === "civil" ? "rotate-[-8deg]" : "rotate-[8deg]",
        )}
      >
        {kind === "civil" ? "羽" : "兽"}
      </span>
    </span>
  );
}

function BadgeGrid({
  badges,
  kind,
  title,
}: {
  badges: readonly QingBadge[];
  kind: "civil" | "military";
  title: string;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-xl border border-ink/15 bg-card/70 p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-brush text-xl text-ink">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{QING_RANK_NOTES.badge}</p>
      </div>
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
        {badges.map((badge) => (
          <li
            className="flex flex-col items-center gap-1.5 rounded-lg border border-ink/10 bg-paper/60 p-2 text-center"
            key={`${kind}-${badge.order}`}
          >
            <BadgeGlyph kind={kind} />
            <span className="font-mono-tech text-[0.7rem] text-vermillion tracking-[0.1em]">
              {BADGE_NAMES[badge.order - 1]}品
            </span>
            <span className="font-brush text-sm text-ink">{badge.animal}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 图二：文武补子 + 礼序，两者都是"品级看得见"的体现。 */
export function QingRegalia() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <BadgeGrid badges={QING_CIVIL_BADGES} kind="civil" title="文官补子 · 飞禽" />
        <BadgeGrid badges={QING_MILITARY_BADGES} kind="military" title="武官补子 · 走兽" />
      </div>

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
          <h3 className="font-brush text-2xl text-ink">品级决定站在哪里</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
            {QING_RANK_NOTES.ritual}
          </p>
          <div className="flex items-center gap-2 font-mono-tech text-[0.7rem] text-muted-foreground">
            <span>上僚</span>
            <span aria-hidden="true" className="h-px w-16 bg-vermillion/50" />
            <span>下僚</span>
          </div>
        </div>
      </section>
    </div>
  );
}
