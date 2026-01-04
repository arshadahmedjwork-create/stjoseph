import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { staggerContainer, fadeInUp } from "@/lib/motionPresets";

const stats = [
  { value: 60, suffix: "+", label: "Years of Excellence" },
  { value: 50000, suffix: "+", label: "Alumni Worldwide" },
  { value: 100, suffix: "+", label: "Countries Represented" },
];

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function StatItem({ value, suffix, label, delay }: StatItemProps) {
  const { count, ref } = useCountUp(value, { delay, duration: 2000 });
  
  return (
    <motion.div 
      variants={fadeInUp}
      className="text-center py-8 md:py-10"
    >
      <p 
        ref={ref as React.RefObject<HTMLParagraphElement>}
        className="font-display text-4xl lg:text-5xl font-bold text-primary-deep tracking-tight"
      >
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-3 text-small text-text-secondary tracking-wide uppercase">{label}</p>
    </motion.div>
  );
}

export function StatsSection() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 lg:py-16 bg-surface-soft border-y border-border">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial={reducedMotion ? {} : "hidden"}
        animate={isInView ? "visible" : "hidden"}
        className="container"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 150}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
