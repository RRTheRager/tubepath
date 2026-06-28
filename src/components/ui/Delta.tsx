import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Delta({
  value,
  className,
  suffix = "%",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const positive = value > 0.05;
  const negative = value < -0.05;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

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
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
