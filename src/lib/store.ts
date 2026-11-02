/**
 * Tiny mutable store shared by the scroll controller, the WebGL scene and the
 * DOM overlay. Values change every frame, so nothing here triggers React renders;
 * readers poll it inside requestAnimationFrame / useFrame.
 */
export const flight = {
  /** 0..stops-1, continuous position along the camera flight (from ScrollTrigger) */
  s: 0,
  /** total number of stops in the flight */
  stops: 1,
  /** 0..1 how far the page has scrolled past the flight (dims the canvas) */
  after: 0,
  /** item id the lab search asked the camera to visit */
  focus: null as string | null,
  /** item id under the pointer */
  hover: null as string | null,
  /** screen-space pointer for the hover tag */
  pointer: { x: 0, y: 0 },
  /** set by the scene: project a world point to CSS pixels */
  project: null as null | ((p: [number, number, number]) => { x: number; y: number; visible: boolean }),
};

/** Stop indices along the flight. Featured stops sit between DISPERSE and LAB. */
export const STOP = { HERO: 0, DISPERSE: 1, FIRST_FEATURED: 2 } as const;

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** 1 at stop i, fading to 0 at +-w stops away */
export const near = (s: number, i: number, w = 0.42) => clamp01(1 - Math.abs(s - i) / w);
