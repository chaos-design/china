# 官职数据整合 + 立体品级树完全重构

## Context

当前官职数据分裂在两个互不相通的数据模块里：`/china/ranks` 的立体品级树只覆盖 `rank-data.ts` 的 105 官（无历史名人），而 `/china/officials` 的 `officials-data.ts` 有完整 284 官 + 95 组名臣名将名录，但其 3D 场景只有品级节点、没有官职树。用户要求：整合两处数据，把立体树重构为**完整朝代官职树**——节点按品级对位、文武拆分为两大枝、支持树级朝代对比、点击官职展开含历史名人的详情，且样式与布局规范与现有页面保持一致。

未收到对三个方向性问题的答复，按推荐组合执行：**品级纵横承载完整树（品秩全景保留、数据同源）**；**共用品级台脚手架 + 文武双枝**；**品级族谱切换整合数据**。工作区今日未提交的样式修复与族谱新文件全部保留、在其上叠加。

## 一、数据整合（officials-data.ts 成为唯一官职数据源）

`src/pages/ancient/china-officials/officials-data.ts`：

- `OfficialPost` 增加可选字段 `rank?`（印绶·秩石/确切品秩写法）、`salary?`（秩俸）、`note?`（实态·沿革）、`modern?`（古今对应·参考）；`post()` 助手 `extra` 参数同步扩展。
- 以「dynasty 内 title 精确匹配」把 `rank-data.ts` 105 官的 `rank/salary/note/modern` 逐条合并进对应 post（字段原样搬运，不改史料口径）；无法匹配的残差手工归位或放弃（officials 为权威口径），整理成测试白名单。
- 补充历史名人：对缺 figures 的主要官职按现有 `f(name, note)` 一行风格增补（仅收无争议、有通行记载的人物，约 +30~50 条；如 秦 廷尉、汉 卫尉/中尉、唐 各部尚书、明 六部与内阁、清 军机/督抚要职）。
- `officials-hall-page` 不改（可选字段纯增量，抽屉/HUD 契约不变）。
- `rank-data.ts` 保留：品级阶梯 / 同职追踪 / 同品断面三板块继续基于它，不动。

## 二、立体品级树重构（/china/ranks 第一板块）

- `rank-tree-layout.ts` 重写内部实现（保留文件名与纯函数定位）：改以 `OfficialsDynasty` 为输入——tier 直接取 `OfficialGrade`（band = `grade.order`，0 超品…10 流外，天然对齐现有 `RANK_RULER`/`SUPER_GRADE_BAND`，不再需要 resolveLevelBand/fillLevelBands 的解析内插）；node 取 `OfficialPost`，id 改 `${dynastyId}:${gradeId}:${title}`。
- **双枝几何**（新增纯函数，可单测）：树干顶端分叉点 + 每层文/武枝锚点（±x 侧、层上方），枝条走 Catmull-Rom；`TREE_GEOMETRY` 增加分叉/锚点常量。`even`/`band` 两种层高、`compareColumnOffsets`、`findComparableGrade`（替代 findComparableTier，order 直查）保留。
- `rank-tree-scene.ts`：`buildTree` 增绘两条枝干曲线（文朱/武蓝），节点短梗接枝（替代现有「层心→节点」放射线）；品级牌改用 `grade.label` + `grade.approx`；`describePick` 的官职悬浮改用 `intro`/`rank`；场景条目改为解耦数据模块的视图模型（name/period/id）。合列模式（merged）不绘双枝、保持现状。节点总量翻倍（单朝 ≤43），沿用现有半径公式与 DPR 上限。
- `rank-tree-section.tsx`：改从 `../china-officials/officials-data` 取数；`split` 默认 `branch`（文武分列即需求形态，合列保留为可选项）；层列面板（TierColumn）、树状品级选择 chips、hover 条、双朝并置对比机制不变；选官 → 详情卡带名人。
- 品级族谱 `rank-genealogy.tsx`：切换到整合数据（完整 284 官 + 名人），手风琴交互不变，作为立体树的无 WebGL / 键盘可达 2D 镜像；交叉引用更新。

## 三、详情卡升级（共用组件）

`office-detail-card.tsx`：props 归一为视图模型 `{ dynastyName, title, rank?, duty, salary?, note?, modern?, figures? }`（各板块自行映射：阶梯/族谱从 RankOffice 映射，树从 OfficialPost 映射，树的 rank 缺省回退 `grade.label · approx`）。新增第五维「相关名臣 · 名将」（name + note 列表；无人物时按现有文案省略/兜底）。保留 0.7rem mono-tech、brush 标题、fieldset 等既有规范。

## 四、一致性与文档

- `nav-groups.ts` 品级纵横 highlights 措辞更新（如「文武双枝官职树」）。
- `AGENTS.md`：改写立体品级树 / 品级族谱 / officials-data 相关段落，记录「officials-data 为唯一官职数据源 + 双枝树几何 + 合并白名单」约定（在现有未提交修改之上叠加）。
- 不新增路由、不动 vercel/routes/首页入口；`.zcode/` 与根目录 `eijinp` 等无关未跟踪文件不触碰。

## 五、测试

- `officials-data.test.ts`：新增合并不变量——rank-data 每个官职在同朝 officials 中存在同 title 同 branch 的 post（ curated 白名单除外）；已知合并样例（秦 丞相 rank=「金印紫绶 · 秩万石」等）；每朝 figures 覆盖数下限。
- `rank-tree-layout.test.ts`：按新数据形状重写（order 直读 band、文左武右 sector 分布、双枝锚点/分叉几何、compare offsets）。
- `rank-tree-section.test.tsx`：mock 场景同步更新，断言完整名录（秦 6 级 26 官）、默认文武分列、详情卡名人 facet、双朝并置仍按品对齐。
- `rank-genealogy.test.tsx`：切整合数据后的展开/重置行为。
- `ranks-page.test.tsx`：阶梯/追踪/断面不受影响，仅详情卡映射适配。

## 六、验证

1. 全部质量门：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:coverage`、`pnpm build`。
2. 真实浏览器验收（AGENTS.md 要求，jsdom 不校验 CSS/3D）：`pnpm dev` 后用浏览器自动化检查 `/china/ranks`——双枝树渲染、节点按品对位、点击官职弹出含名人的详情、双朝并置、明暗两主题、WebGL 失败回退仍可用；同时抽查 `/china/officials` 未回归。
3. 结束时报告覆盖门槛（93/94/90/80）与未提交改动的保留情况。