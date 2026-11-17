import { type ReactNode, useEffect, useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import type { DynastyAtlas } from "./data";
import { layoutOfficeTree, type OfficeTreeLayout, type OfficeTreeNode } from "./office-tree-layout";
import type { OfficeTreeHover, OfficeTreePick } from "./office-tree-scene";
import { useOfficeTreeScene } from "./use-office-tree-scene";

type OfficeBranch = DynastyAtlas["branches"][number];

interface RelationFilterItem {
  caption: string;
  detail: string;
  id: string;
  mark?: string;
  title: string;
}

type OfficeDetail =
  | { type: "node"; node: OfficeTreeNode }
  | { type: "filter"; item: RelationFilterItem };

const KIND_LABEL: Record<OfficeTreeNode["kind"], string> = {
  branch: "官署分区",
  honorary: "荣衔封号",
  office: "属官衙署",
  root: "权力本源",
};

/** 收集根节点及其全部后代，作为从属筛选的高亮集合。 */
function subtreeIds(layout: OfficeTreeLayout, roots: readonly string[]): string[] {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const found = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (found.has(id)) {
      continue;
    }
    found.add(id);
    const node = byId.get(id);
    if (node) {
      stack.push(...node.children);
    }
  }
  return [...found];
}

/** 从属关系筛选：全树 / 权力本源 / 荣衔 / 各官署分区，均为从属树的顶层入口。 */
function buildRelationFilters(atlas: DynastyAtlas, layout: OfficeTreeLayout) {
  const honoraryRoots = layout.nodes
    .filter((node) => node.kind === "honorary" && node.parent === layout.rootId)
    .map((node) => node.id);

  const items: RelationFilterItem[] = [
    {
      caption: "完整从属树",
      detail: `${atlas.name}官制共 ${layout.nodes.length} 个节点、${atlas.branches.length} 类官署分区；聚焦任一入口即可只看它的从属链。`,
      id: "all",
      title: "全景",
    },
    {
      caption: "权力本源",
      detail: atlas.root.note,
      id: layout.rootId,
      title: layout.root.title,
    },
  ];
  if (honoraryRoots.length > 0) {
    items.push({
      caption: "荣衔 · 加官",
      detail: atlas.honorary.map((group) => group.title).join("、"),
      id: "honorary",
      title: "荣衔封号",
    });
  }
  for (const branch of atlas.branches) {
    items.push({
      caption: "官署分区",
      detail: branch.summary,
      id: branch.id,
      mark: branch.mark,
      title: branch.title,
    });
  }

  const highlight = new Map<string, string[]>();
  for (const item of items) {
    if (item.id === "all") {
      continue;
    }
    highlight.set(item.id, subtreeIds(layout, item.id === "honorary" ? honoraryRoots : [item.id]));
  }
  return { highlight, items };
}

