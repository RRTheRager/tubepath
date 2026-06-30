import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Delta({
  value,
  className,
  suffix = "%",
  showIcon = true,
}: {
  value: number;
  className?: string;
  suffix?: string;
  showIcon?: boolean;
}) {
  const positive = value > 0.05;
  const negative = value < -0.05;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  const sign = value > 0.05 ? "+" : value < -0.05 ? "" : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        positive && "text-success",
        negative && "text-danger",
        !positive && !negative && "text-muted-foreground",
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
      {sign}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
