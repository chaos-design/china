import { useId } from "react";

import { cn } from "../../../lib/utils";
import type { AtlasRankLevel } from "./data";
import { badgeImage, hatImage, type RankImage, robeImage } from "./rank-images";

/**
 * 品秩图示：优先渲染 rank-images.ts 里的真实博物馆藏品照（Commons 公有领域 / CC0），
 * 缺图条目回落到内联 SVG 细绘。SVG 用丝绢 / 天鹅绒渐变、翎羽眼斑、金线绣边、
 * 海水江崖与禽兽特征绘图；顶珠与服色仍按数据里的真实色值着色。
 * 图形本身 aria-hidden，文字由相邻节点承担；真实图片的出处由 RankImageCredits 落页脚。
 */

/** 真实藏品照统一小图：圆角 + 细边，与卡片语言一致；title 带藏品说明。 */
function RankImageTile({ className, image }: { className?: string; image: RankImage }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn("border border-ink/15 object-cover shadow-sm", className)}
      loading="lazy"
      src={image.src}
      title={image.caption}
    />
  );
}

/** 页脚图源：逐条链接本节用到的 Commons 文件页（按出处去重）。 */
export function RankImageCredits({ images }: { images: RankImage[] }) {
  const seen = new Set<string>();
  const unique = images.filter((image) => {
    if (seen.has(image.source)) {
      return false;
    }
    seen.add(image.source);
    return true;
  });
  if (unique.length === 0) {
    return null;
  }
  return (
    <p className="font-mono-tech text-[0.62rem] leading-relaxed text-muted-foreground">
      图源：
      {unique.map((image, index) => (
        <span key={image.source}>
          {index > 0 ? " · " : null}
          <a
            className="underline decoration-dotted underline-offset-2 hover:text-vermillion"
            href={image.source}
            rel="noreferrer"
            target="_blank"
          >
            {image.caption}
          </a>
        </span>
      ))}
    </p>
  );
}

function shade(hex: string | undefined, fallback: string): string {
  return hex?.startsWith("#") ? hex : fallback;
}

