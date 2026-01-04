import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { content } from "@/data/content";
import { SectionBlock } from "@/components/SectionBlock";
import { SectionTitle } from "@/components/SectionTitle";
import { Timeline } from "@/components/Timeline";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeInUp, staggerContainer } from "@/lib/motionPresets";

export function ImpactSection() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionBlock variant="surface" id="impact">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial={reducedMotion ? {} : "hidden"}
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Section Title with typewriter */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <SectionTitle lead="How Your Story" typed="Helps" />
        </motion.div>

        {/* Timeline */}
        <div className="max-w-md mx-auto md:max-w-lg">
          <Timeline steps={content.impact.steps} />
        </div>
      </motion.div>
    </SectionBlock>
  );
}
