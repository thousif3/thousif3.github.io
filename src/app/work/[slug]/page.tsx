import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LiveStats from "@/components/LiveStats";
import { domainById, itemById, projects } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = itemById[slug];
  return p ? { title: `${p.title}: ${p.subtitle ?? "Case study"}`, description: p.summary } : {};
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = itemById[slug];
  if (!p || p.kind !== "project") notFound();
  const d = domainById[p.domain];
  const idx = projects.findIndex((x) => x.id === p.id);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article className="case" style={{ ["--accent" as string]: d?.color }}>
      <p className="eyebrow">
        <Link href="/">← Back to the space</Link> · {d?.label}
      </p>
      <h1 className="case-title">{p.title}</h1>
      {p.subtitle && <p className="case-sub">{p.subtitle}</p>}
      <dl className="case-facts">
        {p.status && (
          <div>
            <dt>Status</dt>
            <dd>{p.status}</dd>
          </div>
        )}
        {p.date && (
          <div>
            <dt>When</dt>
            <dd>{p.date}</dd>
          </div>
        )}
        {p.stack && p.stack.length > 0 && (
          <div>
            <dt>Built with</dt>
            <dd>{p.stack.join(" · ")}</dd>
          </div>
        )}
      </dl>
      <p className="case-lead">{p.summary}</p>
      {p.liveStats && <LiveStats />}
      {p.bullets && p.bullets.length > 0 && (
        <section>
          <h2>What I built</h2>
          <ul className="case-bullets">
            {p.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}
      {p.links && p.links.length > 0 && (
        <p className="case-links">
          {p.links.map((l) => (
            <a key={l.href} className="btn-s" href={l.href} target="_blank" rel="noopener">
              {l.label} ↗
            </a>
          ))}
        </p>
      )}
      <p className="case-next">
        Next: <Link href={`/work/${next.id}/`}>{next.title} →</Link>
      </p>
    </article>
  );
}
