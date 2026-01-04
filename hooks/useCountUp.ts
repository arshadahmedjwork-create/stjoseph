import { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  startOnView?: boolean;
}

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
): { count: number; ref: React.RefObject<HTMLElement> } {
  const { duration = 2000, delay = 0 } = options;
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            setTimeout(() => {
              const startTime = performance.now();
              
              const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out-cubic)
                const eased = 1 - Math.pow(1 - progress, 3);
                
                setCount(Math.floor(eased * end));
                
                if (progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  setCount(end);
                }
              };
              
              requestAnimationFrame(animate);
            }, delay);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, delay, reducedMotion]);

  return { count, ref };
}
