import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { content } from "@/data/content";
import { SectionTitle } from "@/components/SectionTitle";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeInUp, staggerContainer } from "@/lib/motionPresets";
import { Button } from "@/components/Button";
import campusImage from "@/assets/campus.jpg";

export function CampusBanner() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const ctaRef = useRef(null);
  const isImageInView = useInView(imageRef, { once: true, margin: "-50px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], reducedMotion ? [1, 1] : [1, 1.02]);

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      {/* Background image covering entire section */}
      <div className="absolute inset-0">
        <motion.div style={{ scale }} className="absolute inset-0">
          <img
            src={campusImage}
            alt="St. Joseph's campus"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-deep/30 via-primary-deep/50 to-primary-deep/70" />
      </div>

      {/* Campus Title Section */}
      <div ref={imageRef} className="relative h-72 md:h-80 lg:h-96 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isImageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-white">
            A Campus That <span className="border-b-2 border-white/40 pb-0.5">Lives On</span>
          </h2>
        </motion.div>
        
        <motion.p 
          className="mt-4 text-white/80 max-w-sm text-sm md:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={isImageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {content.campusBanner.overlay}
        </motion.p>
      </div>

      {/* CTA Section with reduced opacity overlay */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary-deep/40" />
        <motion.div
          ref={ctaRef}
          variants={staggerContainer}
          initial={reducedMotion ? {} : "hidden"}
          animate={isCtaInView ? "visible" : "hidden"}
          className="relative max-w-full px-6 lg:px-8 text-center py-16 md:py-20"
        >
          <motion.h3
            variants={fadeInUp}
            className="font-display text-xl md:text-2xl text-white"
          >
            Your Story Matters
          </motion.h3>

          <motion.p
            variants={fadeInUp}
            className="mt-4 text-white/70 max-w-md mx-auto text-sm md:text-base"
          >
            Be part of our 60-year legacy. Share your memories and help us create a tribute that will inspire generations.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8">
            <Link to="/alumni/submit">
              <Button 
                size="lg" 
                className="bg-white text-primary-deep hover:bg-white/95 px-8 rounded-full group"
              >
                {content.campusBanner.ctaLabel}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeInUp} className="mt-5 text-caption text-white/50">
            Join thousands of alumni who have already contributed
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
