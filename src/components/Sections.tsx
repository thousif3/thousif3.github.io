import Link from "next/link";
import {
  awards,
  certs,
  domainById,
  domains,
  education,
  person,
  projects,
  roles,
  skills,
  type Item,
} from "@/lib/content";
import FooterModel from "./FooterModel";

const NOW = new Set(["building-manager", "parking-ops", "grader", "lsc-secretary"]);

function Role({ it }: { it: Item }) {
  const d = domainById[it.domain];
  return (
    <li className="role reveal" style={{ ["--accent" as string]: d?.color }}>
      <div className="role-hd">
        <h4>{it.title}</h4>
        <p className="role-when">{it.date}</p>
      </div>
      <p className="role-org">{it.org}</p>
      {it.bullets && it.bullets.length > 0 ? (
        <ul className="role-bullets">
          {it.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : (
        <p className="role-sum">{it.summary}</p>
      )}
    </li>
  );
}

function SectionHead({ tag, title, accent }: { tag: string; title: string; accent: string }) {
  return (
    <header className="sec-hd">
      <p className="stag">{tag}</p>
      <h2 className="stitle">
        {title}<em>{accent}</em>
      </h2>
      <span className="draw-line" aria-hidden="true" />
    </header>
  );
}

export default function Sections() {
  const now = roles.filter((r) => NOW.has(r.id));
  const before = roles.filter((r) => !NOW.has(r.id));
  return (
    <div id="after-flight" className="after">
      <section id="work" className="sec">
        <SectionHead tag="Index" title="All " accent="work" />
        <ol className="work-list">
          {projects.map((p, i) => (
            <li key={p.id} className="reveal" style={{ ["--accent" as string]: domainById[p.domain]?.color }}>
              <Link href={`/work/${p.id}/`}>
                <span className="wl-n">{String(i + 1).padStart(3, "0")}</span>
                <span className="wl-t">{p.title}</span>
                <span className="wl-s">{p.subtitle}</span>
                <span className="wl-st">{p.status}</span>
                <span className="wl-a" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="experience" className="sec">
        <SectionHead tag="Work & leadership" title="Experi" accent="ence" />
        <div className="exp-cols">
          <div>
            <p className="exp-col-hd">Now · Indianapolis</p>
            <ul className="roles">{now.map((r) => <Role key={r.id} it={r} />)}</ul>
          </div>
          <div>
            <p className="exp-col-hd">Before · Hyderabad</p>
            <ul className="roles">{before.map((r) => <Role key={r.id} it={r} />)}</ul>
          </div>
        </div>
        <div className="edu">
          {education.map((e) => (
            <div key={e.id} className="edu-card reveal">
              <p className="eyebrow">Education</p>
              <h4>{e.title}</h4>
              <p className="role-org">{e.org}</p>
              {e.date && <p className="role-when">{e.date}</p>}
            </div>
          ))}
        </div>
      </section>

      <section id="recognition" className="sec">
        <SectionHead tag="Recognition" title="Awards & " accent="certifications" />
        <ul className="rec-grid">
          {[...certs, ...awards].map((a) => (
            <li key={a.id} className="rec reveal" style={{ ["--accent" as string]: domainById[a.domain]?.color }}>
              <p className="eyebrow">{a.kind === "cert" ? "Certification" : "Award"}</p>
              <h4>{a.title}</h4>
              <p className="role-org">{a.org}</p>
              <p className="rec-sum">{a.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="toolbox" className="sec">
        <SectionHead tag="Toolbox" title="Skills by " accent="domain" />
        <div className="tool-grid">
          {domains.map((d) => {
            const list = skills.filter((s) => s.domain === d.id);
            if (!list.length) return null;
            return (
              <div key={d.id} className="tool reveal" style={{ ["--accent" as string]: d.color }}>
                <p className="tool-hd">{d.label}</p>
                <ul>
                  {list.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section id="contact" className="sec contact">
        <p className="stag">Let&apos;s talk</p>
        <h2 className="contact-title reveal">
          Building something that has to <em>actually work?</em>
        </h2>
        <p className="contact-sub reveal">
          {person.openTo} {person.workAuth}.
        </p>
        <p className="contact-links reveal">
          <a className="btn-p" href={`mailto:${person.email}`}>✉ {person.email}</a>
          <a className="btn-s" href={person.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
          <a className="btn-s" href={person.github} target="_blank" rel="noopener">GitHub ↗</a>
          <a className="btn-s" href={person.phoneHref}>{person.phone}</a>
          <Link className="btn-s" href="/resume/">Résumé ↗</Link>
        </p>
      </section>

      <footer className="foot">
        <p>© 2026 {person.name} · {person.city}</p>
        <FooterModel />
      </footer>
    </div>
  );
}
