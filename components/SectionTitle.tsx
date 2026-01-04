import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SectionTitleProps {
  lead: string;
  typed: string;
  tail?: string;
  as?: "h1" | "h2" | "h3";
  once?: boolean;
  className?: string;
}

export function SectionTitle({
  lead,
  typed,
  tail = "",
  as: Tag = "h2",
  once = true,
  className = "",
}: SectionTitleProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const hasAnimated = useRef(false);

  // Intersection observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated.current)) {
          setIsInView(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.3, rootMargin: "-50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

  // Typewriter effect
  useEffect(() => {
    if (!isInView || reducedMotion) {
      if (reducedMotion) {
        setDisplayText(typed);
        setIsComplete(true);
        setShowCursor(false);
      }
      return;
    }

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    const speed = 35;
    const startDelay = 100;

    const typeNextChar = () => {
      if (currentIndex < typed.length) {
        setDisplayText(typed.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        setTimeout(() => setShowCursor(false), 800);
      }
    };

    timeoutId = setTimeout(typeNextChar, startDelay);

    return () => clearTimeout(timeoutId);
  }, [isInView, typed, reducedMotion]);

  const fullTitle = `${lead} ${typed}${tail ? ` ${tail}` : ""}`;

  return (
    <div ref={ref} className={className}>
      {/* Screen reader accessible full title */}
      <span className="sr-only">{fullTitle}</span>
      
      <Tag 
        className="font-display text-section-mobile md:text-section text-primary-deep"
        aria-hidden="true"
      >
        {lead}{" "}
        <span className="relative inline-block">
          <span className="relative">
            {displayText}
            {showCursor && isInView && !reducedMotion && (
              <motion.span
                className="inline-block w-0.5 h-[0.9em] bg-primary-deep ml-0.5 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </span>
          {/* Underline accent */}
          <motion.span
            className="absolute -bottom-1 left-0 h-[3px] bg-primary/30 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isComplete ? "100%" : 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          />
        </span>
        {tail && ` ${tail}`}
      </Tag>
    </div>
  );
}
