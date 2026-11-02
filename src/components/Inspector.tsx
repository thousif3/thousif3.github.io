"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { domainById, itemById, kindLabel } from "@/lib/content";
import type { Latent } from "@/lib/latent";
import { flight } from "@/lib/store";

/** Detail panel for any point the visitor clicks (or the lab flies to). */
export default function Inspector({ latent }: { latent: Latent | null }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const onSel = (e: Event) => setId((e as CustomEvent<string>).detail);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setId(null);
    window.addEventListener("latent:select", onSel);
    window.addEventListener("keydown", onKey);
    // close once the visitor scrolls on into the regular sections
    let raf = 0;
    const watch = () => {
      if (flight.after > 0.35) {
        setId(null);
        flight.focus = null;
      }
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("latent:select", onSel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const it = id ? itemById[id] : null;
  if (!it) return null;
  const d = domainById[it.domain];
  const neighbors = latent?.items.find((x) => x.id === id)?.neighbors ?? [];

  return (
    <aside className="inspector" style={{ ["--accent" as string]: d?.color }} aria-label={`${it.title} details`}>
      <button type="button" className="insp-close" onClick={() => setId(null)} aria-label="Close">×</button>
      <p className="eyebrow">{kindLabel[it.kind]} · {d?.label}</p>
      <h3>{it.title}</h3>
      {(it.org || it.date) && <p className="insp-org">{[it.org, it.date].filter(Boolean).join(" · ")}</p>}
      <p className="insp-sum">{it.summary}</p>
      {it.bullets && it.bullets.length > 0 && (
        <ul className="insp-bullets">
          {it.bullets.slice(0, 3).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {it.kind === "project" && (
        <p><Link className="btn-p" href={`/work/${it.id}/`}>Case study →</Link></p>
      )}
      {neighbors.length > 0 && (
        <>
          <p className="eyebrow insp-nb-hd">Nearest in meaning</p>
          <ul className="insp-nb">
            {neighbors.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => {
                    if (flight.focus) flight.focus = n;
                    setId(n);
                  }}
                >
                  {itemById[n]?.title ?? n}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
