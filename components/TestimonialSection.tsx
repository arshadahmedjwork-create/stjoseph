import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SectionBlock } from "@/components/SectionBlock";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeInUp } from "@/lib/motionPresets";

const testimonial = {
  quote: "St. Joseph's shaped not just my career, but my character. The values I learned here have guided me through every challenge and triumph in life.",
  author: "Distinguished Alumni",
  batch: "Class of 1985",
};

export function TestimonialSection() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <SectionBlock variant="white">
      <motion.div
        ref={ref}
        initial={reducedMotion ? {} : "hidden"}
        animate={isInView ? "visible" : "hidden"}
        className="max-w-xl mx-auto text-center"
      >
        {/* Quote mark */}
        <motion.div variants={fadeInUp}>
          <span className="text-5xl text-primary/40 font-serif leading-none">"</span>
        </motion.div>

        {/* Quote Text */}
        <motion.blockquote
          variants={fadeInUp}
          className="font-display text-lg lg:text-xl text-primary-deep leading-relaxed -mt-4"
        >
          {testimonial.quote}
        </motion.blockquote>

        {/* Author */}
        <motion.div variants={fadeInUp} className="mt-8">
          <div className="w-10 h-px bg-border mx-auto mb-4" />
          <p className="font-medium text-primary-deep text-sm">{testimonial.author}</p>
          <p className="text-caption text-text-secondary mt-0.5">{testimonial.batch}</p>
        </motion.div>
      </motion.div>
    </SectionBlock>
  );
}
