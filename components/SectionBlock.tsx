import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionBlockProps {
  children: ReactNode;
  className?: string;
  variant?: "white" | "surface";
  id?: string;
}

export function SectionBlock({ children, className, variant = "white", id }: SectionBlockProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-section-mobile lg:py-section",
        {
          "bg-surface": variant === "white",
          "bg-surface-soft": variant === "surface",
        },
        className
      )}
    >
      <div className="max-w-full px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
