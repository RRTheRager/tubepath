import { BarChart3, Info, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "empty" | "unavailable" | "locked";

const icons: Record<Variant, typeof Info> = {
  empty: BarChart3,
  unavailable: Info,
  locked: Lock,
};

export function DataNotice({
  title,
  description,
  variant = "empty",
  className,
}: {
  title: string;
  description: string;
  variant?: Variant;
  className?: string;
}) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
