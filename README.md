# Thousifuddin Shaik · Latent Space portfolio

Live: <https://thousif3.github.io>

Every project, role, award, certification and skill is one point in a 3D space,
**placed by meaning**. A Python pipeline embeds each item's description and folds
the space into 3D with UMAP. The site turns scroll into a camera flight through it,
and the search box embeds your query in the browser and flies to the nearest items.

## Stack

| Layer | Tech |
| --- | --- |
| Languages | TypeScript, Python, GLSL, HTML/CSS |
| Framework | Next.js (App Router, static export) |
| 3D | Three.js via react-three-fiber, custom GLSL point shaders |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| Styling | Tailwind CSS v4 + hand-written CSS |
| Build-time ML | sentence-transformers (all-MiniLM-L6-v2), UMAP, scikit-learn |
| In-browser ML | Transformers.js (same MiniLM weights) or a TF-IDF + SVD fallback |
| Hosting | GitHub Pages via GitHub Actions |

## How it fits together

```
src/content/content.json  ──►  pipeline/embed.py  ──►  public/latent.json
   (all site text)              (embed + UMAP 3D)        (positions + vectors)
                                                              │
                         Next.js static build  ◄──────────────┘
                                   │
     browser: r3f point cloud (GLSL) · ScrollTrigger camera · DOM cards · search
```

- `pipeline/embed.py --backend minilm` is what CI runs. `--backend tfidf` needs no
  model download; the browser then re-runs the same TF-IDF + SVD math for search.
  The footer says which backend built the live layout.
- Without WebGL2 the home page falls back to a static grid with the same search.

## Edit content

1. Change `src/content/content.json`.
2. `python3 pipeline/embed.py` to rebuild the layout (CI does this on every push).
3. Push to `main`.

## Run locally

```bash
npm install --ignore-scripts      # skips onnxruntime-node's native download (browser-only use)
pip install -r pipeline/requirements.txt
python3 pipeline/embed.py         # minilm if available, else tfidf
npm run dev
```

## Deploy

Repo **Settings → Pages → Source: GitHub Actions**. Every push to `main` runs
`.github/workflows/deploy.yml`. For a custom domain, set it under Settings → Pages
and add a repo variable `SITE_URL` (e.g. `https://thousif3.dev`) so the sitemap and
share cards use it.
