"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function scrollToTarget(target: string | number | HTMLElement) {
  if (lenis) lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -72, duration: 1.4 });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: "smooth" });
  }
}

/** Lenis smooth scroll driven by GSAP's ticker, plus two-way reveal animations. */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("has-gsap");
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // in-page anchors go through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.querySelector(url.hash);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el as HTMLElement);
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    // reveal: plays forward on the way down and reverses on the way back up
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(".reveal", {
        start: "top 88%",
        end: "bottom 8%",
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.06, duration: 0.7, ease: "power3.out" }),
        onLeaveBack: (els) => gsap.to(els, { opacity: 0, y: 24, filter: "blur(6px)", stagger: 0.03, duration: 0.4 }),
      });
      gsap.utils.toArray<HTMLElement>(".draw-line").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 55%", scrub: true } });
      });
    });

    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => scrollToTarget(el as HTMLElement), 300);
    }

    return () => {
      ctx.revert();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
