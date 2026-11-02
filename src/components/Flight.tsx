"use client";

import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { domainById, domains, featured, itemById, items, pad2, person } from "@/lib/content";
import { loadLatent, type Latent } from "@/lib/latent";
import { clamp01, flight, near, smooth } from "@/lib/store";
import Inspector from "./Inspector";
import Lab from "./Lab";
import ProjectCard from "./ProjectCard";
import { scrollToTarget } from "./SmoothScroll";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** hero, disperse, one per featured project, lab */
const STOPS = featured.length + 3;
const FIRST = 2;
const LAB = STOPS - 1;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

const counts = domains.map((d) => ({ ...d, n: items.filter((i) => i.domain === d.id).length }));

export default function Flight() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [latent, setLatent] = useState<Latent | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const disperse = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLParagraphElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
    loadLatent().then(setLatent).catch((e) => console.error(e));
  }, []);

  const onReady = useCallback(() => setSceneReady(true), []);

  // scroll -> flight position
  useEffect(() => {
    if (!webgl) return;
    gsap.registerPlugin(ScrollTrigger);
    flight.stops = STOPS;
    const a = ScrollTrigger.create({
      trigger: "#flight",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        flight.s = self.progress * (STOPS - 1);
      },
    });
    const b = ScrollTrigger.create({
      trigger: "#after-flight",
      start: "top bottom",
      end: "top 25%",
      onUpdate: (self) => {
        flight.after = self.progress;
      },
    });
    return () => {
      a.kill();
      b.kill();
    };
  }, [webgl]);

  // per-frame DOM overlay: fades, leader line, hover tag, HUD
  useEffect(() => {
    if (!webgl) return;
    let raf = 0;
    const posOf = (id: string) => latent?.items.find((i) => i.id === id)?.pos;
    const show = (el: HTMLElement | null, o: number, dy = 0) => {
      if (!el) return;
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${dy}px, 0)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };
    const loop = () => {
      const s = flight.s;
      const h = 1 - smooth(clamp01(s / 0.55));
      show(hero.current, h, -40 * (1 - h));
      show(hint.current, h);
      const dsp = near(s, 1, 0.6);
      show(disperse.current, dsp, 20 * (1 - dsp));
      let best = -1;
      let bestW = 0;
      featured.forEach((_, k) => {
        const w = smooth(near(s, FIRST + k, 0.5));
        show(cards.current[k], w, 30 * (1 - w));
        if (w > bestW) {
          bestW = w;
          best = k;
        }
      });
      const l = smooth(clamp01((s - (LAB - 0.55)) / 0.45));
      show(lab.current, l, 30 * (1 - l));

      // leader line from the active card to its point
      const ln = line.current;
      const dt = dot.current;
      if (ln && dt) {
        const card = best >= 0 ? cards.current[best] : null;
        const p = best >= 0 ? posOf(featured[best].id) : undefined;
        const pr = p && flight.project ? flight.project(p) : null;
        if (card && pr && pr.visible && bestW > 0.05 && window.innerWidth > 900) {
          const r = card.getBoundingClientRect();
          const ax = r.left - 12;
          const ay = r.top + 46;
          ln.setAttribute("x1", String(ax));
          ln.setAttribute("y1", String(ay));
          ln.setAttribute("x2", String(pr.x));
          ln.setAttribute("y2", String(pr.y));
          dt.setAttribute("cx", String(pr.x));
          dt.setAttribute("cy", String(pr.y));
          ln.style.opacity = String(bestW * 0.9);
          dt.style.opacity = String(bestW);
          ln.style.stroke = domainById[featured[best].domain]?.color ?? "#22d3ee";
          dt.style.stroke = ln.style.stroke;
        } else {
          ln.style.opacity = "0";
          dt.style.opacity = "0";
        }
      }

      // hover tag
      const tg = tag.current;
      if (tg) {
        const it = flight.hover ? itemById[flight.hover] : null;
        if (it) {
          tg.textContent = it.title;
          tg.style.opacity = "1";
          tg.style.transform = `translate3d(${flight.pointer.x + 16}px, ${flight.pointer.y - 30}px, 0)`;
          tg.style.borderColor = domainById[it.domain]?.color ?? "";
        } else tg.style.opacity = "0";
      }

      // HUD
      if (hud.current) {
        const k = Math.round(s);
        const label =
          k === 0 ? "Name" : k === 1 ? "The space" : k === LAB ? "Live lab" : featured[k - FIRST]?.title ?? "";
        hud.current.textContent = `${pad2(k + 1)} / ${pad2(STOPS)} · ${label}`;
      }

      if (stage.current) stage.current.style.opacity = String(1 - 0.78 * flight.after);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [webgl, latent]);

  const toLab = () => {
    const el = document.getElementById("flight");
    if (el) scrollToTarget(el.offsetTop + el.offsetHeight - window.innerHeight);
  };

  const heroCopy = (
    <>
      <p className="eyebrow hero-eyebrow">
        {person.name} · {person.roles.join(" · ")}
      </p>
      <h1 className="hero-h1">
        <span className="sr-only">{person.name}: </span>
        {person.headline}
      </h1>
      <p className="hero-sub">
        {person.degree}, graduating {person.gradTerm}. {person.openTo}
      </p>
    </>
  );

  if (webgl === false) {
    return (
      <>
        <section className="static-hero" aria-label="Introduction">
          <p className="static-name" aria-hidden="true">THOUSIF</p>
          {heroCopy}
        </section>
        <section className="static-work" aria-label="Featured work">
          <div className="static-grid">
            {featured.map((f) => (
              <ProjectCard key={f.id} item={f} />
            ))}
          </div>
          <div className="static-lab"><Lab latent={latent} mode="static" /></div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="stage" ref={stage} aria-hidden="true">
        {webgl && latent && <Scene latent={latent} onReady={onReady} />}
        <div className="stage-veil" />
      </div>
      <div className={`loader ${sceneReady ? "loader--done" : ""}`} aria-hidden="true">
        <span>Embedding {items.length} points…</span>
      </div>

      <section id="flight" style={{ height: `${STOPS * 100}vh` }} aria-label="Fly through the work">
        <div className="flight-sticky">
          <div className="ov ov-hero" ref={hero}>
            {heroCopy}
          </div>
          <div className="ov ov-hint" ref={hint}>
            <span>Scroll to fly through the work ↓</span>
            <button type="button" className="btn-s" onClick={toLab}>Skip to the lab</button>
            <button type="button" className="btn-s" onClick={() => scrollToTarget("#after-flight")}>Skip the flight</button>
          </div>

          <div className="ov ov-disperse" ref={disperse}>
            <p className="eyebrow">The space</p>
            <h2 className="disp-title">
              {items.length} points. One for every project, role, award, certification and skill,
              <em> placed by meaning, not by hand.</em>
            </h2>
            <ul className="legend">
              {counts.map((d) => (
                <li key={d.id} style={{ ["--accent" as string]: d.color }}>
                  <i aria-hidden="true" />
                  {d.label} <span>{d.n}</span>
                </li>
              ))}
            </ul>
            <p className="disp-note">Bright points are data; faint dust is decoration. Hover a point to name it, click to open it.</p>
          </div>

          {featured.map((f, k) => (
            <div
              key={f.id}
              className="ov ov-card"
              ref={(el) => {
                cards.current[k] = el;
              }}
            >
              <ProjectCard item={f} />
            </div>
          ))}

          <div className="ov ov-lab" ref={lab}>
            <Lab latent={latent} mode="scene" />
          </div>

          <svg className="leader" aria-hidden="true">
            <line ref={line} x1="0" y1="0" x2="0" y2="0" />
            <circle ref={dot} r="14" cx="0" cy="0" />
          </svg>
          <p className="hud" ref={hud} aria-hidden="true" />
        </div>
      </section>
      <div className="hover-tag" ref={tag} aria-hidden="true" />
      <Inspector latent={latent} />
    </>
  );
}
