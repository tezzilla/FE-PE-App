"use client";

import type { ReactNode } from "react";

// A card with a soft glow that follows the pointer. Mouse and pen only; touch and keyboard users see a
// normal card. The glow is pure CSS (.spotlight in globals.css), driven by two custom properties.
export default function SpotlightCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`card spotlight ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
