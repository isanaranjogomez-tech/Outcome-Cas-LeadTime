import React from "react";
import type { Segment } from "./schema";

/**
 * One SVG colour-grade filter per shot.
 *
 * The gains come from measuring the mean RGB of every shot and matching each
 * one part-way to the median shot, so the hallway, the window light and the
 * classroom stop fighting each other. feColorMatrix is used rather than a CSS
 * filter because white balance needs per-channel gain, which CSS cannot do.
 */
export const GradeDefs: React.FC<{ segments: Segment[] }> = ({ segments }) => (
  <svg
    width={0}
    height={0}
    style={{ position: "absolute", pointerEvents: "none" }}
    aria-hidden
  >
    <defs>
      {segments.map((s) => {
        const [r, g, b] = s.colour.gain;
        const e = s.colour.exposure;
        return (
          <filter
            key={s.id}
            id={`grade-${s.id}`}
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              values={[
                r * e, 0, 0, 0, 0,
                0, g * e, 0, 0, 0,
                0, 0, b * e, 0, 0,
                0, 0, 0, 1, 0,
              ].join(" ")}
            />
          </filter>
        );
      })}
    </defs>
  </svg>
);

/** Contrast and saturation ride on top of the per-shot matrix. */
export const gradeCss = (id: string) =>
  `url(#grade-${id}) contrast(1.045) saturate(1.06)`;
