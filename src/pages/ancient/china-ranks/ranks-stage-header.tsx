import { cn } from "../../../lib/utils";
import { OfficialsBackLink } from "../china-officials/officials-back-link";

/**
 * 舞台顶条：页题（左）+「品级资料」开关（右）。
 * 整条 pointer-events-none，交互子元素各自重新开启；舞台中央不悬浮任何控件。
 */
export function RanksStageHeader({
  drawerOpen,
  onToggleDrawer,
}: {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-3 lg:inset-x-5 lg:top-4">
      <div className="flex flex-col gap-1">
        <OfficialsBackLink />
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="font-brush text-3xl text-ink lg:text-4xl">品级对照</h1>
          <span className="hidden rounded-full border border-ink/15 bg-paper/80 px-3 py-0.5 font-body text-muted-foreground text-xs sm:inline">
            职官品阶对照
          </span>
        </div>
        <p className="hidden max-w-[260px] text-muted-foreground text-xs leading-relaxed lg:block">
          一树看尽：品级如何从皇权长出官职
        </p>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <button
          aria-expanded={drawerOpen}
          className={cn(
            "rounded-full border px-3 py-1 font-body text-xs shadow-[0_8px_24px_hsl(var(--ink)/0.10)] backdrop-blur-md transition-[transform,background-color,border-color] duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
            drawerOpen
              ? "border-vermillion/40 bg-vermillion/15 text-vermillion"
              : "border-ink/15 bg-paper/85 text-ink hover:border-vermillion/30",
          )}
          onClick={onToggleDrawer}
          type="button"
        >
          品级资料
        </button>
      </div>
    </div>
  );
}
