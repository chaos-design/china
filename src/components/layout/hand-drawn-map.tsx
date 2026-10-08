import { cn } from "../../lib/utils";
import {
  MAP_HAINAN_OUTLINE,
  MAP_LAND_BLEED,
  MAP_LAND_OUTLINE,
  MAP_TAIWAN_OUTLINE,
  MAP_VIEW,
  MAP_ZONES,
  type MapZoneId,
} from "./china-map-geometry";

/**
 * 手绘中国舆图。纯装饰层：不接受点击、不参与导航，只为菜单面板提供空间感。
 *
 * 几何与分区数据在 china-map-geometry.ts，这里只负责把它们画成节点。
 */
export function HandDrawnMap({ activeZone }: { activeZone: MapZoneId }) {
  return (
    // 装饰层：不接受指针事件，也不进入无障碍树。
    <svg
      aria-hidden="true"
      className="hand-drawn-map"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
    >
      <defs>
        {/* 笔触位移：给所有线条一层墨线的抖动，和几何抖动叠加成"手画"而不是"手抖" */}
        <filter id="map-brush" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            baseFrequency="0.012 0.021"
            numOctaves={3}
            result="grain"
            seed={7}
            type="fractalNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={5}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* 洇墨：同一轮廓再描一遍更粗更淡的线，模拟宣纸吃墨 */}
        <filter id="map-bleed" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <g filter="url(#map-brush)">
        <path className="map-land map-land-bleed" d={MAP_LAND_BLEED} filter="url(#map-bleed)" />
        <path className="map-land" d={MAP_LAND_OUTLINE} />
        <path className="map-land map-land-faint" d={MAP_TAIWAN_OUTLINE} />
        <path className="map-land map-land-faint" d={MAP_HAINAN_OUTLINE} />

        {MAP_ZONES.map((zone) => (
          <g
            className={cn("map-zone", zone.id === activeZone && "map-zone-active")}
            data-zone={zone.id}
            key={zone.id}
          >
            {zone.strokes.map((stroke, index) => (
              <path className={stroke.className} d={stroke.d} key={`${zone.id}-${index}`} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
