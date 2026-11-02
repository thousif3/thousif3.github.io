/** Sample a word into 3D points by rasterizing it on a 2D canvas. */

export async function sampleWord(word: string, count: number, worldWidth: number): Promise<Float32Array> {
  const W = 1400;
  const H = 360;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 3);
  if (!ctx) return out;

  const family = "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif";
  try {
    await document.fonts.load(`800 260px ${family}`);
  } catch {
    /* fall back to system font */
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 280;
  ctx.font = `800 ${size}px ${family}`;
  while (ctx.measureText(word).width > W * 0.94 && size > 40) {
    size -= 8;
    ctx.font = `800 ${size}px ${family}`;
  }
  ctx.fillText(word, W / 2, H / 2 + size * 0.04);

  const data = ctx.getImageData(0, 0, W, H).data;
  const pixels: number[] = [];
  const step = 3;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 140) pixels.push(x, y);
    }
  }
  const n = pixels.length / 2;
  const scale = worldWidth / W;
  // deterministic pseudo-random so the shape is identical every visit
  let seed = 1337;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < count; i++) {
    const k = n > 0 ? Math.floor(rand() * n) : 0;
    const px = n > 0 ? pixels[k * 2] : W / 2;
    const py = n > 0 ? pixels[k * 2 + 1] : H / 2;
    out[i * 3] = (px - W / 2 + (rand() - 0.5) * step) * scale;
    out[i * 3 + 1] = -(py - H / 2 + (rand() - 0.5) * step) * scale;
    out[i * 3 + 2] = (rand() - 0.5) * 0.9;
  }
  return out;
}
