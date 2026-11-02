import type { Metadata } from "next";
import PrintButton from "@/components/PrintButton";
import { awards, certs, education, featured, person, roles, skills } from "@/lib/content";

export const metadata: Metadata = { title: "Résumé", description: `${person.name}: résumé.` };

export default function Resume() {
  const skillLine = skills.map((s) => s.title).join(" · ");
  return (
    <article className="resume">
      <div className="resume-actions no-print">
        {person.resumePdf ? (
          <a className="btn-p" href={person.resumePdf} target="_blank" rel="noopener">Download PDF ↓</a>
        ) : null}
        <PrintButton />
      </div>
      <header>
        <h1>{person.name}</h1>
        <p>
          {person.city} · <a href={`mailto:${person.email}`}>{person.email}</a> · {person.phone} ·{" "}
          <a href={person.linkedin}>LinkedIn</a> · <a href={person.github}>GitHub</a>
        </p>
        <p>CSM · CSPO · {person.workAuth}</p>
      </header>

      <section>
        <h2>Projects</h2>
        {featured.map((p) => (
          <div key={p.id} className="r-item">
            <h3>
              {p.title} <span>· {p.subtitle}</span>
            </h3>
            <p>{p.summary}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Experience</h2>
        {roles.map((r) => (
          <div key={r.id} className="r-item">
            <h3>
              {r.title} <span>· {r.org} · {r.date}</span>
            </h3>
            {r.bullets && r.bullets.length > 0 ? (
              <ul>
                {r.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {education.map((e) => (
          <div key={e.id} className="r-item">
            <h3>
              {e.title} <span>· {e.org}{e.date ? ` · ${e.date}` : ""}</span>
            </h3>
          </div>
        ))}
      </section>

      <section>
        <h2>Certifications & awards</h2>
        <ul>
          {[...certs, ...awards].map((a) => (
            <li key={a.id}>
              {a.title}, {a.org}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <p>{skillLine}</p>
      </section>
    </article>
  );
}
