import { cn } from "../../../lib/utils";

/**
 * 单选中性胶囊：工具条、抽屉面板与筛选面板共用的二选一 / 多选一控件。
 * 与 DynastyChips（朝代选择）不同，它不绑定数据，只表达当前选中态。
 */
export function OptionPill({
  active,
  hint,
  label,
  onSelect,
}: {
  active: boolean;
  hint?: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
          : "border-ink/15 bg-card/70 text-muted-foreground hover:border-vermillion/30 hover:bg-vermillion/5",
      )}
      onClick={onSelect}
      title={hint}
      type="button"
    >
      {label}
    </button>
  );
}
