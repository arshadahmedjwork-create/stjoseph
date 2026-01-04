import type { Variants, Transition } from "framer-motion";

// Standard transitions
export const transitions = {
  fade: { duration: 0.3, ease: "easeOut" } as Transition,
  fadeUp: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as Transition,
  smooth: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition,
  hoverLift: { duration: 0.15, ease: "easeOut" } as Transition,
  lineDraw: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition,
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
};

// Animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.fadeUp
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.fadeUp
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.fadeUp
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: transitions.fade
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.smooth
  }
};

export const lineDrawVariant: Variants = {
  hidden: { width: "0%" },
  visible: { 
    width: "100%",
    transition: transitions.lineDraw
  }
};

export const lineGrow: Variants = {
  hidden: { scaleY: 0, originY: 0 },
  visible: { 
    scaleY: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

// Card hover animation presets
export const cardHover = {
  rest: { 
    y: 0, 
    boxShadow: "0 4px 12px hsla(220, 53%, 8%, 0.08)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: { 
    y: -4, 
    boxShadow: "0 16px 32px hsla(220, 53%, 8%, 0.12)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Button hover animation presets
export const buttonHover = {
  rest: { y: 0, boxShadow: "0 4px 12px hsla(220, 53%, 8%, 0.1)" },
  hover: { y: -2, boxShadow: "0 8px 20px hsla(220, 53%, 8%, 0.15)" },
  tap: { y: 0, boxShadow: "0 2px 8px hsla(220, 53%, 8%, 0.12)" }
};

// Timeline dot animation
export const timelineDot: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1],
      delay: 0.1
    }
  }
};

// Timeline line grow animation
export const timelineLineGrow: Variants = {
  hidden: { height: 0 },
  visible: { 
    height: "100%",
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1],
      delay: 0.3
    }
  }
};

// Number counter animation helper
export const counterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Floating animation for decorative elements
export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-4, 4, -4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Pulse glow for accent elements
export const pulseGlow: Variants = {
  initial: { boxShadow: "0 0 0 0 hsla(43, 74%, 52%, 0.4)" },
  animate: {
    boxShadow: [
      "0 0 0 0 hsla(43, 74%, 52%, 0.4)",
      "0 0 0 8px hsla(43, 74%, 52%, 0)",
      "0 0 0 0 hsla(43, 74%, 52%, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
