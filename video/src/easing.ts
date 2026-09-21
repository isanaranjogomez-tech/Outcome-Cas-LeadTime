import { Easing } from "remotion";

/** Turns a tokens.css cubic-bezier tuple into a Remotion easing function. */
export const bezier = (curve: readonly [number, number, number, number]) =>
  Easing.bezier(curve[0], curve[1], curve[2], curve[3]);
