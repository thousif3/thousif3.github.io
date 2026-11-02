import raw from "@/content/content.json";

export type Link = { label: string; href: string };
export type Domain = { id: string; label: string; color: string };
export type ItemKind = "project" | "role" | "education" | "cert" | "award" | "skill";

export type Item = {
  id: string;
  kind: ItemKind;
  domain: string;
  title: string;
  subtitle?: string;
  org?: string;
  date?: string;
  status?: string;
  summary: string;
  bullets?: string[];
  stack?: string[];
  links?: Link[];
  featured?: number;
  liveStats?: boolean;
};

export type Person = {
  name: string;
  short: string;
  brand: string;
  headline: string;
  roles: string[];
  degree: string;
  gradTerm: string;
  gpa: string;
  city: string;
  timeZone: string;
  workAuth: string;
  openTo: string;
  email: string;
  phone: string;
  phoneHref: string;
  linkedin: string;
  github: string;
  resumePdf: string | null;
  statsFeed: string;
};

type Content = { person: Person; domains: Domain[]; items: Item[] };

const content = raw as unknown as Content;

export const person = content.person;
export const domains = content.domains;
export const items = content.items;

export const domainById = Object.fromEntries(domains.map((d) => [d.id, d])) as Record<string, Domain>;
export const itemById = Object.fromEntries(items.map((i) => [i.id, i])) as Record<string, Item>;

export const featured = items
  .filter((i) => typeof i.featured === "number")
  .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));

export const projects = items.filter((i) => i.kind === "project");
export const roles = items.filter((i) => i.kind === "role");
export const education = items.filter((i) => i.kind === "education");
export const certs = items.filter((i) => i.kind === "cert");
export const awards = items.filter((i) => i.kind === "award");
export const skills = items.filter((i) => i.kind === "skill");

export const kindLabel: Record<ItemKind, string> = {
  project: "Project",
  role: "Role",
  education: "Education",
  cert: "Certification",
  award: "Award",
  skill: "Skill",
};

export const pad2 = (n: number) => String(n).padStart(2, "0");
