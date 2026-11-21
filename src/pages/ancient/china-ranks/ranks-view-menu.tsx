import { DynastyChips } from "./dynasty-chips";
import type { RankTreeSpan, RankTreeSplit } from "./rank-tree-layout";
import type { RankTreeCameraPreset } from "./rank-tree-scene";
import { OptionPill } from "./ranks-option-pill";
import { PRESET_OPTIONS, SPAN_OPTIONS, SPLIT_OPTIONS } from "./ranks-options";
import type { RankDynastyId } from "./types";

/**
 * 左下「对照 · 视图」面板：朝代 / 双朝并置 / 图例 + 立体树视图控件
 * （分列 / 层高 / 视角 / 自动旋转 / 重置），全部收进这一个可收起菜单，
 * 舞台中央与顶边不再有任何悬浮控件（timeline #filterbar 的对应物）。
 * max-h 把展开高度钳在「不吞没画布中部」的上限，溢出内部滚动；
 * 收起后只剩一行，给不需要的用户让出整片画布。
 */
export function RanksViewMenu({
  collapsed,
  onToggleCollapsed,
  dynastyId,
  onChooseMain,
  compareEnabled,
  effectiveCompareId,
  onToggleCompare,
  onChooseCompare,
  gradeCount,
  officeCount,
  compareLabel,
  span,
  split,
  preset,
  autoRotate,
  onChooseSpan,
  onChooseSplit,
  onApplyPreset,
  onToggleAutoRotate,
  onResetView,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  dynastyId: RankDynastyId;
  onChooseMain: (id: RankDynastyId) => void;
  compareEnabled: boolean;
  effectiveCompareId: RankDynastyId;
  onToggleCompare: (enabled: boolean) => void;
  onChooseCompare: (id: RankDynastyId) => void;
  gradeCount: number;
  officeCount: number;
  compareLabel: string | undefined;
  span: RankTreeSpan;
  split: RankTreeSplit;
  preset: RankTreeCameraPreset | null;
  autoRotate: boolean;
  onChooseSpan: (span: RankTreeSpan) => void;
  onChooseSplit: (split: RankTreeSplit) => void;
  onApplyPreset: (preset: RankTreeCameraPreset) => void;
  onToggleAutoRotate: () => void;
  onResetView: () => void;
}) {
  return (
    <section
      aria-label="对照视图"
      className="absolute bottom-3 left-3 z-20 flex max-h-[calc(100%-1.5rem)] w-[min(360px,calc(100%-1.5rem))] flex-col gap-3 overflow-y-auto rounded-2xl border border-ink/15 bg-paper/85 p-4 shadow-[0_18px_48px_hsl(var(--ink)/0.14)] backdrop-blur-xl lg:bottom-5 lg:left-5 lg:w-[360px]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
          对照 · 视图
        </span>
        <button
          aria-expanded={!collapsed}
          className="rounded-full border border-ink/15 bg-card/70 px-2.5 py-0.5 font-body text-[0.7rem] text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onToggleCollapsed}
          type="button"
        >
          {collapsed ? "展开" : "收起"}
        </button>
      </div>

      {!collapsed ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <DynastyChips ariaLabel="朝代选择" currentId={dynastyId} onSelect={onChooseMain} />
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground">
              {gradeCount} 级 · {officeCount} 官{compareLabel ? ` / ${compareLabel}` : ""}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <fieldset aria-label="双朝并置" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                双朝并置
              </span>
              <div className="flex gap-2">
                <OptionPill
                  active={!compareEnabled}
                  label="单朝"
                  onSelect={() => {
                    onToggleCompare(false);
                  }}
                />
                <OptionPill
                  active={compareEnabled}
                  label="朝代对比"
                  onSelect={() => {
                    onToggleCompare(true);
                  }}
                />
              </div>
            </fieldset>
            {compareEnabled ? (
              <DynastyChips
                ariaLabel="对比朝代选择"
                currentId={effectiveCompareId}
                disabledId={dynastyId}
                onSelect={onChooseCompare}
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 border-ink/10 border-t pt-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-vermillion" />
                文官
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blueprint" />
                武官
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-px w-3 bg-ink/40" />
                双枝 · 品级台
              </span>
            </div>
            <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.08em]">
              {span === "band" ? "品序轴 · 超品↓流外" : "层级轴 · 等距"} ·{" "}
              {split === "branch" ? "文武分列" : "文武合列"}
            </span>
          </div>

          {/* 立体树视图控件：分列 / 层高 / 视角。 */}
          <div className="flex flex-col gap-2.5 border-ink/10 border-t pt-2.5">
            <fieldset aria-label="分列模式" className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                分列
              </span>
              <div className="flex flex-wrap gap-2">
                {SPLIT_OPTIONS.map((option) => (
                  <OptionPill
                    active={split === option.id}
                    hint={option.hint}
                    key={option.id}
                    label={option.label}
                    onSelect={() => {
                      onChooseSplit(option.id);
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset aria-label="层高模式" className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                层高
              </span>
              <div className="flex flex-wrap gap-2">
                {SPAN_OPTIONS.map((option) => (
                  <OptionPill
                    active={span === option.id}
                    hint={option.hint}
                    key={option.id}
                    label={option.label}
                    onSelect={() => {
                      onChooseSpan(option.id);
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset aria-label="视角预设" className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono-tech text-[0.7rem] text-muted-foreground tracking-[0.2em]">
                视角
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_OPTIONS.map((option) => (
                  <OptionPill
                    active={preset === option.id}
                    key={option.id}
                    label={option.label}
                    onSelect={() => {
                      onApplyPreset(option.id);
                    }}
                  />
                ))}
                <OptionPill
                  active={autoRotate}
                  label={autoRotate ? "停止旋转" : "自动旋转"}
                  onSelect={onToggleAutoRotate}
                />
                <OptionPill active={false} label="重置视角" onSelect={onResetView} />
              </div>
            </fieldset>
          </div>
        </div>
      ) : null}
    </section>
  );
}
