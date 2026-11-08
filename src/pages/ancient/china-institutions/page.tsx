import { ArrowRight, BookOpen, FileText, Gavel, Landmark, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";

import { InstitutionShell } from "./institution-shell";
import { INSTITUTION_TOPICS } from "./topics";

interface TopicCardMeta {
  description: string;
  icon: typeof Landmark;
  name: string;
  scope: string;
  slug: string;
}

// 五类条目的完整阵容。已实现的条目在 topics/ 注册表中有对应专题页，卡片渲染为链接；
// 未实现的保留「筹备中」占位卡——补齐数据与路由后，把对应 meta 加入注册表即可翻转。
const TOPIC_LINEUP: readonly TopicCardMeta[] = [
  {
    icon: Landmark,
    name: "官制",
    slug: "official-system",
    scope: "职官 · 品级 · 央地结构",
    description: "从三公九卿到三省六部、内阁军机处，梳理职官设置、品级沿革与央地权力制衡。",
  },
  {
    icon: FileText,
    name: "赋役",
    slug: "taxation",
    scope: "田赋 · 户役 · 商税",
    description: "以租庸调、两税法、一条鞭法到摊丁入亩为线索，观察赋税与徭役如何征派到户。",
  },
  {
    icon: Gavel,
    name: "律令",
    slug: "legal-code",
    scope: "法典 · 敕令 · 审级",
    description: "从《法经》、秦律、《唐律疏议》到《大清律例》，对照法典体例与司法审级变化。",
  },
  {
    icon: BookOpen,
    name: "科举",
    slug: "examinations",
    scope: "选官 · 科目 · 考试",
    description: "从察举征辟、九品中正到科举取士，追踪选官制度的变迁、科目设置与应试生态。",
  },
  {
    icon: ScrollText,
    name: "礼制",
    slug: "rites",
    scope: "五礼 · 祭祀 · 朝会",
    description: "吉、凶、军、宾、嘉五礼与祭祀、冠婚、朝会，看礼法如何进入日常社会秩序。",
  },
];

const implementedSlugs = new Set(INSTITUTION_TOPICS.map((topic) => topic.slug));

export function ChinaInstitutionsPage() {
  return (
    <InstitutionShell
      activeTopicId={null}
      badge="五类条目"
      description="官制、赋役、律令、科举与礼制五类条目已全部开放：先定朝代坐标，再把制度放回具体的历史现场，适合做专题检索与延伸阅读。"
      title="典章制度索引"
    >
      <div className="flex flex-col gap-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="topic-card-grid">
          {TOPIC_LINEUP.map((entry) => {
            const Icon = entry.icon;
            const implemented = implementedSlugs.has(entry.slug);

            if (implemented) {
              return (
                <Link
                  className="group index-card relative flex min-h-52 flex-col justify-between gap-6 overflow-hidden p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                  key={entry.slug}
                  to={`/china/institutions/${entry.slug}`}
                >
                  <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-70" />
                  <Icon aria-hidden="true" className="h-8 w-8 text-vermillion" />
                  <div className="flex flex-col gap-3">
                    <span className="font-brush text-3xl text-ink">{entry.name}</span>
                    <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.22em] uppercase">
                      {entry.scope}
                    </span>
                    <span className="text-muted-foreground text-sm leading-relaxed">
                      {entry.description}
                    </span>
                  </div>
                  <span className="relative z-10 flex items-center gap-1.5 font-mono-tech text-xs tracking-[0.25em] text-vermillion uppercase">
                    进入条目
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            }

            return (
              <article
                aria-disabled="true"
                className="index-card index-card-preview relative flex min-h-52 cursor-default flex-col justify-between gap-6 overflow-hidden p-6"
                key={entry.slug}
              >
                <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-vermillion/70 to-transparent opacity-70" />
                <Icon aria-hidden="true" className="h-8 w-8 text-vermillion" />
                <div className="flex flex-col gap-3">
                  <span className="font-brush text-3xl text-ink">{entry.name}</span>
                  <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.22em] uppercase">
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

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5">
          <span className="eyebrow">阅读指引</span>
          <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">
            本页是典章制度的总索引：五类条目各自独立成篇，之间以朝代与机构相互引用。
            建议先在时间长河中定位朝代坐标，再带着具体问题回到对应条目，
            对照制度在不同朝代的变形与继承。
          </p>
        </aside>
      </div>
    </InstitutionShell>
  );
}
