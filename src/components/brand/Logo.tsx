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

/** Trimmed transparent PNG dimensions. */
const ASSETS = {
  icon: { src: "/logo-icon.png", width: 258, height: 181 },
  full: { src: "/logo-full.png", width: 785, height: 258 },
} as const;

export function Logo({
  variant = "full",
  href,
  className,
  priority = false,
}: LogoProps) {
  const asset = ASSETS[variant];

  const img = (
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
