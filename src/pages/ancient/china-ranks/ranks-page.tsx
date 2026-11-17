import { rankOfficeDetail } from "./office-detail-card";
import { RanksDrawer } from "./ranks-drawer";
import { RanksHoverReadout } from "./ranks-hover-readout";
import { RanksSceneStatus } from "./ranks-scene-status";
import { RanksStageHeader } from "./ranks-stage-header";
import { RanksViewMenu } from "./ranks-view-menu";
import { useRanksStage } from "./use-ranks-stage";

/**
 * 品级纵横：八朝官位品级对比的**单屏沉浸页**。
 *
 * 本文件现在是纯组合层：状态与派生数据交给 useRanksStage，场景生命周期交给
 * useRankTreeScene，布局拆成舞台顶条 / 左下对照视图菜单 / 底部读出 / 右侧抽屉 /
 * 画布状态层五个组件。整页永不滚动：Three.js 画布 absolute inset-0 全幅垫底，
 * 所有 UI 都是画布上方的悬浮面板（参照 /china/timeline 的 #cv + 面板模式）。
 * 勿改回「舞台 + 下方滚动 section」的结构。
 */
export function RanksPage() {
  const stage = useRanksStage();

  const compareLabel = stage.compareDynasty
    ? `${stage.compareDynasty.name} ${stage.compareDynasty.grades.length} 级 · ${stage.compareOfficeCount} 官`
    : undefined;

  return (
    <article className="bg-paper relative h-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_38%,hsl(var(--ink)/0.07),transparent_68%)]">
      {/* 全幅画布宿主：场景 ResizeObserver 自适应容器，取景自动随全幅宽高比。 */}
      <div className="absolute inset-0 z-0">
        <div
          aria-label={`${stage.mainDynasty.name}官品立体树：${stage.mainDynasty.grades.length} 级、${stage.officeCount} 个官职${
            stage.compareDynasty ? `；与${stage.compareDynasty.name}并置对照` : ""
          }。拖拽旋转、滚轮缩放、点击节点查看职权。`}
          className="h-full w-full"
          ref={stage.scene.hostRef}
          role="img"
        />
        <RanksSceneStatus
          ready={stage.scene.ready}
          failed={stage.scene.failed}
          onOpenGenealogy={stage.openGenealogy}
          onRetry={stage.scene.retry}
        />
      </div>

      <RanksStageHeader drawerOpen={stage.drawerOpen} onToggleDrawer={stage.toggleDrawer} />

      <RanksViewMenu
        collapsed={stage.filterCollapsed}
        onToggleCollapsed={stage.toggleFilterCollapsed}
        dynastyId={stage.dynastyId}
        onChooseMain={stage.chooseMain}
        compareEnabled={stage.compareEnabled}
        effectiveCompareId={stage.effectiveCompareId}
        onToggleCompare={stage.toggleCompare}
        onChooseCompare={stage.chooseCompare}
        gradeCount={stage.mainDynasty.grades.length}
        officeCount={stage.officeCount}
        compareLabel={compareLabel}
        span={stage.span}
        split={stage.split}
        preset={stage.preset}
        autoRotate={stage.autoRotate}
        onChooseSpan={stage.chooseSpan}
        onChooseSplit={stage.chooseSplit}
        onApplyPreset={stage.applyPreset}
        onToggleAutoRotate={stage.toggleAutoRotate}
        onResetView={stage.resetView}
      />

      <RanksHoverReadout
        hover={stage.hover}
        focusLabel={stage.focusLabel}
        dynastyName={stage.mainDynasty.name}
        compareName={stage.compareDynasty?.name}
      />

      <RanksDrawer
        compareDynasty={stage.compareDynasty}
        compareTier={stage.compareTier}
        ladderCompareDynasty={stage.ladderCompareDynasty}
        compareEnabled={stage.compareEnabled}
        compareId={stage.effectiveCompareId}
        dynastyId={stage.dynastyId}
        focusBand={stage.focusBand}
        focusLabel={stage.focusLabel}
        mainDynasty={stage.mainDynasty}
        mainLayout={stage.mainLayout}
        mainTier={stage.mainTier}
        open={stage.drawerOpen}
        onSelectLadderOffice={(office, level, dynasty) => {
          stage.setSelectionFromLadder(rankOfficeDetail(dynasty, level, office));
        }}
        onSelectTreeOffice={stage.selectTreeOffice}
        onTabChange={stage.setDrawerTab}
        onClose={stage.closeDrawer}
        onCompareChange={stage.chooseCompare}
        onTierFocus={stage.focusTierChip}
        onToggleCompare={stage.toggleCompare}
        selected={stage.selected}
        selection={stage.selection}
        tab={stage.drawerTab}
      />
    </article>
  );
}
