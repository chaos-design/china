## Context

`/china/ranks`（品级纵横）当前是「全屏舞台 + 下方四个滚动板块」的混合结构：`<article class="lg:h-full">` 里先铺一个带左 280px 控制面板 / 画布可视带 / 右 380px 常驻面板的 stage，再在 `max-w-6xl` 列里向下滚动族谱 / 阶梯 / 追踪 / 断面。用户要求**完全推倒这个结构**，参照 `/china/timeline` 重建：单屏沉浸、页面永不滚动、所有 UI 都是画布上方的悬浮面板（timeline 的实际模式 = 全幅画布 `#cv` inset:0 + 顶部居中 pill 工具条 + 左下图例/筛选面板 + 右侧滑入详情面板，无 h1 区、无下折内容、单一 900px 断点）。

**保留不动**（场景与数据层与布局无关）：`rank-tree-scene.ts`（Three.js 工厂，ResizeObserver 自适应容器，全幅容器直接可用——`fitDistance()` 已按容器宽高比含 1.16 边距居中取景）、`rank-tree-layout.ts`、`rank-data.ts`、`officials-data.ts`、`office-detail-card.tsx`、`dynasty-chips.tsx`、`rank-step-glyph.tsx`、`routes.tsx`、`route-layout-config.ts`。

**目标结构**（与旧结构零相似：无 article+h-full 分区、无左控制面板、无画布可视带 inset、无常驻右栏、无下折滚动列）：

```
<article class="relative h-full overflow-hidden">        ← 所有断点都满 main 高度，永不滚动
  ├ 画布宿主  absolute inset-0（全幅 Three.js 树，role="img"）
  ├ 页题条    absolute top（pointer-events-none）左：h1 品级纵横+徽章；右：进入品秩全景链接
  ├ 工具条    absolute top 居中 pill 组：文武分列/合列 · 品序对齐/层级等距 · 斜侧/正视 · 自动旋转 · 重置视角
  ├ 筛选面板  absolute bottom-left 可收起：朝代 chips + 双朝并置开关/对比 chips + 文武图例 + N 级 M 官
  ├ 悬浮读出  absolute bottom-center（pointer-events-none）hover 信息 / 操作提示
  └ 资料抽屉  absolute right，translateX 滑入（仿 timeline #panel），420px，内部滚动
      tab: 树 / 族谱 / 阶梯 / 追踪 / 断面
```

## 状态统一（删除现存的重复状态）

现页面有两套独立朝代状态（stage 自己的 mainId vs 页面的 dynastyId）。重建后 **RanksPage 单一状态源**：`mainId`（驱动树、族谱、阶梯、断面默认）、`compareEnabled`/`compareId`（同时驱动树的双朝并置与阶梯双列，保留 `nextDynastyId` fallback）、`span`/`split`/`preset`/`autoRotate`/`focusBand`、`selection: OfficeDetail | null`、`hover`、`drawerOpen`+`drawerTab`、`failed`。3D 内点击 tier/office → 打开抽屉并选中；键盘可达性靠抽屉内 tier chips 与官职列表（画布仍 role="img"）。

## 文件变更

**重写 `src/pages/ancient/china-ranks/ranks-page.tsx`** — 舞台外壳 + 全部状态 + 场景接线（从 rank-tree-section.tsx 迁移 createRankTreeScene 生命周期）。TierColumn 移入抽屉树 tab。

**新建 `ranks-drawer.tsx`** — 抽屉壳（tab 条 + 关闭按钮 + 内部滚动体）+ 五个 tab 面板，旧 section 内容重排为抽屉纵向版式：
- 树：tier chips + TierColumn（主/对比）+ OfficeDetailCard + 读图口径脚注
- 族谱：`rank-genealogy.tsx` 重构为 `RankGenealogyPanel`（去 section 外壳，纵向 grade→文武→官职展开列表随 mainId）
- 阶梯：单朝/双朝开关（绑定同一 compareEnabled）+ `LadderColumn`（保留 LadderStep 台阶与 112px 缩进帽）纵向排
- 追踪：6 职系 chips + 单职系纵向 8 朝 stop 列表（原 min-w-[880px] 8 列横排改纵向）
- 断面：一品…九品 chips + 纵向 8 朝该品设官列表（resolveOfficeBand），保留约当标注与「古今对应是量级类比」脚注

**删除 `rank-tree-section.tsx`**（及 `rank-tree-section.test.tsx`）。

**测试**：重写 `ranks-page.test.tsx`（全幅画布结构、工具条 pills、筛选面板、抽屉默认关闭/滑入、scene mock 的 pick 打开抽屉、统一朝代切换联动五个 tab、WebGL 兜底）；改写 `rank-genealogy.test.tsx` 适配 Panel 形态；`rank-tree-layout.test.ts`、`rank-data.test.ts`、`rank-step-glyph.test.ts`、`officials-data.test.ts` 不动。覆盖率阈值不变（场景文件保持豁免）。

**`AGENTS.md`**：替换 ranks 页段落——删除 stage/可视带/下方四 section 的全部描述，改写为单屏悬浮面板 + 抽屉结构（含「勿改回下方滚动分区」警示）。

## 窄屏（<lg）

仿 timeline 单断点策略：工具条横向滚动置顶；筛选面板变全宽底部 sheet（收起态单行）；抽屉变全宽底部 sheet（max-h ~45%）；画布始终全幅铺底。

## 验证

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm build` 全绿
2. `pnpm dev` 真浏览器核验（jsdom 不解析 CSS）：画布全幅居中、面板不遮树心、抽屉滑入/收起、五 tab 内容、双朝并置、主题/强调色切换重建场景、窄屏 sheet 布局
3. 截图核对悬浮面板玻璃质感与水墨纸色一致性