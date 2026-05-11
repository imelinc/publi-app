"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface DemoCursorProps {
  children: ReactNode;
  className?: string;
}

export function DemoCursor({ children, className }: DemoCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      });
    };

    const onEnter = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setVisible(true);
    };

    const onLeave = () => {
      cancelAnimationFrame(raf.current);
      setVisible(false);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ cursor: "none" }}>
      {children}
      {visible && (
        <div
          className="pointer-events-none absolute z-50 text-primary"
          style={{ left: pos.x, top: pos.y }}
        >
          <svg
            width="16"
            height="21"
            viewBox="0 0 16 21"
            fill="none"
            className="drop-shadow-sm"
          >
            <path
              d="M1 1V15.5L5.2 11.7L8.2 18.7L10.2 17.7L7.2 10.7L12.2 10.7L1 1Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <span className="absolute left-3.5 top-4 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold leading-none text-white shadow-md">
            usuario
          </span>
        </div>
      )}
    </div>
  );
}
