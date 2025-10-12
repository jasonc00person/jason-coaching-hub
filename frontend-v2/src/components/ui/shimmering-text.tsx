"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ShimmeringTextProps {
  text: string;
  duration?: number;
  delay?: number;
  repeat?: boolean;
  repeatDelay?: number;
  className?: string;
  startOnView?: boolean;
  once?: boolean;
  inViewMargin?: string;
  spread?: number;
  color?: string;
  shimmerColor?: string;
}

export const ShimmeringText = ({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color,
  shimmerColor,
}: ShimmeringTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once,
    margin: inViewMargin,
  });

  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!startOnView || inView) {
      const timeout = setTimeout(() => {
        setKey((prev) => prev + 1);
      }, delay * 1000);

      return () => clearTimeout(timeout);
    }
  }, [delay, inView, startOnView]);

  const shouldAnimate = startOnView ? inView : true;

  const shimmerWidth = useMemo(() => {
    const baseWidth = text.length * 10;
    return Math.max(100, baseWidth * spread);
  }, [text.length, spread]);

  const style = {
    "--shimmer-width": `${shimmerWidth}%`,
    ...(color && { "--text-color": color }),
    ...(shimmerColor && { "--shimmer-color": shimmerColor }),
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      className={cn(
        "inline-block bg-gradient-to-r from-[var(--text-color,rgb(156,163,175))] via-[var(--shimmer-color,rgb(209,213,219))] to-[var(--text-color,rgb(156,163,175))] bg-clip-text text-transparent dark:from-[var(--text-color,rgb(156,163,175))] dark:via-[var(--shimmer-color,rgb(229,231,235))] dark:to-[var(--text-color,rgb(156,163,175))]",
        className
      )}
      style={style}
    >
      {shouldAnimate ? (
        <motion.span
          key={key}
          className="inline-block"
          initial={{ backgroundPosition: "0% 50%" }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration,
            ease: "linear",
            repeat: repeat ? Infinity : 0,
            repeatDelay,
          }}
          style={{
            backgroundImage: `linear-gradient(90deg, var(--text-color, rgb(156, 163, 175)) 0%, var(--shimmer-color, rgb(209, 213, 219)) 50%, var(--text-color, rgb(156, 163, 175)) 100%)`,
            backgroundSize: `var(--shimmer-width) 100%`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
          }}
        >
          {text}
        </motion.span>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
};

