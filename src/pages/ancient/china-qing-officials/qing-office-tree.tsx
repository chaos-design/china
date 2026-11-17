import { useMemo, useState } from "react";

import { cn } from "../../../lib/utils";
import type { DynastyAtlas } from "./data";
import { layoutOfficeTree, type OfficeTreeNode } from "./office-tree-layout";
import type { OfficeTreeHover, OfficeTreePick } from "./office-tree-scene";
import { useOfficeTreeScene } from "./use-office-tree-scene";

type OfficeBranch = DynastyAtlas["branches"][number];

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
          {dynastyName} · 拖拽旋转 滚轮缩放 点选节点看职权
        </span>
      )}
    </div>
  );
}

/** 点选节点的详情卡（画布下方的 DOM 读出，画布节点本身不可读屏/点选细节）。 */
function SelectedNodeCard({
  node,
  dynastyName,
  onClear,
}: {
  node: OfficeTreeNode;
  dynastyName: string;
  onClear: () => void;
}) {
  const kindLabel: Record<OfficeTreeNode["kind"], string> = {
    branch: "官署分区",
    honorary: "荣衔封号",
    office: "属官衙署",
    root: "权力本源",
  };
  return (
    <section
      aria-label={`${dynastyName}节点详情`}
      className="flex flex-col gap-2 rounded-xl border border-vermillion/25 bg-card/80 p-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-brush text-2xl text-ink">{node.title}</h3>
        {node.rank ? (
          <span className="font-mono-tech text-xs tracking-[0.08em] text-vermillion">
            {node.rank}
          </span>
        ) : null}
        <span className="rounded-full border border-ink/15 bg-paper/70 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {kindLabel[node.kind]}
        </span>
        <button
          className="ml-auto font-body text-xs text-muted-foreground underline-offset-2 hover:text-vermillion hover:underline"
          onClick={onClear}
          type="button"
        >
          取消选择
        </button>
      </div>
      {node.note ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{node.note}</p>
      ) : null}
    </section>
  );
}

/** 图一：官制层级，呈现为一棵可旋转缩放的三维从属立体树；WebGL 不可用时回落到 2D 卡片镜像。 */
export function QingOfficeTree({ atlas }: { atlas: DynastyAtlas }) {
  const layout = useMemo(() => layoutOfficeTree(atlas), [atlas]);
  const [selected, setSelected] = useState<OfficeTreeNode | null>(null);
  const [hover, setHover] = useState<OfficeTreeHover | null>(null);

  const callbacks = useMemo(
    () => ({
      onHover: (next: OfficeTreeHover | null) => setHover(next),
      onPick: (pick: OfficeTreePick | null) => {
        setSelected(pick ? (layout.nodes.find((node) => node.id === pick.id) ?? null) : null);
      },
      onUnavailable: () => undefined,
    }),
    [layout],
  );

  const scene = useOfficeTreeScene(atlas, layout, callbacks);

  // 切朝代时清掉上一朝的点选与 hover，避免残留。
  const [prevAtlas, setPrevAtlas] = useState(atlas);
  if (prevAtlas !== atlas) {
    setPrevAtlas(atlas);
    setSelected(null);
    setHover(null);
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
  } 类官署分区与${atlas.honorary.length} 组荣衔。拖拽旋转、滚轮缩放、点击节点查看职权。`;

  return (
    <div className="flex flex-col gap-4">
      <figure
        aria-label="官制立体树"
        className="relative h-[440px] overflow-hidden rounded-xl border border-ink/12 bg-[radial-gradient(ellipse_at_50%_42%,hsl(var(--ink)/0.06),transparent_70%)] sm:h-[520px] lg:h-[600px]"
      >
        <div
          aria-label={canvasLabel}
          className="absolute inset-0 h-full w-full cursor-grab"
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
        </div>

        <div className="absolute right-3 top-3 z-20">
          <ViewControls onPreset={scene.applyPreset} onReset={scene.resetView} />
        </div>

        <div className="absolute inset-x-0 bottom-3 z-10">
          <HoverReadout dynastyName={atlas.name} hover={hover} />
        </div>
      </figure>

      {selected ? (
        <SelectedNodeCard
          dynastyName={atlas.name}
          node={selected}
          onClear={() => setSelected(null)}
        />
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">{atlas.hierarchyNote}</p>
    </div>
  );
}
