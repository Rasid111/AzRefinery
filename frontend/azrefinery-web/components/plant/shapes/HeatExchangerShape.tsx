import { SHAPE_BASE_FILL, type ShapeProps } from "./types";

export function HeatExchangerShape({ node, status, color }: ShapeProps) {
  const muted = status === "Stopped";

  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={node.h / 2}
        fill={SHAPE_BASE_FILL}
        stroke={color}
        strokeWidth={muted ? 1 : 1.5}
        opacity={muted ? 0.7 : 1}
      />
      {[0.3, 0.5, 0.7].map((t, i) => (
        <line
          key={i}
          x1={node.x + 10}
          x2={node.x + node.w - 10}
          y1={node.y + node.h * t}
          y2={node.y + node.h * t}
          stroke={color}
          strokeWidth={0.7}
          opacity={0.45}
        />
      ))}
    </g>
  );
}
