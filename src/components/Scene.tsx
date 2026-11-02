"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { domainById, featured, itemById } from "@/lib/content";
import { sampleWord } from "@/lib/glyphs";
import type { Latent } from "@/lib/latent";
import { STOP, clamp01, flight, near, smooth } from "@/lib/store";
import { pointsFragment, pointsVertex } from "@/shaders/points";

const GLYPH_WIDTH = 26;
const FOV = 45;

type Stop = { cam: THREE.Vector3; target: THREE.Vector3; card: boolean };

function makeMaterial(size: number, opacity: number, additive = true) {
  return new THREE.ShaderMaterial({
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uHover: { value: -1 },
      uFocus: { value: -1 },
      uSwirl: { value: 2.2 },
      uDrift: { value: 1 },
      uBoost: { value: 1 },
      uOpacity: { value: opacity },
    },
  });
}

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function Cloud({ latent, glyph }: { latent: Latent; glyph: Float32Array }) {
  const { camera, size, gl, raycaster } = useThree();
  const dustCount = glyph.length / 3;

  const posById = useMemo(() => {
    const m: Record<string, THREE.Vector3> = {};
    for (const it of latent.items) m[it.id] = new THREE.Vector3(...it.pos);
    return m;
  }, [latent]);

  // ---------- dust: decorative, spells the name then becomes a nebula ----------
  const dust = useMemo(() => {
    const r = rand(42);
    const end = new Float32Array(dustCount * 3);
    const color = new Float32Array(dustCount * 3);
    const seed = new Float32Array(dustCount);
    const sz = new Float32Array(dustCount);
    const idx = new Float32Array(dustCount).fill(-10);
    const cyan = new THREE.Color("#22d3ee");
    const white = new THREE.Color("#dbeafe");
    const violet = new THREE.Color("#8b5cf6");
    for (let i = 0; i < dustCount; i++) {
      const far = r() < 0.28;
      const rad = far ? 24 + r() * 40 : 10 + Math.pow(r(), 0.7) * 13;
      const th = r() * Math.PI * 2;
      const y = (r() - 0.5) * (far ? 50 : 7) * (far ? 1 : 1 - rad / 30);
      end[i * 3] = Math.cos(th) * rad;
      end[i * 3 + 1] = y;
      end[i * 3 + 2] = Math.sin(th) * rad;
      const c = white.clone().lerp(r() < 0.75 ? cyan : violet, r() * 0.8);
      color.set([c.r * 0.72, c.g * 0.72, c.b * 0.78], i * 3);
      seed[i] = r();
      sz[i] = 0.9 + r() * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(end, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(glyph, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));
    return { geo: g, mat: makeMaterial(38, 0.95) };
  }, [dustCount, glyph]);

  // ---------- data: one point per real item ----------
  const data = useMemo(() => {
    const n = latent.items.length;
    const r = rand(7);
    const start = new Float32Array(n * 3);
    const end = new Float32Array(n * 3);
    const color = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const sz = new Float32Array(n);
    const idx = new Float32Array(n);
    latent.items.forEach((it, i) => {
      const g = Math.floor(r() * dustCount);
      start.set([glyph[g * 3], glyph[g * 3 + 1], glyph[g * 3 + 2] + 0.4], i * 3);
      end.set(it.pos, i * 3);
      const meta = itemById[it.id];
      const c = new THREE.Color(domainById[meta?.domain ?? "ai"]?.color ?? "#22d3ee");
      color.set([c.r, c.g, c.b], i * 3);
      seed[i] = r() * 0.6;
      sz[i] = meta?.featured ? 10 : meta?.kind === "skill" ? 5.2 : 7;
      idx[i] = i;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(end, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aIndex", new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    const mat = makeMaterial(46, 1);
    mat.uniforms.uSwirl.value = 3.2;
    mat.uniforms.uDrift.value = 0.25;
    return { geo: g, mat };
  }, [latent, glyph, dustCount]);

  // ---------- neighbor lines: each item to its 2 nearest by meaning ----------
  const lines = useMemo(() => {
    const seen = new Set<string>();
    const pos: number[] = [];
    const col: number[] = [];
    for (const it of latent.items) {
      for (const nb of it.neighbors.slice(0, 2)) {
        const key = [it.id, nb].sort().join("|");
        if (seen.has(key) || !posById[nb]) continue;
        seen.add(key);
        const a = posById[it.id];
        const b = posById[nb];
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const ca = new THREE.Color(domainById[itemById[it.id]?.domain]?.color ?? "#22d3ee");
        const cb = new THREE.Color(domainById[itemById[nb]?.domain]?.color ?? "#22d3ee");
        col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, [latent, posById]);

  // ---------- camera stops ----------
  const heroDist = useRef(24);
  const stops = useMemo<Stop[]>(() => {
    const aspect = size.width / Math.max(1, size.height);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const heroZ = Math.max(24, ((GLYPH_WIDTH / 2) / (halfTan * aspect)) * 1.12);
    heroDist.current = heroZ;
    // glyph sits ~30% from the top so the headline below it stays clear
    const lift = -halfTan * heroZ * 0.52;
    const out: Stop[] = [
      { cam: new THREE.Vector3(0, lift, heroZ), target: new THREE.Vector3(0, lift, 0), card: false },
      { cam: new THREE.Vector3(9, 7, 25), target: new THREE.Vector3(0, 0, 0), card: false },
    ];
    for (const f of featured) {
      const p = posById[f.id] ?? new THREE.Vector3();
      const dir = p.clone().normalize();
      if (dir.lengthSq() < 0.5) dir.set(0, 0, 1);
      dir.lerp(new THREE.Vector3(0.25, 0.35, 1).normalize(), 0.45).normalize();
      out.push({ cam: p.clone().addScaledVector(dir, 7.5), target: p.clone(), card: true });
    }
    out.push({ cam: new THREE.Vector3(-4, 5, 27), target: new THREE.Vector3(0, -1.5, 0), card: false });
    return out;
  }, [posById, size.width, size.height]);

  useEffect(() => {
    flight.stops = stops.length;
  }, [stops.length]);

  // ---------- projection for the DOM overlay ----------
  useEffect(() => {
    const v = new THREE.Vector3();
    flight.project = (p) => {
      v.set(p[0], p[1], p[2]).project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
        visible: v.z < 1 && v.z > -1,
      };
    };
    return () => {
      flight.project = null;
    };
  }, [camera, size]);

  // ---------- frame loop ----------
  const desiredCam = useRef(new THREE.Vector3(0, 0, 40));
  const desiredTarget = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const tmpRight = useRef(new THREE.Vector3());
  const started = useRef(false);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const s = Math.min(Math.max(flight.s, 0), stops.length - 1);
    const morph = smooth(clamp01((s - 0.08) / 0.85));
    const pr = gl.getPixelRatio();

    for (const m of [dust.mat, data.mat]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uMorph.value = morph;
      m.uniforms.uPixelRatio.value = pr;
      // far hero camera (portrait phones) -> keep points visible, fading back as the cloud forms
      m.uniforms.uBoost.value = 1 + (heroDist.current / 24 - 1) * (1 - morph);
    }
    const hoverIdx = flight.hover ? latent.items.findIndex((i) => i.id === flight.hover) : -1;
    const focusIdx = flight.focus ? latent.items.findIndex((i) => i.id === flight.focus) : -1;
    data.mat.uniforms.uHover.value = hoverIdx;
    data.mat.uniforms.uFocus.value = focusIdx;
    lines.mat.opacity = 0.22 * smooth(clamp01((morph - 0.7) / 0.3));

    // scroll position -> desired camera
    const i = Math.floor(s);
    const f = smooth(s - i);
    const a = stops[i];
    const b = stops[Math.min(i + 1, stops.length - 1)];
    desiredCam.current.lerpVectors(a.cam, b.cam, f);
    desiredTarget.current.lerpVectors(a.target, b.target, f);

    // gentle orbit on overview stops
    const overview = near(s, STOP.DISPERSE, 0.6) + near(s, stops.length - 1, 0.6);
    if (overview > 0) {
      desiredCam.current.x += Math.sin(t * 0.12) * 3 * overview;
      desiredCam.current.y += Math.cos(t * 0.1) * 1.5 * overview;
    }

    // lab search can redirect the camera to an item
    if (flight.focus && s > stops.length - 1.5) {
      const p = posById[flight.focus];
      if (p) {
        const dir = p.clone().normalize();
        if (dir.lengthSq() < 0.5) dir.set(0, 0, 1);
        dir.lerp(new THREE.Vector3(0.2, 0.3, 1).normalize(), 0.5).normalize();
        desiredCam.current.copy(p).addScaledVector(dir, 8);
        desiredTarget.current.copy(p);
      }
    }

    // featured stops: shift the look-at so the point sits left of the card (desktop)
    let cardW = 0;
    stops.forEach((st, k) => {
      if (st.card) cardW = Math.max(cardW, near(s, k, 0.5));
    });
    if (size.width > 900 && cardW > 0) {
      const dist = desiredCam.current.distanceTo(desiredTarget.current);
      const halfW = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist * (size.width / size.height);
      tmpRight.current.subVectors(desiredTarget.current, desiredCam.current).cross(camera.up).normalize();
      desiredTarget.current.addScaledVector(tmpRight.current, halfW * 0.32 * smooth(cardW));
    }

    if (!started.current) {
      camera.position.copy(desiredCam.current);
      lookAt.current.copy(desiredTarget.current);
      started.current = true;
    }
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(desiredCam.current, k);
    lookAt.current.lerp(desiredTarget.current, k);
    camera.lookAt(lookAt.current);
  });

  useEffect(() => {
    raycaster.params.Points = { threshold: 0.45 };
  }, [raycaster]);

  const ready = () => flight.s > 0.9;
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!ready() || e.index === undefined) return;
    e.stopPropagation();
    flight.hover = latent.items[e.index]?.id ?? null;
    flight.pointer = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    flight.hover = null;
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!ready() || e.index === undefined) return;
    e.stopPropagation();
    const id = latent.items[e.index]?.id;
    if (id) window.dispatchEvent(new CustomEvent("latent:select", { detail: id }));
  };

  return (
    <>
      <points geometry={dust.geo} material={dust.mat} frustumCulled={false} raycast={() => null} />
      <lineSegments geometry={lines.geo} material={lines.mat} frustumCulled={false} raycast={() => null} />
      <points
        geometry={data.geo}
        material={data.mat}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      />
    </>
  );
}

export default function Scene({ latent, onReady }: { latent: Latent; onReady?: () => void }) {
  const [glyph, setGlyph] = useState<Float32Array | null>(null);

  useEffect(() => {
    const mobile = window.innerWidth < 760;
    sampleWord("THOUSIF", mobile ? 4200 : 9000, GLYPH_WIDTH).then((g) => {
      setGlyph(g);
      onReady?.();
    });
  }, [onReady]);

  if (!glyph) return null;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, near: 0.1, far: 300, position: [0, 0, 40] }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Cloud latent={latent} glyph={glyph} />
    </Canvas>
  );
}
