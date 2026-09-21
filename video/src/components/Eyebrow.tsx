import React from "react";
import { fonts } from "../theme";

/** The small tracked-out label the site uses above every section heading. */
export const Eyebrow: React.FC<{ children: React.ReactNode; color: string }> = ({
  children,
  color,
}) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontSize: 26,
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);
