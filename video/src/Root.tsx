import "./index.css";
import "./fonts";

import React from "react";
import { Composition } from "remotion";
import { LowerThird } from "./compositions/LowerThird";
import { Montage } from "./compositions/Montage";
import { TitleCard } from "./compositions/TitleCard";
import { resolveScenes, totalDurationInFrames } from "./montage-timing";
import {
  lowerThirdSchema,
  montageSchema,
  titleCardSchema,
  type MontageProps,
} from "./schemas";
import montageExample from "../data/montage.json";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

/** Every composition below can be rendered with `npx remotion render <id>`. */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        schema={titleCardSchema}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={FPS * 5}
        defaultProps={{
          eyebrow: "IGCSE Global Perspectives · Component 3",
          title: "Academic performance regarding mental health in 9th grade",
          subtitle:
            "Mental health, academic pressure and stress in adolescents — Grade 9, Colegio Colombo Americano.",
          footnote: "LeadTime AI · Team Project outcome",
          theme: "dark" as const,
          durationInSeconds: 5,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(
            titleCardSchema.parse(props).durationInSeconds * FPS,
          ),
        })}
      />

      <Composition
        id="LowerThird"
        component={LowerThird}
        schema={lowerThirdSchema}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={FPS * 4}
        defaultProps={{
          name: "Isabella Naranjo",
          role: "LeadTime AI Web Developer",
          side: "left" as const,
          theme: "dark" as const,
          durationInSeconds: 4,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(
            lowerThirdSchema.parse(props).durationInSeconds * FPS,
          ),
        })}
      />

      <Composition
        id="Montage"
        component={Montage}
        schema={montageSchema}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={FPS * 30}
        defaultProps={montageExample as MontageProps}
        // Reads each clip's real length, then sizes the timeline to match.
        calculateMetadata={async ({ props }) => {
          // Parsing here applies the schema's defaults, so an edit list
          // passed with --props may omit every optional field.
          const parsed = montageSchema.parse(props);
          const scenes = await resolveScenes(parsed.scenes, FPS);
          const resolved = { ...parsed, scenes };
          return {
            durationInFrames: totalDurationInFrames(resolved, FPS),
            props: resolved,
          };
        }}
      />
    </>
  );
};
