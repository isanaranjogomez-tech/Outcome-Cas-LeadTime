import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Emoji, EMOJI_SIZE } from "./Emoji";
import { layout } from "./theme";
import type { Segment } from "./schema";

const SPACING = 356;

/** Left, centre, right — fixed for the whole answer. */
const slot = (index: number, count: number) => (index - (count - 1) / 2) * SPACING;

/**
 * Each emoji appears on the word that names it, in its final place, and
 * stays there: first spoken on the left, second in the middle, third on the
 * right. Nothing slides, crosses or re-orders afterwards — the three simply
 * sit together until the cut.
 */
export const EmojiRow: React.FC<{ segment: Segment }> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beats = segment.emojis;
  if (beats.length === 0) {
    return null;
  }

  const appeared = beats.filter((b) => frame >= b.at * fps).length;
  if (appeared === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: `${layout.emojiTop * 100}%`,
        left: 0,
        right: 0,
        height: EMOJI_SIZE,
      }}
    >
      {beats.slice(0, appeared).map((beat, i) => (
        <div
          key={beat.char + i}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            marginLeft: -EMOJI_SIZE / 2,
            transform: `translateX(${slot(i, beats.length)}px)`,
          }}
        >
          <Emoji beat={beat} ageInFrames={frame - beat.at * fps} />
        </div>
      ))}
    </div>
  );
};
