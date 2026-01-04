import { forwardRef, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  size?: "sm" | "default" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    const reducedMotion = useReducedMotion();

    const baseClasses = cn(
      "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-primary text-primary-foreground hover:bg-primary-deep": variant === "primary",
        "border-2 border-primary text-primary hover:bg-primary-soft": variant === "outline",
        "h-9 px-4 text-sm": size === "sm",
        "h-11 px-6 text-base": size === "default",
        "h-14 px-8 text-lg": size === "lg",
      },
      className
    );

    if (reducedMotion) {
      return (
        <button ref={ref} className={baseClasses} {...props}>
          {children}
        </button>
      );
    }

    return (
      <motion.button
        ref={ref as any}
        className={baseClasses}
        whileHover={{ y: -2, boxShadow: "0 8px 20px hsla(220, 53%, 8%, 0.15)" }}
        whileTap={{ y: 0, boxShadow: "0 2px 8px hsla(220, 53%, 8%, 0.12)" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
