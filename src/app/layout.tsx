import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import TopBar from "@/components/TopBar";
import { person } from "@/lib/content";
import { SITE_URL } from "@/lib/site";


const description = `${person.name}: MS Computer Science at IU Indianapolis (${person.gradTerm}). Builds self-hosted AI systems like TALON and runs them like products. CSM and CSPO certified. ${person.openTo}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${person.name} · AI Systems, Product & Operations`, template: `%s · ${person.name}` },
  description,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${person.name} · AI Systems, Product & Operations`,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${person.name}, portfolio` }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#020408", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  url: SITE_URL,
  email: `mailto:${person.email}`,
  jobTitle: "AI Systems, Product & Program Management, Operations",
  alumniOf: [{ "@type": "CollegeOrUniversity", name: "Chaitanya Bharathi Institute of Technology" }],
  affiliation: { "@type": "CollegeOrUniversity", name: "Indiana University Indianapolis" },
  address: { "@type": "PostalAddress", addressLocality: "Indianapolis", addressRegion: "IN", addressCountry: "US" },
  hasCredential: ["Certified ScrumMaster (CSM)", "Certified Scrum Product Owner (CSPO)"],
  sameAs: [person.linkedin, person.github],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <Cursor />
        <SmoothScroll />
        <TopBar />
        <main id="main">{children}</main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
