import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Trimmed full wordmark aspect (785×256). Regenerate via `npm run generate-logos`. */
const FULL_LOGO_ASPECT = 785 / 256;

export function TubePathLogo({
  size = 32,
  variant = "icon",
  href,
  className,
}: {
  size?: number;
  /** Icon-only for compact UI; full wordmark for marketing headers. */
  variant?: "icon" | "full";
  href?: string;
  className?: string;
}) {
  const isFull = variant === "full";
  const width = isFull ? Math.round(size * FULL_LOGO_ASPECT) : size;
  const height = size;

  const content = (
    <span
      className="relative block shrink-0"
      style={{ width, height }}
    >
      <Image
        src={isFull ? "/logo-full.png" : "/logo-icon.png"}
        alt="TubePath"
        fill
        className={cn(
          isFull ? "object-contain object-left" : "object-contain object-center"
        )}
        sizes={`${width}px`}
        priority
      />
    </span>
  );

  const classes = cn("flex items-center", className);

  if (href) {
    return (
      <Link href={href} className={cn(classes, "transition-opacity hover:opacity-90")}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
