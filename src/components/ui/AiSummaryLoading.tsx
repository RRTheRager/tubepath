import { Loader2, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function AiSummaryLoading({
  label = "Generating AI summary",
  className,
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        {label}
      </div>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <CardHeader
        title="AI analysis"
        action={
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> AI
          </span>
        }
      />
      <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
        {label}
      </div>
    </Card>
  );
}
