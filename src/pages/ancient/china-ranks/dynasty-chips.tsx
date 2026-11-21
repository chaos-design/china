import { cn } from "../../../lib/utils";
import { RANK_DYNASTIES } from "./rank-data";
import type { RankDynastyId } from "./types";

/** 八朝朝代胶囊：阶梯、立体树与对比选择共用同一套按钮样式与语义。 */
export function DynastyChips({
  ariaLabel,
  currentId,
  disabledId,
  onSelect,
}: {
  ariaLabel: string;
  currentId: RankDynastyId;
  disabledId?: RankDynastyId;
  onSelect: (id: RankDynastyId) => void;
}) {
  return (
    <fieldset aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {RANK_DYNASTIES.map((dynasty) => {
        const active = dynasty.id === currentId;
        const disabled = dynasty.id === disabledId;

        return (
          <button
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-brush text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
                : "border-ink/15 bg-card/70 text-ink hover:border-vermillion/30 hover:bg-vermillion/5",
              disabled && "cursor-not-allowed opacity-40 hover:border-ink/15 hover:bg-card/70",
            )}
            disabled={disabled}
            key={dynasty.id}
            onClick={() => {
              if (!disabled) {
                onSelect(dynasty.id);
              }
            }}
            type="button"
          >
            {dynasty.name}
          </button>
        );
      })}
    </fieldset>
  );
}
