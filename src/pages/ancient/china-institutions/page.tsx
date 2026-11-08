import { BookOpen, FileText, Gavel, Landmark, ScrollText } from "lucide-react";

interface InstitutionEntry {
  description: string;
  icon: typeof Landmark;
  name: string;
  scope: string;
}

// 五类预留条目是编辑判断：先立骨架，内容按朝代脉络逐步充实，
// 因此本页只做索引与导读，不做数据驱动。
const INSTITUTION_ENTRIES: InstitutionEntry[] = [
  {
    icon: Landmark,
    name: "官制",
    scope: "职官 · 品级 · 央地结构",
    description: "从三公九卿到三省六部、内阁军机处，梳理职官设置、品级沿革与央地权力制衡。",
  },
  {
    icon: FileText,
    name: "赋役",
    scope: "田赋 · 户役 · 商税",
    description: "以租庸调、两税法、一条鞭法到摊丁入亩为线索，观察赋税与徭役如何征派到户。",
  },
  {
    icon: Gavel,
    name: "律令",
    scope: "法典 · 敕令 · 审级",
    description: "从《法经》、秦律、《唐律疏议》到《大清律例》，对照法典体例与司法审级变化。",
  },
  {
    icon: BookOpen,
    name: "科举",
    scope: "选官 · 科目 · 考试",
    description: "从察举征辟、九品中正到科举取士，追踪选官制度的变迁、科目设置与应试生态。",
  },
  {
    icon: ScrollText,
    name: "礼制",
    scope: "五礼 · 祭祀 · 朝会",
    description: "吉、凶、军、宾、嘉五礼与祭祀、冠婚、朝会，看礼法如何进入日常社会秩序。",
  },
];

export function ChinaInstitutionsPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-6">
        <span className="eyebrow">专题索引</span>
        <h1 className="font-brush text-5xl leading-tight text-ink sm:text-6xl">
          <span className="ink-underline inline-block pb-1">典章制度索引</span>
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          预留官制、赋役、律令、科举与礼制五类条目，作为专题检索与延伸阅读的骨架。
          条目将按朝代脉络逐步充实，先立索引，再逐步把制度放回具体的历史现场。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INSTITUTION_ENTRIES.map((entry) => {
          const Icon = entry.icon;

          return (
            <article
              key={entry.name}
              aria-disabled="true"
              className="index-card index-card-preview relative flex min-h-52 cursor-default flex-col justify-between gap-6 overflow-hidden p-6"
            >
              <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-70" />
              <div className="flex flex-col gap-3">
                <Icon className="h-8 w-8 text-vermillion" aria-hidden="true" />
                <span className="font-brush text-3xl text-ink">{entry.name}</span>
                <span className="font-mono-tech text-xs tracking-[0.22em] text-muted-foreground uppercase">
                  {entry.scope}
                </span>
                <span className="text-muted-foreground text-sm leading-relaxed">
                  {entry.description}
                </span>
              </div>
              <span className="relative z-10 font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase">
                筹备中
              </span>
            </article>
          );
        })}
      </div>

      <aside className="home-section-panel flex flex-col gap-4">
        <span className="eyebrow">阅读指引</span>
        <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">
          本页是典章制度的总索引：五类条目各自独立成篇，之间以朝代与机构相互引用。
          建议先在时间长河中定位朝代坐标，再带着具体问题回到对应条目，
          对照制度在不同朝代的变形与继承。
        </p>
      </aside>
    </section>
  );
}
