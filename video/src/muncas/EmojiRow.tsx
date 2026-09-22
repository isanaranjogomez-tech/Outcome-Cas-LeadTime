import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Emoji, EMOJI_SIZE } from "./Emoji";
import { layout } from "./theme";
import type { Segment } from "./schema";

const SPACING = 356;

/** Where slot `index` sits when `count` emoji share the row. */
const slot = (index: number, count: number) => (index - (count - 1) / 2) * SPACING;

/** When the three settle into the order the brief asks for. */
export const rowFormsAt = (segment: Segment) =>
  segment.emojis.length === 3 ? segment.emojis[2].at + 0.38 : Infinity;

/**
 * The emoji appear one at a time, on the word that names them, and the group
 * re-centres each time. Once the third has landed they slide into the final
 * order — the gag reads as "…and here they are, together".
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

  // Re-centring when the newest emoji arrives.
  const newestAt = beats[appeared - 1].at * fps;
  const recentre = spring({
    frame: frame - newestAt,
    fps,
    config: { damping: 200, mass: 0.5 },
    durationInFrames: Math.round(fps * 0.3),
  });

  const rowAt = rowFormsAt(segment) * fps;
  const toRow =
    segment.row.length === 3
      ? spring({
          frame: frame - rowAt,
          fps,
          config: { damping: 18, mass: 0.5, stiffness: 140 },
          durationInFrames: Math.round(fps * 0.36),
        })
      : 0;

  // A very short shake as the row locks in — used where the brief asks for it.
  const sinceRow = (frame - rowAt) / fps;
  const shake =
    segment.rowShake && sinceRow >= 0 && sinceRow < 0.26
      ? Math.sin(sinceRow * 62) * 10 * Math.exp(-13 * sinceRow)
      : 0;
  const punch =
    segment.rowPunch && sinceRow >= 0
      ? interpolate(
          spring({
            frame: frame - rowAt,
            fps,
            config: { damping: 200 },
            durationInFrames: Math.round(fps * 0.9),
          }),
          [0, 1],
          [1, 1.16],
        )
      : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: `${layout.emojiTop * 100}%`,
        left: 0,
        right: 0,
        height: EMOJI_SIZE,
        transform: `translate(${shake}px, ${shake * 0.4}px) scale(${punch})`,
      }}
    >
      {beats.slice(0, appeared).map((beat, i) => {
        const isNewest = i === appeared - 1;
        const laidOut = isNewest
          ? slot(i, appeared)
          : interpolate(recentre, [0, 1], [slot(i, appeared - 1), slot(i, appeared)]);

        const rowIndex = segment.row.indexOf(beat.char);
        const target = rowIndex === -1 ? laidOut : slot(rowIndex, 3);
        const x = interpolate(toRow, [0, 1], [laidOut, target]);

        // Two emoji swapping places would otherwise slide straight through
        // each other; one arcs over, the other under.
        const direction = Math.sign(target - laidOut);
        const arc = direction === 0 ? 0 : -Math.sin(Math.PI * toRow) * 52 * direction;

        return (
          <div
            key={beat.char + i}
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              marginLeft: -EMOJI_SIZE / 2,
              transform: `translate(${x}px, ${arc}px)`,
            }}
          >
            <Emoji beat={beat} ageInFrames={frame - beat.at * fps} />
          </div>
        );
      })}
    </div>
  );
};
