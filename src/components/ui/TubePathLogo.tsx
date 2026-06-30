import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TubePathLogo({
  size = 32,
  showWordmark = false,
  href,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <Image
        src="/icon.svg"
        alt="TubePath"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight">TubePath</span>
      )}
    </>
  );

  const classes = cn("flex items-center gap-2", className);

  if (href) {
    return (
      <Link href={href} className={cn(classes, "transition-opacity hover:opacity-90")}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
