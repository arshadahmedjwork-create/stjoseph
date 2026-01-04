import { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface UseTypewriterOptions {
  speed?: number;
  delay?: number;
}

interface UseTypewriterReturn {
  displayText: string;
  isComplete: boolean;
  showCursor: boolean;
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 45, delay = 300 } = options;
  const reducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    // If reduced motion, show full text immediately
    if (reducedMotion) {
      setDisplayText(text);
      setIsComplete(true);
      setShowCursor(false);
      return;
    }

    // Only run once
    if (hasRun.current) return;
    hasRun.current = true;

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutId = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
          // Hide cursor after completion
          setTimeout(() => setShowCursor(false), 1500);
        }
      };

      typeNextChar();
    };

    // Initial delay before starting
    timeoutId = setTimeout(startTyping, delay);

    return () => clearTimeout(timeoutId);
  }, [text, speed, delay, reducedMotion]);

  return { displayText, isComplete, showCursor };
}
