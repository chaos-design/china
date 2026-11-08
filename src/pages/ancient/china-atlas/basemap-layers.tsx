import { MIGRATION_BASEMAP } from "./migration-projection";

/**
 * 真实底图的公共图层：省界 → 国界 → 岛屿 → 九段线 → 经纬网 → 河流 → 海名。
 * 民族迁徙与边疆治理两张地图共用这一份渲染，
 * 图层样式只在这里调一处——两页的底图永远一致。
 *
 * 聚焦时把经纬网、河名、海名这类辅助文字淡下去，只留省界与国界做地理参照，
 * 避免放大后底图注记和图谱标注抢读。
 */
export function BasemapLayers({ subdued = false }: { subdued?: boolean }) {
  const noteOpacity = subdued ? 0.18 : 1;
  return (
    <>
      <g fill="hsl(var(--ink) / 0.035)" stroke="hsl(var(--ink) / 0.16)" strokeWidth={0.14}>
        {MIGRATION_BASEMAP.provinces.map((province) => (
          <path d={province.d} key={province.n} />
        ))}
      </g>
      <path
        d={MIGRATION_BASEMAP.islandsPath}
        fill="hsl(var(--ink) / 0.035)"
        stroke="hsl(var(--ink) / 0.2)"
        strokeWidth={0.14}
      />
      <path
        d={MIGRATION_BASEMAP.borderPath}
        fill="none"
        stroke="hsl(var(--ink) / 0.4)"
        strokeWidth={0.28}
      />
      <path
        d={MIGRATION_BASEMAP.nineDashPath}
        fill="none"
        stroke="hsl(var(--ink) / 0.28)"
        strokeWidth={0.2}
      />
      <path
        d={MIGRATION_BASEMAP.graticule.d}
        fill="none"
        opacity={noteOpacity}
        stroke="hsl(var(--ink) / 0.08)"
        strokeWidth={0.08}
      />
      {MIGRATION_BASEMAP.graticule.labels.map((label) => (
        <text
          className="font-body"
          fill="hsl(var(--ink) / 0.32)"
          fontSize={1.5}
          key={label.t}
          opacity={noteOpacity}
          textAnchor={label.a as "middle"}
          x={label.x}
          y={label.y}
        >
          {label.t}
        </text>
      ))}
      <g fill="none" stroke="hsl(var(--blueprint) / 0.4)">
        {MIGRATION_BASEMAP.rivers.map((river) => (
          <path d={river.d} key={river.n} strokeWidth={river.w * 0.3} />
        ))}
      </g>
      {MIGRATION_BASEMAP.rivers.map((river) => (
        <text
          className="font-body"
          fill="hsl(var(--blueprint) / 0.62)"
          fontSize={1.7}
          key={`${river.n}-label`}
          opacity={noteOpacity}
          textAnchor="middle"
          x={river.label[0]}
          y={river.label[1]}
        >
          {river.n}
        </text>
      ))}
      {MIGRATION_BASEMAP.seas.map((sea) => (
        <text
          className="font-body"
          fill="hsl(var(--blueprint) / 0.5)"
          fontSize={2.1}
          key={sea.t}
          opacity={noteOpacity}
          textAnchor="middle"
          x={sea.x}
          y={sea.y}
        >
          {sea.t}
        </text>
      ))}
    </>
  );
}
