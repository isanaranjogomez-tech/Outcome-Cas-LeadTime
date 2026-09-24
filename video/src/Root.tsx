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
import { Muncas, muncasDurationInFrames } from "./muncas/Muncas";
import { muncasSchema, type MuncasProps } from "./muncas/schema";
import muncasEdit from "../data/muncas-emojis.json";
import { Letras, letrasDurationInFrames } from "./letras/Letras";
import { letrasSchema, type LetrasProps } from "./letras/schema";
import letrasEdit from "../data/muncas-letras.json";
import { Welcome, welcomeDurationInFrames } from "./welcome/Welcome";
import { welcomeSchema, type WelcomeProps } from "./welcome/schema";
import welcomeEdit from "../data/muncas-welcome.json";
import { Sponsors, sponsorsDurationInFrames } from "./sponsors/Sponsors";
import { sponsorsSchema, type SponsorsProps } from "./sponsors/schema";
import sponsorsEdit from "../data/muncas-sponsors.json";
import { Mitos, mitosDurationInFrames } from "./mitos/Mitos";
import { mitosSchema, type MitosProps } from "./mitos/schema";
import mitosEdit from "../data/muncas-mitos.json";
import { Palabras, palabrasDurationInFrames } from "./palabras/Palabras";
import { palabrasSchema, type PalabrasProps } from "./palabras/schema";
import palabrasEdit from "../data/muncas-palabras.json";
import { Plata, plataDurationInFrames } from "./plata/Plata";
import { plataSchema, type PlataProps } from "./plata/schema";
import { Cover } from "./plata/Cover";
import plataEdit from "../data/muncas-plata.json";
import { Directiva, directivaDurationInFrames } from "./directiva/Directiva";
import { directivaSchema, type DirectivaProps } from "./directiva/schema";
import directivaEdit from "../data/muncas-directiva.json";

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

      <Composition
        id="Muncas"
        component={Muncas}
        schema={muncasSchema}
        fps={muncasEdit.fps}
        width={muncasEdit.width}
        height={muncasEdit.height}
        durationInFrames={Math.round(muncasEdit.totalInSeconds * muncasEdit.fps)}
        defaultProps={muncasSchema.parse(muncasEdit) as MuncasProps}
        calculateMetadata={({ props }) => {
          const parsed = muncasSchema.parse(props);
          return {
            durationInFrames: muncasDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasLetras"
        component={Letras}
        schema={letrasSchema}
        fps={letrasEdit.fps}
        width={letrasEdit.width}
        height={letrasEdit.height}
        durationInFrames={Math.round(letrasEdit.totalInSeconds * letrasEdit.fps)}
        defaultProps={letrasSchema.parse(letrasEdit) as LetrasProps}
        calculateMetadata={({ props }) => {
          const parsed = letrasSchema.parse(props);
          return {
            durationInFrames: letrasDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasWelcome"
        component={Welcome}
        schema={welcomeSchema}
        fps={welcomeEdit.fps}
        width={welcomeEdit.width}
        height={welcomeEdit.height}
        durationInFrames={Math.round(welcomeEdit.totalInSeconds * welcomeEdit.fps)}
        defaultProps={welcomeSchema.parse(welcomeEdit) as WelcomeProps}
        calculateMetadata={({ props }) => {
          const parsed = welcomeSchema.parse(props);
          return {
            durationInFrames: welcomeDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasSponsors"
        component={Sponsors}
        schema={sponsorsSchema}
        fps={sponsorsEdit.fps}
        width={sponsorsEdit.width}
        height={sponsorsEdit.height}
        durationInFrames={Math.round(sponsorsEdit.totalInSeconds * sponsorsEdit.fps)}
        defaultProps={sponsorsSchema.parse(sponsorsEdit) as SponsorsProps}
        calculateMetadata={({ props }) => {
          const parsed = sponsorsSchema.parse(props);
          return {
            durationInFrames: sponsorsDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasMitos"
        component={Mitos}
        schema={mitosSchema}
        fps={mitosEdit.fps}
        width={mitosEdit.width}
        height={mitosEdit.height}
        durationInFrames={Math.round(mitosEdit.totalInSeconds * mitosEdit.fps)}
        defaultProps={mitosSchema.parse(mitosEdit) as MitosProps}
        calculateMetadata={({ props }) => {
          const parsed = mitosSchema.parse(props);
          return {
            durationInFrames: mitosDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasPalabras"
        component={Palabras}
        schema={palabrasSchema}
        fps={palabrasEdit.fps}
        width={palabrasEdit.width}
        height={palabrasEdit.height}
        durationInFrames={Math.round(palabrasEdit.totalInSeconds * palabrasEdit.fps)}
        defaultProps={palabrasSchema.parse(palabrasEdit) as PalabrasProps}
        calculateMetadata={({ props }) => {
          const parsed = palabrasSchema.parse(props);
          return {
            durationInFrames: palabrasDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      <Composition
        id="MuncasPlata"
        component={Plata}
        schema={plataSchema}
        fps={plataEdit.fps}
        width={plataEdit.width}
        height={plataEdit.height}
        durationInFrames={Math.round(plataEdit.totalInSeconds * plataEdit.fps)}
        defaultProps={plataSchema.parse(plataEdit) as PlataProps}
        calculateMetadata={({ props }) => {
          const parsed = plataSchema.parse(props);
          return {
            durationInFrames: plataDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      {/* The directiva montage: horizontal, 16:9. */}
      <Composition
        id="MuncasDirectiva"
        component={Directiva}
        schema={directivaSchema}
        fps={directivaEdit.fps}
        width={directivaEdit.width}
        height={directivaEdit.height}
        durationInFrames={directivaEdit.totalFrames}
        defaultProps={directivaSchema.parse(directivaEdit) as DirectivaProps}
        calculateMetadata={({ props }) => {
          const parsed = directivaSchema.parse(props);
          return {
            durationInFrames: directivaDurationInFrames(parsed),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
            props: parsed,
          };
        }}
      />

      {/* The TikTok cover. A still, never part of the edit. */}
      <Composition
        id="MuncasPlataCover"
        component={Cover}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={1}
        defaultProps={{
          source: plataEdit.source,
          frameSeconds: 5.0,
          leftAmount: plataEdit.leftAmount,
          rightAmount: plataEdit.rightAmount,
        }}
      />
    </>
  );
};
