"use client";

import { useEffect, useState } from "react";
import { loadLatent } from "@/lib/latent";

/** Says honestly which embedding model placed the points in this build. */
export default function FooterModel() {
  const [model, setModel] = useState<string>("");
  useEffect(() => {
    loadLatent()
      .then((l) => setModel(l.model === "minilm" ? "MiniLM embeddings" : "TF-IDF + SVD embeddings"))
      .catch(() => setModel(""));
  }, []);
  return (
    <p>
      Layout: {model || "embeddings"} → UMAP 3D · Next.js · Three.js · GLSL · GSAP · Lenis
    </p>
  );
}
