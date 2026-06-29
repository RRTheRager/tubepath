"use client";

import { cn } from "@/lib/utils";

export type StudioTab =
  | "overview"
  | "reach"
  | "engagement"
  | "audience"
  | "revenue";

const TABS: { value: StudioTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "reach", label: "Reach" },
  { value: "engagement", label: "Engagement" },
  { value: "audience", label: "Audience" },
  { value: "revenue", label: "Revenue" },
];

export function StudioTabBar({
  value,
  onChange,
}: {
  value: StudioTab;
  onChange: (tab: StudioTab) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="flex min-w-max gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "tap-target shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              value === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
