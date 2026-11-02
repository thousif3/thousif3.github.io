"use client";

import { useEffect, useState } from "react";
import { person } from "@/lib/content";

type Stats = { jobs?: number; strong?: number; when?: string; stale?: boolean };

/** Live numbers from TALON's public stats feed (exported by the TALON server to GitHub Pages). */
export default function LiveStats({ compact = false }: { compact?: boolean }) {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${person.statsFeed}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!alive) return;
        const when: string | undefined = d.generatedAtET ?? d.generatedAt;
        const ts = when ? Date.parse(when) : NaN;
        setS({
          jobs: d.pipeline?.jobsScanned,
          strong: d.pipeline?.score7plus,
          when,
          stale: Number.isFinite(ts) ? Date.now() - ts > 36 * 3600_000 : undefined,
        });
      })
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");

  return (
    <div className={`live ${compact ? "live--compact" : ""}`} aria-live="polite">
      <div className="live-hd">
        <span>TALON feed</span>
        {err ? (
          <span className="live-off">offline</span>
        ) : s?.stale ? (
          <span className="live-off">archived</span>
        ) : (
          <span className="live-on"><i aria-hidden="true" />live</span>
        )}
      </div>
      <div className="live-grid">
        <div><b>{fmt(s?.jobs)}</b><small>jobs scanned</small></div>
        <div><b>{fmt(s?.strong)}</b><small>scored 7+</small></div>
      </div>
      {s?.when && <p className="live-when">updated {s.when}</p>}
    </div>
  );
}
