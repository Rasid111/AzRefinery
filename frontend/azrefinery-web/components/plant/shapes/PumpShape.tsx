import { SHAPE_BASE_FILL, type ShapeProps } from "./types";

export function PumpShape({ node, status, color }: ShapeProps) {
  const muted = status === "Stopped";
  const r = Math.min(node.w, node.h) / 2;
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const spinning = status === "Running" || status === "Warning";

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={SHAPE_BASE_FILL}
        stroke={color}
        strokeWidth={muted ? 1 : 1.5}
        opacity={muted ? 0.7 : 1}
      />
      <g
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: spinning ? "azspin 1.6s linear infinite" : undefined,
        }}
      >
        <line
          x1={cx - r * 0.6}
          y1={cy}
          x2={cx + r * 0.6}
          y2={cy}
          stroke={color}
          strokeWidth={1.5}
        />
        <line
          x1={cx}
          y1={cy - r * 0.6}
          x2={cx}
          y2={cy + r * 0.6}
          stroke={color}
          strokeWidth={1.5}
        />
      </g>
    </g>
  );
}
