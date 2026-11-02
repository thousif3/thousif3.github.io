import Link from "next/link";
import { domainById, featured, pad2, type Item } from "@/lib/content";
import LiveStats from "./LiveStats";

export default function ProjectCard({ item, showStats = true }: { item: Item; showStats?: boolean }) {
  const d = domainById[item.domain];
  return (
    <article className="pcard" style={{ ["--accent" as string]: d?.color }}>
      <p className="pcard-num">
        {pad2(item.featured ?? 0)} / {pad2(featured.length)} · {d?.label}
      </p>
      <h3 className="pcard-title">{item.title}</h3>
      {item.subtitle && <p className="pcard-sub">{item.subtitle}</p>}
      <p className="pcard-meta">
        {item.status && <span className="chip">{item.status}</span>}
        {item.date && <span>{item.date}</span>}
      </p>
      <p className="pcard-sum">{item.summary}</p>
      {item.liveStats && showStats && <LiveStats compact />}
      {item.stack && item.stack.length > 0 && (
        <ul className="tags" aria-label="Built with">
          {item.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <p className="pcard-links">
        <Link href={`/work/${item.id}/`} className="btn-p">Case study →</Link>
        {item.links?.slice(0, 1).map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener" className="btn-s">
            {l.label} ↗
          </a>
        ))}
      </p>
    </article>
  );
}
