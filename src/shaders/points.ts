/**
 * One shader pair drives both layers:
 *  - dust: thousands of decorative particles that spell the name, then become a nebula
 *  - data: one point per real portfolio item, morphing from the name into its UMAP position
 * The morph is staggered per particle (aSeed) and swirls mid-flight so the
 * transition reads as a flock, not a linear tween.
 */

export const pointsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uHover;
  uniform float uFocus;
  uniform float uSwirl;
  uniform float uDrift;
  uniform float uBoost;

  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  attribute float aIndex;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    // staggered, eased morph from the name glyph (aStart) to the latent position (aEnd)
    float t = clamp((uMorph - aSeed * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 p = mix(aStart, aEnd, t);

    // swirl while in transit: zero at both ends, strongest mid-flight
    float transit = t * (1.0 - t) * 4.0;
    p += vec3(
      sin(aSeed * 41.0 + uTime * 0.9),
      cos(aSeed * 23.0 + uTime * 0.7),
      sin(aSeed * 17.0 + uTime * 0.8)
    ) * transit * uSwirl;

    // idle drift so the space breathes
    float drift = (0.06 + 0.1 * t) * uDrift;
    p += vec3(
      sin(uTime * 0.31 + aSeed * 10.0),
      cos(uTime * 0.27 + aSeed * 7.0),
      sin(uTime * 0.23 + aSeed * 5.0)
    ) * drift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float hot = max(step(abs(aIndex - uHover), 0.5), step(abs(aIndex - uFocus), 0.5));
    vHot = hot;
    float size = aSize * (1.0 + hot * 0.9);
    gl_PointSize = size * uSize * uBoost * uPixelRatio / max(0.1, -mv.z);

    // gentle twinkle
    float tw = 0.75 + 0.25 * sin(uTime * (1.2 + aSeed * 2.0) + aSeed * 60.0);
    vAlpha = tw;
    vColor = aColor;
  }
`;

export const pointsFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.22, 0.0, d);
    float glow = exp(-d * d * 14.0);
    float ring = vHot * smoothstep(0.03, 0.0, abs(d - 0.38));
    vec3 col = vColor * (glow * 0.9 + core * 0.6) + vec3(core * 0.55) + vColor * ring * 1.5;
    float a = (glow * 0.85 + core + ring) * vAlpha * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`;
