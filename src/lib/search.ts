/**
 * In-browser semantic search over the same vectors that place the points.
 *  - minilm: embeds the query with Transformers.js (same MiniLM weights as the pipeline)
 *  - tfidf:  re-runs the pipeline's TF-IDF + SVD math from shipped parameters
 */
import type { Latent, TfidfParams } from "./latent";

export type Hit = { id: string; score: number };

type Extractor = (text: string, opts: { pooling: "mean"; normalize: boolean }) => Promise<{ data: Float32Array }>;
let extractor: Promise<Extractor> | null = null;

function normalize(v: Float32Array): Float32Array {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

function embedTfidf(text: string, p: TfidfParams): Float32Array {
  const counts = new Map<number, number>();
  const re = new RegExp(p.tokenPattern, "gu");
  for (const m of text.toLowerCase().matchAll(re)) {
    const idx = p.vocab[m[0]];
    if (idx !== undefined) counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }
  // sublinear tf * idf, then l2 (matches sklearn TfidfVectorizer settings in embed.py)
  const sparse: [number, number][] = [];
  let norm = 0;
  for (const [idx, c] of counts) {
    const w = (1 + Math.log(c)) * p.idf[idx];
    sparse.push([idx, w]);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  const k = p.components.length;
  const out = new Float32Array(k);
  for (let j = 0; j < k; j++) {
    const row = p.components[j];
    let s = 0;
    for (const [idx, w] of sparse) s += (w / norm) * row[idx];
    out[j] = s;
  }
  return normalize(out);
}

async function embedMinilm(text: string, model: string): Promise<Float32Array> {
  if (!extractor) {
    extractor = import("@huggingface/transformers").then(async (tf) => {
      const pipe = await tf.pipeline("feature-extraction", model, { dtype: "q8" });
      return pipe as unknown as Extractor;
    });
  }
  const run = await extractor;
  const res = await run(text, { pooling: "mean", normalize: true });
  return new Float32Array(res.data);
}

export const canDeep = (latent: Latent | null) => latent?.model === "minilm";

export async function search(query: string, latent: Latent, k = 3, deep = false): Promise<Hit[]> {
  const q = query.trim();
  if (!q) return [];
  const useDeep = deep && canDeep(latent);
  const qv = useDeep
    ? await embedMinilm(q, latent.browserModel ?? "onnx-community/all-MiniLM-L6-v2-ONNX")
    : embedTfidf(q, latent.tfidf as TfidfParams);
  let any = false;
  for (let i = 0; i < qv.length; i++) if (qv[i] !== 0) any = true;
  if (!any) return [];
  return latent.items
    .map((it) => {
      let s = 0;
      const v = useDeep ? it.vec : (it.lite ?? it.vec);
      for (let i = 0; i < qv.length; i++) s += qv[i] * v[i];
      return { id: it.id, score: s };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export const modelNote = (latent: Latent | null, deep: boolean) =>
  !latent
    ? "Loading the space…"
    : deep && canDeep(latent)
      ? "Deep search: your query is embedded in this browser with MiniLM, the model that placed the points (about 50 MB, downloaded once)."
      : "Your query is embedded in this browser with the site's TF-IDF + SVD model (instant, no download).";
