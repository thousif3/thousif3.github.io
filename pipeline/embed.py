"""Build-time pipeline: content.json -> public/latent.json

Each portfolio item (project, role, award, cert, skill) is embedded by meaning,
folded into 3D with UMAP, and written out for the browser. The browser uses the
same vectors for search, so layout and search share one geometry.

Backends
  minilm  sentence-transformers/all-MiniLM-L6-v2 (384-d). The browser embeds
          queries with the same weights via Transformers.js. Used in CI.
  tfidf   TF-IDF + truncated SVD (LSA). Always built: the browser re-runs the same
          math from parameters shipped in the JSON for instant search with no
          download. When MiniLM is unavailable it also places the points.

Usage
  python3 pipeline/embed.py                 # auto: minilm if available, else tfidf
  python3 pipeline/embed.py --backend minilm
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content" / "content.json"
OUT = ROOT / "public" / "latent.json"
MINILM = "sentence-transformers/all-MiniLM-L6-v2"
BROWSER_MODEL = "onnx-community/all-MiniLM-L6-v2-ONNX"  # same weights, ONNX export (Transformers.js v4 docs)
RADIUS = 9.0
SEED = 7


def item_text(item: dict) -> str:
    """The text that defines an item's meaning."""
    parts = [item.get("title", ""), item.get("subtitle", ""), item.get("org", ""), item.get("summary", "")]
    parts += item.get("bullets", []) or []
    stack = item.get("stack") or []
    if stack:
        parts.append("Built with " + ", ".join(stack) + ".")
    return ". ".join(p.strip().rstrip(".") for p in parts if p and p.strip()) + "."


def l2(x: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(x, axis=1, keepdims=True)
    n[n == 0] = 1.0
    return x / n


def embed_minilm(texts: list[str]) -> tuple[np.ndarray, dict]:
    from sentence_transformers import SentenceTransformer  # heavy import, CI only

    model = SentenceTransformer(MINILM)
    vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(vecs, dtype=np.float32), {"model": "minilm", "browserModel": BROWSER_MODEL}


def embed_tfidf(texts: list[str]) -> tuple[np.ndarray, dict]:
    from sklearn.decomposition import TruncatedSVD
    from sklearn.feature_extraction.text import TfidfVectorizer

    vec = TfidfVectorizer(lowercase=True, stop_words="english", sublinear_tf=True, norm="l2")
    x = vec.fit_transform(texts)
    k = min(24, x.shape[1] - 1, x.shape[0] - 1)
    svd = TruncatedSVD(n_components=k, random_state=SEED)
    z = l2(svd.fit_transform(x))
    vocab = {term: int(i) for term, i in vec.vocabulary_.items()}
    params = {
        "model": "tfidf",
        "tfidf": {
            "tokenPattern": r"\b\w\w+\b",
            "vocab": vocab,
            "idf": [round(float(v), 5) for v in vec.idf_],
            # components: k x V, transform = l2(tfidf) @ components.T
            "components": [[round(float(v), 5) for v in row] for row in svd.components_],
        },
    }
    return z.astype(np.float32), params


def layout_3d(vecs: np.ndarray) -> np.ndarray:
    import umap

    n = len(vecs)
    reducer = umap.UMAP(
        n_components=3,
        n_neighbors=min(10, n - 1),
        min_dist=0.35,
        metric="cosine",
        random_state=SEED,
    )
    pos = reducer.fit_transform(vecs)
    pos = pos - pos.mean(axis=0)
    scale = np.percentile(np.linalg.norm(pos, axis=1), 95) or 1.0
    return pos / scale * RADIUS


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", choices=["auto", "minilm", "tfidf"], default="auto")
    args = ap.parse_args()

    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    items = content["items"]
    texts = [item_text(i) for i in items]

    # TF-IDF is always built: it powers the instant in-browser search (no download).
    lite, lite_meta = embed_tfidf(texts)
    vecs, meta = lite, lite_meta
    has_deep = False
    if args.backend in ("auto", "minilm"):
        try:
            vecs, meta = embed_minilm(texts)
            meta["tfidf"] = lite_meta["tfidf"]
            has_deep = True
        except Exception as exc:  # no torch, no network, no model
            if args.backend == "minilm":
                raise
            print(f"[embed] MiniLM unavailable ({type(exc).__name__}: {exc}); using TF-IDF only", file=sys.stderr)

    pos = layout_3d(vecs)
    sims = vecs @ vecs.T
    np.fill_diagonal(sims, -1)

    out_items = []
    for idx, item in enumerate(items):
        nn = np.argsort(-sims[idx])[:3]
        row = {
            "id": item["id"],
            "pos": [round(float(v), 4) for v in pos[idx]],
            "vec": [round(float(v), 5) for v in vecs[idx]],
            "neighbors": [items[j]["id"] for j in nn],
        }
        if has_deep:
            row["lite"] = [round(float(v), 5) for v in lite[idx]]
        out_items.append(row)

    payload = {"version": 1, "dim": int(vecs.shape[1]), "radius": RADIUS, **meta, "items": out_items}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"[embed] {len(items)} items, backend={meta['model']}, dim={vecs.shape[1]} -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
