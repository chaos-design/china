# 新页面「品级纵横」：官位品级跨朝代对比（/china/ranks）

## Context

用户问为什么没有屯田、官位内容，要求单独生成一个页面，实现官位品级对比，用立体介绍角度 + 朝代对比。

- 屯田：政策全览已有覆盖（屯田制词条、曹操屯田/卫所屯田卡片），本次不做（用户已确认）。
- 官位品级：典章制度「官制」是编年叙述，无跨朝代对比；政策全览 `dynasties.json` 的「官制·职级对照」有 9 朝表格但是 HTML 字符串塞在 impact 字段里、一次只能看一朝。新页面是它的"结构化升级"：typed 数据 + 真正的跨朝代对比。
- 已确认的设计决定：① 立体=水墨风等距阶梯（HTML 阶梯 + SVG 装饰轨，非 Three.js）+ 多维信息；② 只做品级对比页；③ 覆盖八组：**秦 · 汉 · 魏晋南北朝 · 隋唐 · 宋 · 元 · 明 · 清**。

## 页面结构（单路由，页内状态，参考 atlas 的单页模式）

路由 `/china/ranks`，页名「品级纵横」（h1 font-brush），badge「职官 · 品阶 · 朝代对照」。pinned header 复用 institution-shell 的头部样式（不建侧栏，单列 `max-w-6xl` 三节纵排）：

1. **纵 · 品级阶梯**（立体锚点）：朝代 chips（八组）+「单朝 / 对比」切换。阶梯自顶（一品/万石）向底（从九品）逐级缩进成台阶状，每级一行：品阶 chip + 该级官职（文=朱点、武=蓝点标记，职务一句）。官职可点击 → 固定高度详情卡展开四个维度：**职能 / 秩俸 / 实态·沿革 / 古今对应（参考）**。对比模式 = 两条并排阶梯。装饰性等距 SVG 阶梯轨（`pointer-events-none`，纯几何无文字）置于列侧，呼应 hand-drawn-map 的确定性几何模式。
2. **横 · 同职追踪**（朝代对比核心）：固定 6 条职系，每条横向八格（每朝一格）：**宰辅百官之长 / 监察长官 / 最高军职 / 尚书六部长官 / 地方大员 / 县级长官**。每格 = 官名 + 品秩 + 一句权力实态（如 宰辅：秦丞相→汉丞相(万石)→魏晋录尚书事→唐中书令(正三品→正二品)→宋同平章事→元中书省丞相→明废相·内阁首辅(正五品起)→清军机大臣(无定品)）。
3. **断面 · 同品对照**：品阶 picker（一品…九品），一行八列格子展示各朝该品官职；秦/汉列显示「秩石约当 N 品」（`approxGrade` 字段，页脚注明映射仅示意）。

移动端：阶梯缩进收起、八列格子横向滚动（复用 policies `.rank-tbl` 的 overflow-x 思路），布局不跳动。

## 数据模型与内容

`src/pages/ancient/china-ranks/types.ts`：

- `RankOffice { title; rank(确切品/秩); branch: "civil"|"military"; duty; salary?; modern?; note? }`
- `RankLevel { grade(行标签：万石/一品…); approxGrade?(仅秦汉); offices }`
- `RankDynasty { id; name; period; system(秩石制/九品官人法/九品三十阶/九品十八级); systemNote; levels; source }`
- `OfficeTrack { id; name; stops: (TrackStop|null)[] }`（8 停靠点，无此职显式 null）

`rank-data.ts`：八朝 levels（每朝 6–9 级、共约 100 官职）+ 6 条 track + 出处（`《汉书·百官公卿表》《唐六典》《明史·职官志》《清史稿·职官志》`）。内容以政策全览 dynasties.json 已核准的官制·职级对照表为底稿改编成 typed 数据，存疑数字用「约」。魏晋南北朝写清「上品无寒门」与北魏正从分阶；宋写官/职/差遣分离（寄禄官定品、差遣掌实权）；元写达鲁花赤与右丞相为上；明清写超品、满汉复职、品低权重（内阁正五品）。

## 新建文件

```
src/pages/ancient/china-ranks/
  types.ts / rank-data.ts / rank-ladder-rail.tsx(SVG 几何轨, 纯函数)
  ranks-page.tsx(页 + 三节 + 详情卡) / index.ts(导出 RanksPage)
  resource.ts(homeEntries: [{ path: "/china/ranks", status: "available", icon: <合法 HomeEntryIcon 值,实现时从 ENTRY_ICONS 挑> }])
  rank-data.test.ts / ranks-page.test.tsx / rank-ladder-rail.test.ts
```

## 修改文件

- `src/routes.tsx`：lazy 导入 + `{ path: "china/ranks", element: withSuspense(<RanksPage />) }`
- `src/route-layout-config.ts`：加 `{ path: "/china/ranks" }`（默认无 footer/主题切换，同 institutions）
- `src/components/layout/nav-groups.ts`：chronology 组（编年与制度）加 leaf `{ label: "品级纵横", to: "/china/ranks", highlights: [] }`（`/china/` 前缀豁免资源校验）
- `AGENTS.md`：路由表加一行 + 目录表加 china-ranks + 一段页面说明（含「秩石约当品」仅为示意、详情卡四维、秦汉无品制等口径）

## 测试（对齐 testing conventions）

- `rank-data.test.ts`：八朝 id 唯一 kebab-case、period 匹配日期正则、levels 非空且自顶向下有序、每 office title/duty 非空、branch 枚举合法、6 条 track 各有 8 个停靠点且朝代序与 dynasty 数组一致、approxGrade 只出现在秦/汉。
- `rank-ladder-rail.test.ts`：纯几何函数——输入级数输出多边形全部落在 viewBox 内、无 NaN、顶步 y < 底步 y。
- `ranks-page.test.tsx`：h1/三节 aria-label；选秦显示万石与丞相、选明清显示正一品；对比模式出现第二条阶梯；宰辅 track 八格齐全；品阶 picker 切三品时明朝显示六部尚书(正三品)；详情卡四维标签渲染；点击官职展开。

## 验证

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm build`（覆盖率门槛 93/94/90/80）
2. `pnpm dev` 真实浏览器检查（jsdom 不解析 CSS/几何）：阶梯立体观感、对比模式列对齐、移动端八列横滚、SVG 轨不遮挡交互、暗色主题下颜色可读。
3. 首页新卡出现且可点击、mega menu「编年与制度」列出现「品级纵横」且 deep-link 高亮该组。
