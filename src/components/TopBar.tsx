"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { person } from "@/lib/content";

function useClock(timeZone: string) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

export default function TopBar() {
  const now = useClock(person.timeZone);
  return (
    <header className="topbar" aria-label="Site">
      <Link href="/" className="brand">
        <span className="pulse-dot" aria-hidden="true" />
        {person.brand}
      </Link>
      <dl className="meta">
        <div>
          <dt>Currently</dt>
          <dd>{person.degree} · {person.gradTerm}</dd>
        </div>
        <div>
          <dt>Based in</dt>
          <dd>
            {person.city.split(",")[0]} <span className="tabular-nums">{now ? `(${now})` : ""}</span>
          </dd>
        </div>
      </dl>
      <nav aria-label="Primary" className="links">
        <Link href="/#work">Work</Link>
        <Link href="/#experience">Experience</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/resume/" className="resume-btn">Résumé ↗</Link>
      </nav>
    </header>
  );
}
