"use client";

import { useEffect } from "react";

/**
 * The original dot + ring cursor, unchanged in look and feel (hard rule).
 * Only change: hover growth uses event delegation so links rendered later
 * (cards, search results) get the same behavior.
 */
export default function Cursor() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;
    document.documentElement.classList.add("use-custom-cursor");
    const cur = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    if (!cur || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + "px"; cur.style.top = my + "px";
    };
    const ar = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      raf = requestAnimationFrame(ar);
    };
    const over = (e: MouseEvent) => {
      const hit = (e.target as Element | null)?.closest?.("a,button");
      if (hit) {
        cur.style.width = "14px"; cur.style.height = "14px";
        ring.style.width = "48px"; ring.style.height = "48px";
      } else {
        cur.style.width = "8px"; cur.style.height = "8px";
        ring.style.width = "32px"; ring.style.height = "32px";
      }
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    ar();
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("use-custom-cursor");
    };
  }, []);

  return (
    <>
      <div className="cursor" id="cursor" aria-hidden="true" />
      <div className="cursor-ring" id="cursorRing" aria-hidden="true" />
    </>
  );
}
