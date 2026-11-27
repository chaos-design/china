import { ArrowRight, BookOpen, GitBranch, Scale } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../../../lib/utils";

interface OfficialsView {
  description: string;
  href: string;
  icon: typeof GitBranch;
  index: string;
  title: string;
}

/** 职官制度总目：两个视图各自保留完整页面，这里只做分发与读法说明。 */
const VIEWS: readonly OfficialsView[] = [
  {
    description: "十五朝官署层级收进一座可从属展开的立体树，配品秩阶梯与礼制海报。",
    href: "/china/officials/structure",
    icon: GitBranch,
    index: "壹",
    title: "职官图谱",
  },
  {
    description: "八朝 284 条官职名录与品级对照：立体树、族谱、六条职系追踪与同品断面。",
    href: "/china/officials/grades",
    icon: Scale,
    index: "贰",
    title: "品级对照",
  },
];

const RELATED = [
  {
    href: "/china/institutions",
    label: "制度沿革",
    note: "官制、赋役、律令、科举、礼制五个专题",
  },
  { href: "/china/imperial-exam", label: "科举与仕途", note: "登科之阶与历代官途" },
] as const;

/**
 * 「职官制度」总目页。
 *
 * 原先散在菜单里的近似入口收敛到这一处。沿革不在这里另开页面——官制的编年沿革
 * 本就是制度沿革的一个专题，再复制一份只是换标题的同一篇内容。
 */
export function OfficialsHubPage() {
  return (
    <article className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
            <BookOpen aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="font-body text-xs text-muted-foreground">职官制度</span>
        </div>
        <h1 className="font-brush text-5xl leading-tight text-ink sm:text-6xl">职官制度</h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          同一批职官材料有两种读法：看官署怎么长成一座树，看品级怎么排成一张表。
          两处各自独立成页；若要顺着时间读制度的变化，去制度沿革里的官制专题。
        </p>
      </header>

      <nav aria-label="职官制度视图" className="grid gap-4 sm:grid-cols-2">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          return (
            <Link
              className={cn(
                "group flex flex-col gap-4 rounded-xl border border-ink/15 bg-card/80 p-6",
                "shadow-[4px_4px_0_0_hsl(var(--ink)/0.14)] transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
                "hover:-translate-y-0.5 hover:border-vermillion/50 hover:shadow-[6px_6px_0_0_hsl(var(--ink)/0.22)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              )}
              key={view.href}
              to={view.href}
            >
              <span className="flex items-center justify-between">
                <Icon aria-hidden="true" className="h-7 w-7 text-vermillion" />
                <span className="font-brush text-2xl text-ink/25">{view.index}</span>
              </span>
              <span className="font-brush text-3xl text-ink">{view.title}</span>
              <span className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {view.description}
              </span>
              <span className="mt-auto flex items-center gap-1.5 font-kai text-sm text-vermillion">
                进入视图
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </span>
            </Link>
          );
        })}
      </nav>

      <section aria-label="相邻专题" className="flex flex-col gap-3">
        <h2 className="font-brush text-2xl text-ink">相邻专题</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {RELATED.map((item) => (
            <Link
              className="group flex items-center justify-between gap-4 rounded-lg border border-dashed border-ink/20 px-4 py-3 transition-colors hover:border-vermillion/50 hover:bg-vermillion/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              key={item.href}
              to={item.href}
            >
              <span className="flex flex-col">
                <span className="font-kai text-lg text-ink">{item.label}</span>
                <span className="font-body text-xs text-muted-foreground">{item.note}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-vermillion transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