function OfficeLeaf({ node, depth }: { node: OfficeBranch["nodes"][number]; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className="relative flex flex-col">
      <button
        aria-expanded={hasChildren ? open : undefined}
        className={cn(
          "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          hasChildren ? "hover:bg-vermillion/5" : "cursor-default",
        )}
        onClick={() => {
          if (hasChildren) {
            setOpen((previous) => !previous);
          }
        }}
        type="button"
      >
        {hasChildren ? (
          <span
            aria-hidden="true"
            className={cn(
              "mt-[0.4em] inline-block h-2 w-2 shrink-0 border-r border-b border-vermillion/60 transition-transform",
              open ? "rotate-45" : "-rotate-45",
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/35"
          />
        )}
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-sm leading-snug",
              depth === 0 ? "font-brush text-base text-ink" : "text-foreground/90",
            )}
          >
            {node.title}
          </span>
          {node.rank ? (
            <span className="font-mono-tech text-[0.7rem] tracking-[0.08em] text-vermillion">
              {node.rank}
            </span>
          ) : null}
        </span>
      </button>
      {node.note ? (
        <p className="ml-6 max-w-prose pb-1.5 text-xs leading-relaxed text-muted-foreground">
          {node.note}
        </p>
      ) : null}
      {hasChildren && open ? (
        <ul className="ml-4 flex flex-col border-ink/10 border-l pl-2">
          {node.children?.map((child) => (
            <OfficeLeaf depth={depth + 1} key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function BranchCard({ entry, dynastyName }: { entry: OfficeBranch; dynastyName: string }) {
  return (
    <section
      aria-label={`${dynastyName}官制·${entry.title}`}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink/15 bg-card/70 p-4 shadow-[0_8px_24px_hsl(var(--ink)/0.06)]"
    >
      <header className="flex items-start gap-3 border-ink/10 border-b pb-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-lg text-vermillion"
        >
          {entry.mark}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-brush text-2xl text-ink">{entry.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
        </div>
      </header>
      <ul className="flex flex-col">
        {entry.nodes.map((node) => (
          <OfficeLeaf depth={0} key={node.id} node={node} />
        ))}
      </ul>
    </section>
  );
}

/** 2D 卡片镜像：仅当 WebGL 不可用时兜底展示完整层级内容。 */
function OfficeTree2DFallback({ atlas }: { atlas: DynastyAtlas }) {
  return (
    <section aria-label="官制层级镜像" className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-ochre/30 bg-paper/75 px-5 py-4 text-center shadow-[0_8px_24px_hsl(var(--ink)/0.06)]">
        <span className="font-mono-tech text-[0.7rem] tracking-[0.3em] text-ochre uppercase">
          权力本源
        </span>
        <span className="font-brush text-3xl text-ink sm:text-4xl">{atlas.root.title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{atlas.root.note}</span>
      </div>

      <section aria-label="历代荣衔" className="flex flex-col gap-2">
        <h3 className="font-brush text-xl text-ink">荣衔 · 三公三孤与东宫官</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {atlas.honorary.map((group) => (
            <section
              aria-label={`${atlas.name}荣衔·${group.title}`}
              className="flex flex-col gap-1 rounded-xl border border-ink/15 bg-card/70 p-3"
              key={group.id}
            >
              <div className="flex items-baseline gap-2">
                <h4 className="font-brush text-lg text-ink">{group.title}</h4>
                {group.rank ? (
                  <span className="font-mono-tech text-[0.7rem] text-vermillion">{group.rank}</span>
                ) : null}
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {group.children?.map((child) => (
                  <li
                    className="rounded-full border border-ink/10 bg-paper/70 px-2 py-0.5 font-body text-xs text-foreground/85"
                    key={child.id}
                  >
                    {child.title}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {atlas.branches.map((entry) => (
          <BranchCard entry={entry} dynastyName={atlas.name} key={entry.id} />
        ))}
      </div>
    </section>
  );
}

function ViewControls({
  onPreset,
  onReset,
}: {
  onPreset: (preset: "three-quarter" | "front") => void;
  onReset: () => void;
}) {
  const base =
    "rounded-full border border-ink/15 bg-card/80 px-2.5 py-1 font-body text-[0.7rem] text-muted-foreground backdrop-blur-md transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <button className={base} onClick={() => onPreset("three-quarter")} type="button">
        斜视
      </button>
      <button className={base} onClick={() => onPreset("front")} type="button">
        正视
      </button>
      <button className={base} onClick={onReset} type="button">
        重置视角
      </button>
    </div>
  );
}

function HoverReadout({
  hover,
  dynastyName,
}: {
  hover: OfficeTreeHover | null;
  dynastyName: string;
}) {
  return (
    <div className="pointer-events-none flex justify-center">
      {hover ? (
        <div className="max-w-[min(420px,calc(100%-1.5rem))] rounded-xl border border-ink/10 bg-paper/90 px-4 py-2.5 text-center shadow-[0_12px_32px_hsl(var(--ink)/0.14)] backdrop-blur-md">
          <div className="flex flex-wrap items-baseline justify-center gap-x-2">
            <span className="font-brush text-lg text-ink">{hover.title}</span>
            <span className="font-mono-tech text-[0.7rem] tracking-[0.06em] text-vermillion">
              {hover.subtitle}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
            {hover.detail}
          </p>
        </div>
      ) : (
        <span className="rounded-full border border-ink/10 bg-paper/90 px-4 py-1.5 font-mono-tech text-[0.7rem] tracking-[0.08em] text-muted-foreground backdrop-blur-md">
          {dynastyName} · 拖拽旋转 滚轮缩放 点选节点或左侧从属入口看详情
        </span>
      )}
    </div>
  );
}

/** 悬浮在 3D 舞台内部的从属关系筛选：容器透传指针，只有控件本身可点，不挡画布拖拽。 */
function RelationFilterPanel({
  activeId,
  items,
  onClear,
  onSelect,
}: {
  activeId: string;
  items: readonly RelationFilterItem[];
  onClear: () => void;
  onSelect: (item: RelationFilterItem) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const chip =
    "rounded-full border px-2.5 py-1 font-body text-[0.7rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[min(280px,calc(100%-1.5rem))]">
      <section
        aria-label="从属关系筛选"
        className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-ink/12 bg-paper/85 p-2.5 shadow-[0_12px_32px_hsl(var(--ink)/0.12)] backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono-tech text-[0.65rem] tracking-[0.18em] text-ochre uppercase">
            从属关系
          </span>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "收起从属筛选" : "展开从属筛选"}
            className="rounded-full border border-ink/15 bg-card/70 px-2 py-0.5 font-body text-[0.65rem] text-muted-foreground transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setExpanded((previous) => !previous)}
            type="button"
          >
            {expanded ? "收起" : "展开"}
          </button>
          {activeId !== "all" ? (
            <button
              className="rounded-full px-1 font-body text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-vermillion hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={onClear}
              type="button"
            >
              清除
            </button>
          ) : null}
        </div>
        {expanded ? (
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <button
                aria-pressed={item.id === activeId}
                className={cn(
                  chip,
                  item.id === activeId
                    ? "border-vermillion/45 bg-vermillion/15 text-vermillion"
                    : "border-ink/12 bg-card/70 text-foreground/80 hover:border-vermillion/30 hover:text-ink",
                )}
                key={item.id}
                onClick={() => onSelect(item)}
                type="button"
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono-tech text-[0.65rem] tracking-[0.18em] text-ochre uppercase">
        {label}
      </dt>
      <dd className="text-xs leading-relaxed text-foreground/90">{children}</dd>
    </div>
  );
}

function OfficeNodeDetail({
  dynastyName,
  layout,
  node,
}: {
  dynastyName: string;
  layout: OfficeTreeLayout;
  node: OfficeTreeNode;
}) {
  const byId = useMemo(() => new Map(layout.nodes.map((item) => [item.id, item])), [layout]);
  const path: string[] = [];
  let cursor: OfficeTreeNode | undefined = node;
  while (cursor) {
    path.unshift(cursor.title);
    cursor = cursor.parent ? byId.get(cursor.parent) : undefined;
  }
  const children = node.children
    .map((id) => byId.get(id)?.title)
    .filter((title): title is string => Boolean(title));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-brush text-2xl text-ink">{node.title}</h3>
        {node.rank ? (
          <span className="font-mono-tech text-xs tracking-[0.08em] text-vermillion">
            {node.rank}
          </span>
        ) : null}
        <span className="rounded-full border border-ink/15 bg-paper/70 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {KIND_LABEL[node.kind]}
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        <DetailRow label="从属路径">{path.join(" / ")}</DetailRow>
        {children.length > 0 ? <DetailRow label="直属下属">{children.join("、")}</DetailRow> : null}
        {node.note ? <DetailRow label="职掌说明">{node.note}</DetailRow> : null}
        <DetailRow label="所属朝代">{dynastyName}</DetailRow>
      </dl>
    </div>
  );
}

function RelationDetail({
  atlas,
  highlight,
  item,
  layout,
}: {
  atlas: DynastyAtlas;
  highlight: ReadonlyMap<string, readonly string[]>;
  item: RelationFilterItem;
  layout: OfficeTreeLayout;
}) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const ids = highlight.get(item.id) ?? [];
  const mainStem =
    item.id === "all"
      ? layout.nodes.filter((node) => node.parent === layout.rootId).map((node) => node.title)
      : item.id === "honorary"
        ? atlas.honorary.map((group) => group.title)
        : (byId.get(item.id)?.children ?? [])
            .map((id) => byId.get(id)?.title)
            .filter((title): title is string => Boolean(title));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {item.mark ? (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-vermillion/30 bg-vermillion/10 font-brush text-lg text-vermillion"
          >
            {item.mark}
          </span>
        ) : null}
        <h3 className="font-brush text-2xl text-ink">{item.title}</h3>
        <span className="rounded-full border border-ink/15 bg-paper/70 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {item.caption}
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        <DetailRow label="说明">{item.detail}</DetailRow>
        <DetailRow label="聚焦规模">{ids.length > 0 ? `${ids.length} 个节点` : "完整树"}</DetailRow>
        {mainStem.length > 0 ? <DetailRow label="主干">{mainStem.join("、")}</DetailRow> : null}
        {item.id === "all" ? <DetailRow label="读图提示">{atlas.hierarchyNote}</DetailRow> : null}
      </dl>
      <p className="border-ink/10 border-t pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        已在左侧舞台高亮这条从属链；点选树中任一节点可继续查看它的职掌与上下级。
      </p>
    </div>
  );
}

/** 右侧详情面板：点选 3D 节点或任一从属筛选项时从舞台右缘滑入。 */
function OfficeDetailDrawer({
  atlas,
  detail,
  highlight,
  layout,
  onClose,
}: {
  atlas: DynastyAtlas;
  detail: OfficeDetail | null;
  highlight: ReadonlyMap<string, readonly string[]>;
  layout: OfficeTreeLayout;
  onClose: () => void;
}) {
  const open = Boolean(detail);
  return (
    <aside
      aria-hidden={open ? undefined : true}
      aria-label="官制详情"
      className={cn(
        "absolute z-30 flex flex-col overflow-hidden border-ink/15 bg-paper/90 shadow-[0_18px_48px_hsl(var(--ink)/0.16)] backdrop-blur-xl transition-transform duration-300",
        "inset-x-0 bottom-0 max-h-[58%] rounded-t-2xl border-t",
        "lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:max-h-none lg:w-[360px] lg:rounded-l-2xl lg:border-l lg:border-t-0",
        open
          ? "translate-y-0 lg:translate-x-0"
          : "translate-y-full lg:translate-x-[105%] lg:translate-y-0",
      )}
      inert={!open || undefined}
    >
      <header className="flex items-center gap-3 border-ink/10 border-b px-4 py-3">
        <span className="font-mono-tech text-[0.65rem] tracking-[0.2em] text-ochre uppercase">
          从属详解
        </span>
        <button
          aria-label="关闭详情"
          className="ml-auto rounded-full border border-ink/15 bg-card/70 px-2.5 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {detail?.type === "node" ? (
          <OfficeNodeDetail dynastyName={atlas.name} layout={layout} node={detail.node} />
        ) : detail?.type === "filter" ? (
          <RelationDetail atlas={atlas} highlight={highlight} item={detail.item} layout={layout} />
        ) : null}
      </div>
    </aside>
  );
}

/** 图一：官制层级，呈现为一棵可旋转缩放的三维从属立体树；WebGL 不可用时回落到 2D 卡片镜像。 */
export function QingOfficeTree({ atlas }: { atlas: DynastyAtlas }) {
  const layout = useMemo(() => layoutOfficeTree(atlas), [atlas]);
  const relation = useMemo(() => buildRelationFilters(atlas, layout), [atlas, layout]);
  const [filterId, setFilterId] = useState("all");
  const [detail, setDetail] = useState<OfficeDetail | null>(null);
  const [hover, setHover] = useState<OfficeTreeHover | null>(null);

  const callbacks = useMemo(
    () => ({
      onHover: (next: OfficeTreeHover | null) => setHover(next),
      onPick: (pick: OfficeTreePick | null) => {
        const node = pick ? (layout.nodes.find((item) => item.id === pick.id) ?? null) : null;
        setDetail(node ? { type: "node", node } : null);
      },
      onUnavailable: () => undefined,
    }),
    [layout],
  );

  const scene = useOfficeTreeScene(atlas, layout, callbacks);

  // 筛选只改变场景的高亮集合，不重建 WebGL 场景。
  useEffect(() => {
    scene.setFilter(relation.highlight.get(filterId) ?? null);
  }, [filterId, relation, scene]);

  // 切朝代时清掉上一朝的点选、hover 与筛选，避免残留。
  const [prevAtlas, setPrevAtlas] = useState(atlas);
  if (prevAtlas !== atlas) {
    setPrevAtlas(atlas);
    setDetail(null);
    setHover(null);
    setFilterId("all");
  }

  if (scene.failed) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-lg border border-ochre/30 bg-paper/70 px-4 py-3">
          <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
            当前浏览器未能启用 WebGL，立体树无法绘制，已显示 2D 层级镜像。
          </p>
          <button
            className="w-fit rounded-full border border-ink/15 bg-card/70 px-3 py-1 font-body text-xs text-muted-foreground transition-colors hover:border-vermillion/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={scene.retry}
            type="button"
          >
            重试立体树
          </button>
        </div>
        <OfficeTree2DFallback atlas={atlas} />
        <p className="text-xs leading-relaxed text-muted-foreground">{atlas.hierarchyNote}</p>
      </div>
    );
  }

  const canvasLabel = `${atlas.name}官制立体树：${layout.nodes.length} 个节点、${
    atlas.branches.length
  } 类官署分区与${atlas.honorary.length} 组荣衔。拖拽旋转、滚轮缩放、点击节点或左侧从属入口查看右侧详情。`;

  return (
    <figure
      aria-label="官制立体树"
      className="relative isolate h-[560px] min-h-[520px] w-full overflow-hidden rounded-2xl border border-ink/12 bg-[radial-gradient(ellipse_at_50%_42%,hsl(var(--ink)/0.06),transparent_70%)] shadow-[0_18px_48px_hsl(var(--ink)/0.06)] sm:h-[680px] lg:h-[760px]"
    >
      <div
        aria-label={canvasLabel}
        className={cn(
          "absolute inset-0 h-full w-full cursor-grab",
          // 桌面端抽屉展开时让画布让出右侧一列，3D 树不会被面板盖住。
          detail ? "lg:right-[360px] lg:w-[calc(100%-360px)]" : null,
        )}
        ref={scene.hostRef}
        role="img"
      />

      <div className="pointer-events-none absolute inset-0 z-10">
        {!scene.ready ? (
          <div
            aria-live="polite"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
            role="status"
          >
            <span
              aria-hidden="true"
              className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-vermillion"
            />
            <span className="font-mono-tech text-[0.7rem] tracking-[0.2em] text-muted-foreground">
              正在展开官制立体树
            </span>
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-3">
          <HoverReadout dynastyName={atlas.name} hover={hover} />
        </div>
        <p className="absolute bottom-3 left-3 hidden max-w-[220px] text-[0.65rem] leading-relaxed text-muted-foreground md:block">
          {atlas.hierarchyNote}
        </p>
      </div>

      <RelationFilterPanel
        activeId={filterId}
        items={relation.items}
        onClear={() => {
          setFilterId("all");
          setDetail(null);
        }}
        onSelect={(item) => {
          setFilterId(item.id);
          setDetail({ type: "filter", item });
        }}
      />

      <div className="absolute right-3 top-3 z-20 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
        <ViewControls onPreset={scene.applyPreset} onReset={scene.resetView} />
      </div>

      <OfficeDetailDrawer
        atlas={atlas}
        detail={detail}
        highlight={relation.highlight}
        layout={layout}
        onClose={() => setDetail(null)}
      />
    </figure>
  );
}
