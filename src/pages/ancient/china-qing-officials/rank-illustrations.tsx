import type { AtlasRankLevel } from "./data";

/**
 * 品秩图示：顶戴、朝服、补子一律用内联 SVG 手绘，替代原先的「一个色块 + 一句话」。
 * 全部按传入的真实色值上色，纹样为示意性的传统造型，不引入任何外部图片资源。
 * 纯装饰，aria-hidden，可访问信息由相邻的品级文字承担。
 */

function shade(hex: string | undefined, fallback: string): string {
  return hex?.startsWith("#") ? hex : fallback;
}

/** 顶戴：暖帽（顶部尖顶）+ 帽檐 + 顶珠 + 两侧孔雀翎，顶珠按品级色。 */
export function HatIllustration({ level }: { level: AtlasRankLevel }) {
  const bead = shade(level.hatColor, "#b03a2e");
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-14"
      viewBox="0 0 56 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 孔雀翎：自帽后向两侧斜出的两根羽枝 */}
      <path
        d="M28 15 C18 8 10 8 5 3 M28 15 C38 8 46 8 51 3"
        stroke="#4a6b52"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9 6 l3 3 M14 9 l3 3 M47 6 l-3 3 M42 9 l-3 3"
        stroke="#6a8a6f"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* 帽体：上尖下阔的暖帽盔 */}
      <path d="M28 8 C20 8 14 15 13 24 L43 24 C42 15 36 8 28 8 Z" fill="#2f3540" />
      <path d="M28 8 C24 8 20 11 18 16 L38 16 C36 11 32 8 28 8 Z" fill="#454c5a" opacity="0.7" />
      {/* 帽檐：一圈上翘的边 */}
      <path
        d="M11 24 C11 28 20 30 28 30 C36 30 45 28 45 24 C45 27 36 29 28 29 C20 29 11 27 11 24 Z"
        fill="#20252e"
      />
      {/* 顶珠：品级的核心标志，带高光 */}
      <circle
        cx="28"
        cy="7"
        r="4.6"
        fill={bead}
        stroke="#000"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />
      <circle cx="26.6" cy="5.6" r="1.3" fill="#fff" opacity="0.55" />
      {/* 顶座小金托 */}
      <path d="M25 11 L31 11 L30 13 L26 13 Z" fill="#c9a227" />
    </svg>
  );
}

/** 朝服：石青补服正面轮廓——圆领、右衽、两袖、下摆开衩，胸前一方补子。 */
export function RobeIllustration({ level }: { level: AtlasRankLevel }) {
  const robe = shade(level.robeColor, "#263746");
  return (
    <svg
      aria-hidden="true"
      className="h-14 w-12"
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 两袖 */}
      <path d="M16 13 L4 22 L8 30 L17 24 Z" fill={robe} />
      <path d="M32 13 L44 22 L40 30 L31 24 Z" fill={robe} />
      {/* 衣身 */}
      <path
        d="M17 11 C17 11 21 8 24 8 C27 8 31 11 31 11 L34 20 L33 48 L15 48 L14 20 Z"
        fill={robe}
      />
      {/* 圆领与右衽交叠 */}
      <path
        d="M19 11 C20 15 28 15 29 11"
        stroke="#d9c48a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M24 12 L20 30 L24 32" stroke="#000" strokeOpacity="0.22" strokeWidth="0.9" />
      {/* 下摆中缝与开衩 */}
      <path d="M24 32 L24 48" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" />
      <path d="M15 48 L20 45 M33 48 L28 45" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" />
      {/* 胸前补子方纹 */}
      <rect
        x="20"
        y="19"
        width="8"
        height="8"
        rx="0.6"
        fill="#e8dcc3"
        stroke="#c9a227"
        strokeWidth="0.7"
      />
      <path
        d="M22.5 24 C22.5 22 25.5 22 25.5 24 M24 22 L24 26"
        stroke="#8a6d2f"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      {/* 腰带 */}
      <path d="M15 31 L33 31" stroke="#c9a227" strokeWidth="1.4" opacity="0.8" />
    </svg>
  );
}

/** 补子纹样：方补框内一只写意飞禽或走兽的剪影，按文武分形。 */
export function BadgeIllustration({
  animal,
  kind,
}: {
  animal: string;
  kind: "civil" | "military";
}) {
  return (
    <svg
      aria-hidden="true"
      className="h-11 w-14"
      viewBox="0 0 56 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 绫绢方补底与双层金边 */}
      <rect
        x="3"
        y="3"
        width="50"
        height="38"
        rx="2"
        fill="#e8dcc3"
        stroke="#b08d3f"
        strokeWidth="1.2"
      />
      <rect
        x="6"
        y="6"
        width="44"
        height="32"
        rx="1"
        stroke="#c9a227"
        strokeWidth="0.6"
        opacity="0.8"
      />
      {/* 四角云纹 */}
      <path
        d="M9 11 q3 -3 6 0 M41 11 q3 -3 6 0 M9 33 q3 3 6 0 M41 33 q3 3 6 0"
        stroke="#a98a4a"
        strokeWidth="0.8"
        opacity="0.7"
      />
      {kind === "civil" ? (
        <g fill="#2f3a44" stroke="#1d242b" strokeWidth="0.5">
          {/* 飞禽：展翅、昂首、长尾 */}
          <path d="M28 30 C24 30 21 27 21 23 C21 19 24 16 28 16 C32 16 35 19 35 23 C35 27 32 30 28 30 Z" />
          <path d="M21 22 C14 18 9 19 7 16 C13 16 18 18 22 20 Z" />
          <path d="M35 22 C42 18 47 19 49 16 C43 16 38 18 34 20 Z" />
          <path
            d="M28 30 C26 34 24 36 22 38 M28 30 C30 34 32 36 34 38"
            stroke="#2f3a44"
            strokeWidth="1.2"
          />
          <circle cx="28" cy="13" r="2.4" />
          <path d="M30 12 L33 11 L30 14 Z" fill="#c9a227" />
        </g>
      ) : (
        <g fill="#3a2f2b" stroke="#241d1a" strokeWidth="0.5">
          {/* 走兽：侧身、昂首、卷尾、四足 */}
          <path d="M18 27 C18 22 22 19 30 19 C36 19 39 21 40 25 L43 24 L41 28 L42 32 L38 32 L37 29 L24 29 L23 33 L19 33 L20 28 Z" />
          <circle cx="39" cy="17" r="3" />
          <path d="M37 15 L36 12 L39 14 L41 12 L41 15 Z" />
          <path d="M18 26 C13 23 11 26 12 30 C13 27 16 27 18 28 Z" />
        </g>
      )}
      {/* 品级动物名以极小篆意刻于补下沿，图形为主、文字为辅 */}
      <text x="28" y="39" textAnchor="middle" fontSize="5" fill="#7a5f2a" fontFamily="serif">
        {animal}
      </text>
    </svg>
  );
}
