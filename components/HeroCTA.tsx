import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motionPresets";
import campusImage from "@/assets/campus.jpg";

export function HeroCTA() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-30">
        <img
          src={campusImage}
          alt="St. Joseph's campus"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Blue brand tint overlay */}
      <div className="absolute inset-0 -z-20 bg-[hsl(220,75%,26%)]/60" />

      {/* Subtle gradient fade to anchor content */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Foreground content */}
      <motion.div
        className="mx-auto flex min-h-[72vh] max-w-6xl items-center justify-center px-5 py-16 sm:min-h-[78vh] sm:py-20"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-[640px] text-center">
          {/* Badge */}
          <motion.div
            className="mx-auto mb-4 w-fit"
            variants={fadeInUp}
          >
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white/95 backdrop-blur-sm">
              60th Anniversary
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display text-[32px] font-bold tracking-tight text-white sm:text-[44px] md:text-[56px] leading-[1.15]"
            variants={fadeInUp}
          >
            60 Years of St. Joseph's
            <span className="block">– Share Your Story</span>
          </motion.h1>

          {/* Divider */}
          <motion.div
            className="mx-auto my-5 h-px w-16 bg-white/30"
            variants={fadeInUp}
          />

          {/* Body */}
          <motion.p
            className="mx-auto max-w-prose text-base leading-relaxed text-white/85 sm:text-lg"
            variants={fadeInUp}
          >
            To commemorate our 60th milestone, we are releasing a heritage book to capture the history, memories, and stories of our incredible community. Your contribution is invaluable.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="mt-7 flex justify-center"
            variants={fadeInUp}
          >
            <Link
              to="/alumni/submit"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-[hsl(220,75%,26%)] shadow-lg transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[hsl(220,75%,26%)]"
            >
              Share Your Memory
            </Link>
          </motion.div>

          {/* Microcopy */}



        </div>
      </motion.div>
    </section>
  );
}