/** 顶戴：真实顶珠 / 印绶 / 冠帽藏品照优先，缺图回落手绘暖帽。 */
export function HatIllustration({ level }: { level: AtlasRankLevel }) {
  const image = hatImage(level.hat);
  const raw = useId();
  const uid = raw.replace(/:/g, "");
  if (image) {
    return <RankImageTile className="h-16 w-[4.5rem] rounded-md" image={image} />;
  }
  const bead = shade(level.hatColor, "#b03a2e");

  return (
    <svg
      aria-hidden="true"
      className="h-16 w-[4.5rem]"
      fill="none"
      viewBox="0 0 96 84"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-velvet`} x1="24" x2="72" y1="16" y2="52">
          <stop stopColor="#525968" />
          <stop offset="0.42" stopColor="#1d222b" />
          <stop offset="1" stopColor="#363d4b" />
        </linearGradient>
        <linearGradient id={`${uid}-brim`} x1="18" x2="78" y1="44" y2="56">
          <stop stopColor="#343b46" />
          <stop offset="0.5" stopColor="#0d1116" />
          <stop offset="1" stopColor="#2a303a" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#f7e3a3" />
          <stop offset="0.5" stopColor="#c19a35" />
          <stop offset="1" stopColor="#6f5018" />
        </linearGradient>
        <linearGradient id={`${uid}-feather`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#86a98a" />
          <stop offset="1" stopColor="#2b4c39" />
        </linearGradient>
        <radialGradient id={`${uid}-bead`} cx="0.35" cy="0.3" r="0.75">
          <stop stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.32" stopColor={bead} />
          <stop offset="0.72" stopColor={bead} />
          <stop offset="1" stopColor="#120b0b" stopOpacity="0.62" />
        </radialGradient>
      </defs>

      {/* 孔雀翎：两根主羽枝 + 眼斑 + 绒枝 */}
      <g stroke={`url(#${uid}-feather)`} strokeLinecap="round">
        <path d="M46 26 C33 13 18 12 8 6" strokeWidth="2.1" />
        <path d="M50 26 C63 13 78 12 88 6" strokeWidth="2.1" />
        <path d="M16 9 l5 5 M25 14 l5 5 M80 9 l-5 5 M71 14 l-5 5" strokeWidth="1" opacity="0.75" />
      </g>
      <g stroke="#9abf9c" strokeWidth="0.7" opacity="0.7">
        <path d="M19 11 l4 1 M27 16 l4 1 M77 11 l-4 1 M69 16 l-4 1" />
      </g>
      <g>
        <ellipse cx="10" cy="7" rx="5.2" ry="3.4" fill="#436a4b" transform="rotate(-22 10 7)" />
        <ellipse cx="10" cy="7" rx="3.1" ry="2" fill="#c6a23a" transform="rotate(-22 10 7)" />
        <ellipse cx="10" cy="7" rx="1.5" ry="1" fill="#2c4d38" transform="rotate(-22 10 7)" />
        <ellipse cx="86" cy="7" rx="5.2" ry="3.4" fill="#436a4b" transform="rotate(22 86 7)" />
        <ellipse cx="86" cy="7" rx="3.1" ry="2" fill="#c6a23a" transform="rotate(22 86 7)" />
        <ellipse cx="86" cy="7" rx="1.5" ry="1" fill="#2c4d38" transform="rotate(22 86 7)" />
      </g>

      {/* 帽盔：上尖下阔的暖帽，带绒面高光与细纹 */}
      <path
        d="M48 17 C35 18 26 31 23 49 C33 52 63 52 73 49 C70 31 61 18 48 17 Z"
        fill={`url(#${uid}-velvet)`}
        stroke="#0f131a"
        strokeWidth="0.9"
      />
      <path d="M39 25 C34 31 31 39 30 47" stroke="#8892a2" strokeWidth="1.6" opacity="0.22" />
      <path d="M57 23 C62 29 65 38 66 46" stroke="#000000" strokeWidth="2" opacity="0.2" />
      <g stroke="#aab3c0" strokeWidth="0.45" opacity="0.14">
        <path d="M34 30 l38 0 M30 37 l45 0 M27 44 l50 0" />
        <path d="M41 20 l-5 28 M55 20 l6 28" />
      </g>

      {/* 上翘帽檐：内外两缘与沿线金边 */}
      <path
        d="M17 48 C17 56 31 60 48 60 C65 60 79 56 79 48 C79 53 65 56 48 56 C31 56 17 53 17 48 Z"
        fill={`url(#${uid}-brim)`}
        stroke="#080b0f"
        strokeWidth="0.8"
      />
      <path
        d="M19 50 C25 55 71 55 77 50"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="0.8"
        opacity="0.6"
      />
      <ellipse cx="48" cy="48" rx="24" ry="4.4" stroke="#6d7686" strokeWidth="0.6" opacity="0.4" />

      {/* 金托与顶珠：品级的核心标志 */}
      <path
        d="M41 21 L55 21 L53 26 L43 26 Z"
        fill={`url(#${uid}-gold)`}
        stroke="#5b4415"
        strokeWidth="0.6"
      />
      <path d="M44 23 L52 23" stroke="#fff0bd" strokeWidth="0.6" opacity="0.8" />
      <circle
        cx="48"
        cy="13"
        r="9.2"
        fill={`url(#${uid}-bead)`}
        stroke="#1a1010"
        strokeWidth="0.7"
      />
      <ellipse
        cx="44.8"
        cy="9.6"
        rx="2.6"
        ry="1.7"
        fill="#ffffff"
        opacity="0.75"
        transform="rotate(-28 44.8 9.6)"
      />
      <path d="M42 18 C45 20 51 20 54 18" stroke="#ffffff" strokeWidth="0.7" opacity="0.25" />
    </svg>
  );
}

/** 朝服：真实袍服 / 官员画像照优先（按 朝代:服色 查索引），缺图回落手绘补服。 */
export function RobeIllustration({
  dynastyId,
  level,
}: {
  dynastyId: string;
  level: AtlasRankLevel;
}) {
  const image = robeImage(dynastyId, level.robe);
  const raw = useId();
  const uid = raw.replace(/:/g, "");
  if (image) {
    return <RankImageTile className="h-20 w-16 rounded-md" image={image} />;
  }
  const robe = shade(level.robeColor, "#263746");

  return (
    <svg
      aria-hidden="true"
      className="h-20 w-16"
      fill="none"
      viewBox="0 0 104 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-silk`} x1="16" x2="88" y1="18" y2="118">
          <stop stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="0.24" stopColor={robe} />
          <stop offset="0.72" stopColor={robe} />
          <stop offset="1" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${uid}-sleeve`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor={robe} />
          <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#f8e5ab" />
          <stop offset="0.55" stopColor="#c7a03e" />
          <stop offset="1" stopColor="#75551b" />
        </linearGradient>
        <linearGradient id={`${uid}-badge`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#e9dfc6" />
          <stop offset="1" stopColor="#c9b98f" />
        </linearGradient>
      </defs>

      {/* 阔袖：袖口收窄，褶线随袖走向 */}
      <path
        d="M36 26 C26 29 14 40 4 56 L12 72 C22 60 31 52 39 48 Z"
        fill={`url(#${uid}-sleeve)`}
        stroke="#0a1018"
        strokeWidth="0.8"
      />
      <path
        d="M68 26 C78 29 90 40 100 56 L92 72 C82 60 73 52 65 48 Z"
        fill={`url(#${uid}-sleeve)`}
        stroke="#0a1018"
        strokeWidth="0.8"
      />
      <path
        d="M7 58 L15 69 M13 54 L21 65 M97 58 L89 69 M91 54 L83 65"
        stroke="#d8c88f"
        strokeWidth="0.6"
        opacity="0.55"
      />

      {/* 衣身：肩、腰、下摆一气贯穿 */}
      <path
        d="M38 22 C43 18 61 18 66 22 C72 30 74 44 73 62 L78 112 C62 117 42 117 26 112 L31 62 C30 44 32 30 38 22 Z"
        fill={`url(#${uid}-silk)`}
        stroke="#0a1018"
        strokeWidth="0.9"
      />
      <g stroke="#ffffff" strokeWidth="0.6" opacity="0.16">
        <path d="M40 30 L35 108 M52 34 L52 112 M64 30 L69 108" />
      </g>

      {/* 圆领与右衽：两道金线勾边 */}
      <path
        d="M38 22 C42 32 62 32 66 22"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M52 31 C45 48 44 66 46 84" stroke="#070d14" strokeWidth="2" opacity="0.45" />
      <path
        d="M53 31 C48 47 47 64 49 82"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="0.7"
        opacity="0.75"
      />
      <path d="M52 34 C60 46 66 52 70 55" stroke="#d8c88f" strokeWidth="0.7" opacity="0.5" />

      {/* 胸前补子：金框绫地 + 写意飞禽 */}
      <rect
        x="40"
        y="42"
        width="24"
        height="24"
        rx="1"
        fill={`url(#${uid}-badge)`}
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1.4"
      />
      <rect x="42.5" y="44.5" width="19" height="19" rx="0.6" stroke="#8a6d2f" strokeWidth="0.6" />
      <path d="M47 57 C47 52 51 49 54 50 C57 51 58 54 56 57 Z" fill="#2f3a44" />
      <path
        d="M47 54 C43 52 41 53 40 51 M56 54 C60 52 62 53 63 51"
        stroke="#2f3a44"
        strokeWidth="1.2"
      />
      <circle cx="53" cy="48" r="1.8" fill="#2f3a44" />
      <path d="M50 58 l-1 3 M56 58 l1 3" stroke="#8a6d2f" strokeWidth="0.6" />
      <path d="M45 64 L59 64" stroke="#a98a4a" strokeWidth="0.5" opacity="0.7" />

      {/* 腰带与玉佩垂绦 */}
      <path
        d="M31 67 C45 71 59 71 73 67 L73 73 C59 77 45 77 31 73 Z"
        fill={`url(#${uid}-gold)`}
        stroke="#634815"
        strokeWidth="0.6"
      />
      <path
        d="M38 70 L45 71 M47 71 L54 72 M56 72 L63 71"
        stroke="#fff0bd"
        strokeWidth="0.6"
        opacity="0.8"
      />
      <path d="M60 75 L60 90 M64 75 L64 87" stroke="#b5463a" strokeWidth="1" />
      <circle cx="60" cy="91" r="1.7" fill="#e8e2d0" stroke="#b09a5e" strokeWidth="0.5" />
      <circle cx="64" cy="88" r="1.4" fill="#e8e2d0" stroke="#b09a5e" strokeWidth="0.5" />

      {/* 下摆开衩 + 海水江崖：清代朝服最具辨识度的纹样 */}
      <path d="M52 84 L52 114" stroke="#000000" strokeWidth="1" opacity="0.28" />
      <path d="M28 111 L35 107 M76 111 L69 107" stroke="#000000" strokeWidth="0.8" opacity="0.3" />
      <path
        d="M26 114 C38 108 45 119 52 113 C59 119 66 108 78 114"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1.2"
        opacity="0.85"
      />
      <path
        d="M26 119 C38 113 45 123 52 117 C59 123 66 113 78 119"
        stroke="#e6d6a6"
        strokeWidth="0.8"
        opacity="0.65"
      />
      <path
        d="M38 115 l4 -7 l4 7 M58 115 l5 -9 l5 9"
        stroke="#c9a227"
        strokeWidth="0.7"
        opacity="0.7"
      />
    </svg>
  );
}

type AnimalVariant = {
  primary: string;
  accent: string;
  kind: "bird" | "beast";
  tail: "short" | "long" | "fan";
  crown?: boolean;
  mane?: boolean;
  horn?: boolean;
  stripes?: boolean;
  spots?: boolean;
};

const ANIMALS: Record<string, AnimalVariant> = {
  仙鹤: { primary: "#f2efe4", accent: "#23323b", kind: "bird", tail: "short", crown: true },
  锦鸡: { primary: "#d9a441", accent: "#81432c", kind: "bird", tail: "long" },
  孔雀: { primary: "#3c8472", accent: "#c8a63b", kind: "bird", tail: "fan" },
  云雁: { primary: "#9aa09a", accent: "#3a4649", kind: "bird", tail: "short" },
  白鹇: { primary: "#eef1ee", accent: "#2f3a44", kind: "bird", tail: "long" },
  鹭鸶: { primary: "#efeee5", accent: "#45525c", kind: "bird", tail: "short" },
  鸂鶒: { primary: "#7c9b8a", accent: "#c9a227", kind: "bird", tail: "long" },
  鹌鹑: { primary: "#9b7448", accent: "#4b3a2a", kind: "bird", tail: "short" },
  练雀: { primary: "#d7d2c0", accent: "#43505a", kind: "bird", tail: "long" },
  麒麟: {
    primary: "#b98d42",
    accent: "#6b4a1d",
    kind: "beast",
    tail: "long",
    horn: true,
    spots: true,
  },
  狮: { primary: "#c99a45", accent: "#7a4a1e", kind: "beast", tail: "short", mane: true },
  豹: { primary: "#c69a53", accent: "#5a3b1f", kind: "beast", tail: "long", spots: true },
  虎: { primary: "#d3a353", accent: "#3b2a1c", kind: "beast", tail: "short", stripes: true },
  熊: { primary: "#7a5b41", accent: "#33251b", kind: "beast", tail: "short" },
  彪: { primary: "#9a7b4e", accent: "#3a2b1c", kind: "beast", tail: "long", stripes: true },
  犀牛: { primary: "#76746b", accent: "#36352f", kind: "beast", tail: "short", horn: true },
  海马: { primary: "#9a8c70", accent: "#4b4030", kind: "beast", tail: "long", mane: true },
};

function variantFor(animal: string, kind: "civil" | "military"): AnimalVariant {
  return (
    ANIMALS[animal] ??
    (kind === "civil"
      ? { primary: "#e8e4d4", accent: "#33414b", kind: "bird", tail: "short" }
      : { primary: "#ad8451", accent: "#3d2f23", kind: "beast", tail: "short" })
  );
}

/** 补子：真实刺绣藏品照优先，缺图回落绫绢方补手绘图。 */
export function BadgeIllustration({
  animal,
  kind,
}: {
  animal: string;
  kind: "civil" | "military";
}) {
  const image = badgeImage(animal);
  const raw = useId();
  const uid = raw.replace(/:/g, "");
  if (image) {
    return <RankImageTile className="h-16 w-[4.5rem] rounded-md" image={image} />;
  }
  const variant = variantFor(animal, kind);

  return (
    <svg
      aria-hidden="true"
      className="h-16 w-[4.5rem]"
      fill="none"
      viewBox="0 0 104 92"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-silk`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#28486c" />
          <stop offset="0.5" stopColor="#162c4b" />
          <stop offset="1" stopColor="#0e2138" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#f6e3a5" />
          <stop offset="0.5" stopColor="#c39a35" />
          <stop offset="1" stopColor="#6c4c15" />
        </linearGradient>
        <linearGradient id={`${uid}-animal`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={variant.primary} />
          <stop offset="1" stopColor={variant.accent} />
        </linearGradient>
        <pattern height="4" id={`${uid}-weave`} patternUnits="userSpaceOnUse" width="4">
          <path d="M0 0 L4 4 M4 0 L0 4" stroke="#ffffff" strokeWidth="0.3" opacity="0.09" />
        </pattern>
      </defs>

      <rect x="2" y="2" width="100" height="88" rx="2" fill={`url(#${uid}-gold)`} />
      <rect
        x="5"
        y="5"
        width="94"
        height="82"
        rx="1"
        fill={`url(#${uid}-silk)`}
        stroke="#7a5f24"
        strokeWidth="0.8"
      />
      <rect x="5" y="5" width="94" height="82" rx="1" fill={`url(#${uid}-weave)`} />
      <rect
        x="8"
        y="8"
        width="88"
        height="76"
        rx="0.8"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1"
        opacity="0.85"
      />

      {/* 四角如意云与右上方红日 */}
      <g stroke="#c9a227" strokeWidth="1" fill="none" opacity="0.8">
        <path d="M12 18 c4 -5 10 -5 13 0 c3 -3 7 -1 7 3" />
        <path d="M92 18 c-4 -5 -10 -5 -13 0 c-3 -3 -7 -1 -7 3" />
        <path d="M12 74 c4 5 10 5 13 0 c3 3 7 1 7 -3" />
        <path d="M92 74 c-4 5 -10 5 -13 0 c-3 3 -7 1 -7 -3" />
      </g>
      <circle cx="78" cy="22" r="7" fill="#a73b30" stroke="#e0b95a" strokeWidth="0.8" />
      <circle cx="76" cy="20" r="2" fill="#f3dca1" opacity="0.55" />

      {variant.kind === "bird" ? (
        <g stroke={variant.accent} strokeWidth="0.7" strokeLinejoin="round">
          {/* 尾羽 */}
          {variant.tail === "fan" ? (
            <g fill={variant.accent} opacity="0.9">
              <path d="M52 56 C38 40 28 42 22 34 C35 37 45 44 54 51 Z" />
              <path d="M52 56 C42 32 42 24 38 16 C48 27 54 40 56 51 Z" />
              <path d="M52 56 C58 32 66 26 72 20 C66 36 62 47 57 54 Z" />
              <path d="M52 56 C66 44 78 44 86 38 C76 50 66 55 55 58 Z" />
            </g>
          ) : (
            <g fill={`url(#${uid}-animal)`}>
              <path d="M48 57 C34 62 25 72 16 78 C31 75 42 69 52 62 Z" />
              <path
                d={
                  variant.tail === "long"
                    ? "M50 57 C44 72 40 80 33 84 C47 80 55 69 56 60 Z"
                    : "M50 57 C43 65 39 69 34 72 C45 71 53 65 56 60 Z"
                }
              />
            </g>
          )}
          {/* 身、翼、颈、首 */}
          <ellipse cx="53" cy="52" rx="17" ry="13" fill={`url(#${uid}-animal)`} />
          <path
            d="M48 46 C39 43 31 47 29 53 C35 51 42 52 48 57 Z"
            fill={variant.accent}
            opacity="0.92"
          />
          <path
            d="M34 50 l12 3 M32 53 l12 3 M36 46 l10 3"
            stroke={variant.primary}
            strokeWidth="0.55"
            opacity="0.8"
          />
          <path d="M64 45 C69 37 70 30 68 25 L75 24 C78 34 73 44 66 51 Z" fill={variant.primary} />
          <circle cx="71" cy="23" r="5" fill={variant.primary} />
          {variant.crown ? <circle cx="71" cy="19" r="2.1" fill="#c43830" stroke="none" /> : null}
          <path d="M75 23 L83 25 L75 27 Z" fill="#d3aa3f" stroke="#7b5a1b" strokeWidth="0.4" />
          <circle cx="72.5" cy="22" r="0.9" fill="#172026" stroke="none" />
          <path
            d="M49 65 L48 73 M57 65 L59 73 M45 73 l6 0 M56 73 l6 0"
            stroke="#d3aa3f"
            strokeWidth="1"
          />
        </g>
      ) : (
        <g stroke={variant.accent} strokeWidth="0.8" strokeLinejoin="round">
          {/* 卷尾与后腿 */}
          <path d="M35 52 C24 47 20 36 26 31 C25 40 33 43 39 47" fill={variant.primary} />
          <path
            d="M40 63 L36 74 L31 78 M60 63 L64 74 L69 78"
            fill="none"
            stroke={variant.accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M31 78 l-4 2 M69 78 l4 2" stroke="#d3aa3f" strokeWidth="1.1" />
          {/* 身躯与鬃毛 / 鳞甲 */}
          <ellipse cx="51" cy="53" rx="22" ry="14" fill={`url(#${uid}-animal)`} />
          {variant.mane ? (
            <g fill={variant.accent} stroke="none" opacity="0.92">
              <circle cx="70" cy="38" r="7" />
              <circle cx="76" cy="43" r="6" />
              <circle cx="77" cy="51" r="6" />
              <circle cx="72" cy="58" r="6" />
              <circle cx="66" cy="62" r="6" />
            </g>
          ) : null}
          <circle cx="74" cy="46" r="9" fill={variant.primary} />
          <path d="M69 38 L67 32 L73 36 M78 38 L81 32 L81 39" fill={variant.accent} stroke="none" />
          {variant.horn ? (
            <g fill="#e0c477" stroke="#7b5a1b" strokeWidth="0.5">
              <path d="M72 38 C70 30 72 24 76 20 C75 28 77 33 76 38 Z" />
              <path d="M78 39 C80 31 84 27 88 25 C85 32 84 36 82 40 Z" />
            </g>
          ) : null}
          <circle cx="77" cy="45" r="1.1" fill="#172026" stroke="none" />
          <path d="M83 50 L88 51 L83 53 Z" fill="#d3aa3f" stroke="none" />
          {variant.stripes ? (
            <g stroke={variant.accent} strokeWidth="1.6" opacity="0.85">
              <path d="M43 41 l4 9 M52 40 l3 10 M61 42 l2 9 M38 51 l5 7 M48 52 l4 8 M58 53 l3 7" />
            </g>
          ) : null}
          {variant.spots ? (
            <g fill={variant.accent} opacity="0.7" stroke="none">
              <circle cx="43" cy="47" r="2" />
              <circle cx="54" cy="45" r="1.7" />
              <circle cx="62" cy="51" r="2.1" />
              <circle cx="47" cy="57" r="1.6" />
              <circle cx="57" cy="59" r="1.9" />
            </g>
          ) : null}
        </g>
      )}

      {/* 下方寿山福海：金线波纹压住补心 */}
      <path
        d="M14 80 C28 74 38 84 52 79 C66 84 76 74 90 80"
        stroke="#d8b45a"
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M18 84 C30 80 40 87 52 83 C64 87 74 80 86 84"
        stroke="#e6d6a6"
        strokeWidth="0.6"
        fill="none"
        opacity="0.6"
      />
      <text fill="#7a5f2a" fontFamily="serif" fontSize="5.2" textAnchor="middle" x="52" y="76">
        {animal}
      </text>
    </svg>
  );
}

export type EssentialName = "rank" | "badge" | "hat" | "robe" | "salary" | "ritual";

/** 六项要义的写实小图标：与上方大图同一套语言，缩小后仍能辨认器物。 */
export function EssentialIllustration({ name }: { name: EssentialName }) {
  const common = { className: "h-8 w-8", viewBox: "0 0 40 40", fill: "none" } as const;

  if (name === "rank") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M4 33 H36 M7 28 H33 M11 22 H29 M16 15 H24"
          stroke="#8a6a2d"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M7 28 L33 28 L29 33 L11 33 Z M11 22 L29 22 L26 28 L14 28 Z M16 15 L24 15 L22 22 L18 22 Z"
          fill="#b08d3f"
          opacity="0.32"
        />
        <circle cx="20" cy="11" r="2.6" fill="#b03a2e" />
        <circle cx="19.2" cy="10.2" r="0.8" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }
  if (name === "badge") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect x="6" y="6" width="28" height="28" rx="1" fill="#b08d3f" />
        <rect
          x="9"
          y="9"
          width="22"
          height="22"
          fill="#1d3554"
          stroke="#e0c477"
          strokeWidth="0.6"
        />
        <path d="M14 24 C14 20 18 18 21 19 C24 20 25 23 23 25 Z" fill="#f1eee3" />
        <path
          d="M16 22 C12 20 11 21 10 20 M23 22 C27 20 28 21 29 20"
          stroke="#f1eee3"
          strokeWidth="1.3"
        />
        <circle cx="22" cy="17" r="1.8" fill="#f1eee3" />
        <path d="M12 28 l4 -2 M24 26 l4 2" stroke="#d8b45a" strokeWidth="0.7" />
      </svg>
    );
  }
  if (name === "hat") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M20 10 C13 11 9 18 8 26 L32 26 C31 18 27 11 20 10 Z"
          fill="#2a303b"
          stroke="#0e1218"
          strokeWidth="0.7"
        />
        <path
          d="M5 26 C5 31 12 33 20 33 C28 33 35 31 35 26 C35 29 28 30 20 30 C12 30 5 29 5 26 Z"
          fill="#141920"
        />
        <path d="M12 14 C9 10 6 9 4 7 M28 14 C31 10 34 9 36 7" stroke="#5c8564" strokeWidth="1.2" />
        <circle cx="20" cy="8" r="4.2" fill="#b03a2e" stroke="#5b1d19" strokeWidth="0.5" />
        <circle cx="18.7" cy="6.8" r="1.2" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }
  if (name === "robe") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M14 9 L5 20 L9 26 L15 21 Z M26 9 L35 20 L31 26 L25 21 Z"
          fill="#263f60"
          stroke="#0d1724"
          strokeWidth="0.6"
        />
        <path
          d="M15 8 C17 6 23 6 25 8 L27 17 L28 33 C23 35 17 35 12 33 L13 17 Z"
          fill="#2b4b73"
          stroke="#0d1724"
          strokeWidth="0.7"
        />
        <path d="M15 8 C17 13 23 13 25 8" stroke="#d8b45a" strokeWidth="1.2" />
        <rect
          x="17"
          y="14"
          width="6"
          height="6"
          fill="#e8dcc3"
          stroke="#b08d3f"
          strokeWidth="0.7"
        />
        <path d="M12 22 L28 22" stroke="#c9a227" strokeWidth="1.8" />
        <path d="M12 32 C17 29 23 35 28 32" stroke="#d8b45a" strokeWidth="0.8" />
      </svg>
    );
  }
  if (name === "salary") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M6 33 L34 33" stroke="#8a6a2d" strokeWidth="1.2" />
        <rect x="9" y="23" width="7" height="10" fill="#b03a2e" opacity="0.75" />
        <rect x="17" y="16" width="7" height="17" fill="#b03a2e" opacity="0.88" />
        <rect x="25" y="10" width="7" height="23" fill="#b03a2e" />
        <path
          d="M9 23 L12.5 20 L16 23 M17 16 L20.5 13 L24 16 M25 10 L28.5 7 L32 10"
          stroke="#d8b45a"
          strokeWidth="0.8"
          fill="#e8dfc6"
        />
        <path d="M8 36 H32" stroke="#8a6a2d" strokeWidth="0.6" opacity="0.6" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" {...common}>
      <path d="M4 34 H36" stroke="#8a6a2d" strokeWidth="1.2" />
      <g fill="#2c425e" stroke="#b08d3f" strokeWidth="0.6">
        <path d="M6 20 L14 20 L14 33 L6 33 Z" />
        <path d="M15 15 L25 15 L25 33 L15 33 Z" />
        <path d="M26 10 L34 10 L34 33 L26 33 Z" />
      </g>
      <path d="M10 24 l4 0 M19 19 l6 0 M30 14 l4 0" stroke="#e0c477" strokeWidth="0.8" />
      <path
        d="M14 33 C20 30 26 30 34 33"
        stroke="#b03a2e"
        strokeWidth="0.9"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
