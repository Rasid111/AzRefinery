import { SHAPE_BASE_FILL, type ShapeProps } from "./types";

export function TankShape({ node, status, color, fill = 0 }: ShapeProps) {
  const muted = status === "Stopped";
  const clamped = Math.max(0, Math.min(100, fill));
  const fillH = (node.h - 4) * (clamped / 100);

  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={6}
        fill={SHAPE_BASE_FILL}
        stroke={color}
        strokeWidth={muted ? 1 : 1.5}
        opacity={muted ? 0.7 : 1}
      />
      <rect
        x={node.x + 2}
        y={node.y + node.h - 2 - fillH}
        width={node.w - 4}
        height={fillH}
        rx={4}
        fill={color}
        opacity={0.18}
      />
    </g>
  );
}
