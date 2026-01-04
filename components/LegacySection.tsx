import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Heart, Users } from "lucide-react";
import { content } from "@/data/content";
import { SectionBlock } from "@/components/SectionBlock";
import { SectionTitle } from "@/components/SectionTitle";
import { PillarCard } from "@/components/PillarCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { staggerContainer } from "@/lib/motionPresets";

const icons = [
  <BookOpen className="w-5 h-5 text-primary" />,
  <Heart className="w-5 h-5 text-primary" />,
  <Users className="w-5 h-5 text-primary" />,
];

export function LegacySection() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <SectionBlock variant="white" id="legacy">
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial={reducedMotion ? {} : "hidden"}
        animate={isInView ? "visible" : "hidden"}
        className="text-center"
      >
        {/* Section Title with typewriter */}
        <div className="max-w-lg mx-auto mb-6">
          <SectionTitle lead="A Legacy of" typed="Excellence" />
        </div>
        
        {/* Intro text */}
        <p className="text-text-secondary max-w-md mx-auto mb-12">
          {content.legacy.intro}
        </p>

        {/* Pillar Cards Grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {content.legacy.pillars.map((pillar, index) => (
            <PillarCard
              key={pillar.title}
              title={pillar.title}
              description={pillar.description}
              icon={icons[index]}
            />
          ))}
        </motion.div>
      </motion.div>
    </SectionBlock>
  );
}
