# Portfolio repo rules (thousif3.github.io)

This is the "Latent Space" portfolio: Next.js (static export) + react-three-fiber + GLSL + GSAP/Lenis, with a Python embedding pipeline. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Hard rules
- Do not modify anything under `src/`, `pipeline/`, `public/` or `.github/` unless the owner explicitly asks for that specific change.
- Never change the custom cursor (`src/components/Cursor.tsx` and the `.cursor` / `.cursor-ring` CSS).
- Do not add reduced-motion handling (skipped on purpose).
- Never commit or push to `main` directly. Work on a branch and open a PR.
- Never invent facts about the owner. Site text lives only in `src/content/content.json`; flag anything unverified instead of writing it.

## Commands
- Install: `npm install --ignore-scripts` (skips onnxruntime-node's native download; the site only uses the browser build)
- Rebuild the 3D layout after content edits: `python pipeline/embed.py` (uses MiniLM if sentence-transformers is installed, else TF-IDF)
- Build: `npm run build` (output in `out/`)
- Preview the build: `python -m http.server 4173 -d out`, then open http://localhost:4173
