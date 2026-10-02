import { type ComponentType, lazy, Suspense } from "react";

interface PolicyFigureComponentProps {
  className?: string;
  title: string;
}

// The territory maps are a few hundred kilobytes of path data each, and only the figures of
// the dynasty on screen are ever visible. Static `import()` specifiers keep compile-time path
// checking while Vite emits one content-hashed chunk per figure, so a visit to
// /china/policies fetches one or two maps instead of all eleven.
const FIGURE_MODULES = {
  "han-ring-pommel-saber": () => import("./figures/han-ring-pommel-saber.svg?raw"),
  "han-thirteen-provinces": () => import("./figures/han-thirteen-provinces.svg?raw"),
  "ming-two-capitals-thirteen-provinces": () =>
    import("./figures/ming-two-capitals-thirteen-provinces.svg?raw"),
  "qin-bronze-sword": () => import("./figures/qin-bronze-sword.svg?raw"),
  "qin-commanderies": () => import("./figures/qin-commanderies.svg?raw"),
  "qing-eighteen-provinces": () => import("./figures/qing-eighteen-provinces.svg?raw"),
  "song-twenty-three-circuits": () => import("./figures/song-twenty-three-circuits.svg?raw"),
  "sui-grand-canal": () => import("./figures/sui-grand-canal.svg?raw"),
  "tang-fifteen-circuits": () => import("./figures/tang-fifteen-circuits.svg?raw"),
  "wjnb-prefectures": () => import("./figures/wjnb-prefectures.svg?raw"),
  "yuan-provinces": () => import("./figures/yuan-provinces.svg?raw"),
} satisfies Record<string, () => Promise<{ default: string }>>;

export type PolicyFigureId = keyof typeof FIGURE_MODULES;

const figureIds = new Set<string>(Object.keys(FIGURE_MODULES));

export function isPolicyFigureId(value: string): value is PolicyFigureId {
  return figureIds.has(value);
}

function SvgMarkup({ className, markup, title }: PolicyFigureComponentProps & { markup: string }) {
  return (
    <span
      aria-label={title}
      className={className}
      role="img"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local SVG figures migrated from project data
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function PolicyFigurePlaceholder({ className }: { className?: string }) {
  return <span aria-hidden="true" className={`policy-figure-placeholder ${className ?? ""}`} />;
}

// React re-invokes a lazy factory every time its boundary re-suspends, so the component
// identity has to be cached per figure rather than rebuilt during render.
const figureComponents = new Map<PolicyFigureId, ComponentType<PolicyFigureComponentProps>>();

function getFigureComponent(id: PolicyFigureId) {
  const cached = figureComponents.get(id);

  if (cached) {
    return cached;
  }

  const component: ComponentType<PolicyFigureComponentProps> = lazy(async () => {
    const { default: markup } = await FIGURE_MODULES[id]();
    return {
      default: function LoadedPolicyFigure(props: PolicyFigureComponentProps) {
        return <SvgMarkup {...props} markup={markup} />;
      },
    };
  });

  figureComponents.set(id, component);
  return component;
}

interface PolicyFigureProps extends PolicyFigureComponentProps {
  id: PolicyFigureId;
}

export function PolicyFigure({ className, id, title }: PolicyFigureProps) {
  const Figure = getFigureComponent(id);

  return (
    <Suspense fallback={<PolicyFigurePlaceholder className={className} />}>
      <Figure className={className} title={title} />
    </Suspense>
  );
}
