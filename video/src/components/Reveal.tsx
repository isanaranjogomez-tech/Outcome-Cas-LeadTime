import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeOut } from "../theme";
import { bezier } from "../easing";

/**
 * The site's reveal: a short rise with a fade, on --ease-out.
 * `delayInSeconds` staggers siblings.
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delayInSeconds?: number;
  distance?: number;
  durationInSeconds?: number;
}> = ({ children, delayInSeconds = 0, distance = 26, durationInSeconds = 0.72 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const start = delayInSeconds * fps;
  const end = start + durationInSeconds * fps;

  const progress = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: bezier(easeOut),
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * distance}px)`,
      }}
    >
      {children}
    </div>
  );
};
