import { SHAPE_BASE_FILL, type ShapeProps } from "./types";

const TRAY_COUNT = 6;

export function ColumnShape({ node, status, color, fill = 0 }: ShapeProps) {
  const muted = status === "Stopped";
  const innerH = node.h - 60;
  const clamped = Math.max(0, Math.min(100, fill));
  const fillH = (node.h - 4) * (clamped / 100);
  const clipId = `col-clip-${node.id}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect
            x={node.x}
            y={node.y}
            width={node.w}
            height={node.h}
            rx={node.w / 2}
          />
        </clipPath>
      </defs>

      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={node.w / 2}
        fill={SHAPE_BASE_FILL}
        stroke={color}
        strokeWidth={muted ? 1 : 1.5}
        opacity={muted ? 0.7 : 1}
      />

      {fillH > 0 && (
        <rect
          x={node.x + 2}
          y={node.y + node.h - 2 - fillH}
          width={node.w - 4}
          height={fillH}
          fill={color}
          opacity={0.18}
          clipPath={`url(#${clipId})`}
        />
      )}

      {Array.from({ length: TRAY_COUNT }).map((_, i) => (
        <line
          key={i}
          x1={node.x + 6}
          x2={node.x + node.w - 6}
          y1={node.y + 30 + i * (innerH / (TRAY_COUNT - 1))}
          y2={node.y + 30 + i * (innerH / (TRAY_COUNT - 1))}
          stroke={color}
          strokeWidth={0.7}
          opacity={0.4}
        />
      ))}
    </g>
  );
}
