"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricAnomaly } from "@tubepath/core";
import { cn } from "../lib/cn";

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface MetricChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  formatValue?: (v: number) => string;
  anomalies?: MetricAnomaly[];
  onAnomalyClick?: (anomaly: MetricAnomaly) => void;
  className?: string;
}

export function MetricChart({
  data,
  title,
  color = "hsl(210, 100%, 60%)",
  formatValue = (v) => v.toLocaleString(),
  anomalies = [],
  onAnomalyClick,
  className,
}: MetricChartProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md",
        className
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(d) =>
              new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatValue}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatValue(value), title]}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${title})`}
          />
          {anomalies.map((a) => (
            <ReferenceDot
              key={`${a.date}-${a.metric}`}
              x={a.date}
              y={a.value}
              r={6}
              fill={a.direction === "spike" ? "hsl(var(--success))" : "hsl(var(--danger))"}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              onClick={() => onAnomalyClick?.(a)}
              style={{ cursor: onAnomalyClick ? "pointer" : "default" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
