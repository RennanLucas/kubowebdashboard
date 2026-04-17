import { ReactNode, useMemo } from "react";

interface SparklinesProps {
  data: number[];
  width?: number;
  height?: number;
  margin?: number;
  children: ReactNode;
}

interface SparklinesLineProps {
  color?: string;
  strokeWidth?: number;
}

interface ChartContext {
  points: string;
  fillPath: string;
}

const ChartCtx = (data: number[], width: number, height: number, margin: number): ChartContext => {
  if (data.length === 0) return { points: "", fillPath: "" };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = width - margin * 2;
  const h = height - margin * 2;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const pts = data.map((v, i) => {
    const x = margin + i * step;
    const y = margin + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const points = pts.join(" ");
  const fillPath = `M${margin},${height - margin} L${pts.join(" L")} L${margin + w},${height - margin} Z`;
  return { points, fillPath };
};

export function Sparklines({ data, width = 120, height = 40, margin = 2, children }: SparklinesProps) {
  const ctx = useMemo(() => ChartCtx(data, width, height, margin), [data, width, height, margin]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
      {Array.isArray(children)
        ? children.map((c, i) => (typeof c === "object" && c ? <SparklineRender key={i} ctx={ctx} node={c as any} /> : null))
        : children
        ? <SparklineRender ctx={ctx} node={children as any} />
        : null}
    </svg>
  );
}

function SparklineRender({ ctx, node }: { ctx: ChartContext; node: { type: any; props: any } }) {
  const Type = node.type;
  if (Type === SparklinesLine) {
    const { color = "currentColor", strokeWidth = 1.5 } = node.props as SparklinesLineProps;
    return (
      <>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={ctx.points}
          vectorEffect="non-scaling-stroke"
        />
        <path d={ctx.fillPath} fill={color} opacity={0.12} />
      </>
    );
  }
  return null;
}

export function SparklinesLine(_props: SparklinesLineProps) {
  return null;
}
