import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type SurfaceProps = HTMLAttributes<HTMLDivElement>;

export function Surface({ children, className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-surface p-6 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
