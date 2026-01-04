import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motionPresets";

interface PillarCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function PillarCard({ title, description, icon }: PillarCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-surface rounded-xl p-6 border border-border transition-shadow duration-200 hover:shadow-md"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mb-4">
        {icon}
      </div>
      
      {/* Content */}
      <h3 className="font-display text-lg font-semibold text-primary-deep mb-2 relative inline-block">
        {title}
        {/* Animated underline */}
        <span className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-300 ease-out" />
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
