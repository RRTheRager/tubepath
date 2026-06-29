import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Full wordmark or icon-only mark */
  variant?: "full" | "icon";
  href?: string;
  className?: string;
  priority?: boolean;
};

/** Source PNG dimensions (used for Next.js layout; display size via className). */
const ASSETS = {
  icon: { src: "/logo-icon.png", width: 1280, height: 720 },
  full: { src: "/logo-full.png", width: 1024, height: 1024 },
} as const;

export function Logo({
  variant = "full",
  href,
  className,
  priority = false,
}: LogoProps) {
  const asset = ASSETS[variant];

  const img =
    variant === "icon" ? (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-md",
          className
        )}
      >
        <Image
          src={asset.src}
          alt="TubePath"
          width={asset.width}
          height={asset.height}
          priority={priority}
          className="h-full w-full object-cover object-left"
        />
      </span>
    ) : (
      <Image
        src={asset.src}
        alt="TubePath"
        width={asset.width}
        height={asset.height}
        priority={priority}
        className={cn("h-auto w-auto shrink-0 object-contain", className)}
      />
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
