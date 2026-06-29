import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Full wordmark or icon-only mark */
  variant?: "full" | "icon";
  /** Render as a link (default `/` for full, `/app/feed` for icon in app) */
  href?: string;
  className?: string;
  priority?: boolean;
};

const SIZES = {
  full: { width: 148, height: 38 },
  icon: { width: 32, height: 32 },
} as const;

export function Logo({
  variant = "full",
  href,
  className,
  priority = false,
}: LogoProps) {
  const { width, height } = SIZES[variant];
  const iconSrc = "/logo-icon.svg";
  const fullLight = "/logo-full.svg";
  const fullDark = "/logo-full-dark.svg";

  const img =
    variant === "icon" ? (
      <Image
        src={iconSrc}
        alt="TubePath"
        width={width}
        height={height}
        priority={priority}
        className={cn("h-auto w-auto shrink-0", className)}
      />
    ) : (
      <>
        <Image
          src={fullLight}
          alt="TubePath"
          width={width}
          height={height}
          priority={priority}
          className={cn("h-auto w-auto shrink-0 dark:hidden", className)}
        />
        <Image
          src={fullDark}
          alt=""
          aria-hidden
          width={width}
          height={height}
          priority={priority}
          className={cn("hidden h-auto w-auto shrink-0 dark:block", className)}
        />
      </>
    );

  if (href === undefined) {
    return <span className="inline-flex items-center">{img}</span>;
  }

  return (
    <Link href={href} className="inline-flex items-center focus-outline rounded-md">
      {img}
    </Link>
  );
}
