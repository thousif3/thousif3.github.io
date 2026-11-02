"use client";

import Link from "next/link";
import { useState } from "react";
import { domainById, itemById, kindLabel } from "@/lib/content";
import type { Latent } from "@/lib/latent";
import { canDeep, modelNote, search, type Hit } from "@/lib/search";
import { flight } from "@/lib/store";

const SUGGESTIONS = ["multi-agent LLM systems", "security research", "leading a team", "running operations", "web front end"];

export default function Lab({ latent, mode }: { latent: Latent | null; mode: "scene" | "static" }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deep, setDeep] = useState(false);

  const run = async (text: string) => {
    if (!latent || !text.trim()) return;
    setQ(text);
    setBusy(true);
    setErr(null);
    try {
      const h = await search(text, latent, 3, deep);
      setHits(h);
      if (h[0] && mode === "scene") pick(h[0].id, window.innerWidth > 900);
      if (!h.length) setErr("No overlap with anything here yet. Try other words.");
    } catch (e) {
      setErr("The in-browser model couldn't load. Check your connection and try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  // on phones the details panel would cover the results, so a search only flies the camera
  const pick = (id: string, open = true) => {
    flight.focus = id;
    if (open) window.dispatchEvent(new CustomEvent("latent:select", { detail: id }));
  };

  return (
    <div className="lab">
      <p className="eyebrow">Live lab · semantic search</p>
      <h2 className="lab-title">Ask the space</h2>
      <form
        className="lab-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <label htmlFor="lab-q" className="sr-only">Describe what you're looking for</label>
        <input
          id="lab-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. agents that need human approval"
          autoComplete="off"
        />
        <button type="submit" className="btn-p" disabled={busy || !latent}>
          {busy ? (deep ? "Loading model…" : "Embedding…") : "Fly →"}
        </button>
      </form>
      <ul className="lab-chips" aria-label="Try one">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button type="button" onClick={() => run(s)} disabled={busy || !latent}>{s}</button>
          </li>
        ))}
      </ul>
      {err && <p className="lab-err">{err}</p>}
      {hits && hits.length > 0 && (
        <ol className="lab-hits">
          {hits.map((h) => {
            const it = itemById[h.id];
            if (!it) return null;
            const d = domainById[it.domain];
            return (
              <li key={h.id} style={{ ["--accent" as string]: d?.color }}>
                {mode === "scene" ? (
                  <button type="button" onClick={() => pick(h.id)}>
                    <span className="hit-kind">{kindLabel[it.kind]}</span>
                    <span className="hit-title">{it.title}</span>
                    <span className="hit-score">{h.score.toFixed(2)}</span>
                  </button>
                ) : (
                  <Link href={it.kind === "project" ? `/work/${it.id}/` : "#experience"}>
                    <span className="hit-kind">{kindLabel[it.kind]}</span>
                    <span className="hit-title">{it.title}</span>
                    <span className="hit-score">{h.score.toFixed(2)}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {canDeep(latent) && (
        <label className="lab-deep">
          <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} />
          Deep search with MiniLM (downloads about 50 MB once)
        </label>
      )}
      <p className="lab-note">{modelNote(latent, deep)} Scores are cosine similarity.</p>
    </div>
  );
}
