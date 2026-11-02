/** Types + loader for public/latent.json (written by pipeline/embed.py). */

/** vec: vectors of the layout model; lite: TF-IDF vectors when the layout model is MiniLM */
export type LatentItem = { id: string; pos: [number, number, number]; vec: number[]; lite?: number[]; neighbors: string[] };

export type TfidfParams = {
  tokenPattern: string;
  vocab: Record<string, number>;
  idf: number[];
  components: number[][];
};

export type Latent = {
  version: number;
  dim: number;
  radius: number;
  model: "minilm" | "tfidf";
  browserModel?: string;
  tfidf?: TfidfParams;
  items: LatentItem[];
};

let cache: Promise<Latent> | null = null;

export function loadLatent(): Promise<Latent> {
  if (!cache) {
    cache = fetch("/latent.json").then((r) => {
      if (!r.ok) throw new Error(`latent.json ${r.status}`);
      return r.json() as Promise<Latent>;
    });
  }
  return cache;
}
