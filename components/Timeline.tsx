import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TimelineStep {
  title: string;
  description: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative">
      {/* Vertical line - desktop only */}
      <div className="hidden md:block absolute left-6 top-4 bottom-4 w-px bg-border" />
      
      <div className="space-y-8 md:space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={reducedMotion ? {} : { opacity: 0, x: -12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.15,
              ease: "easeOut"
            }}
            className="relative flex gap-5 md:gap-6"
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0">
              <motion.div
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
                initial={reducedMotion ? {} : { scale: 0.8 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.15 + 0.1,
                  ease: "easeOut"
                }}
              >
                <span className="text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </motion.div>
            </div>
            
            {/* Content */}
            <div className="pt-2.5 pb-2">
              <h3 className="font-display text-lg font-semibold text-primary-deep mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
