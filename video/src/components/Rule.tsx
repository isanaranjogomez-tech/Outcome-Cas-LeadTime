import React from "react";

/** A hairline, optionally wiping in from the left. */
export const Rule: React.FC<{ color: string; width?: number | string }> = ({
  color,
  width = 120,
}) => <div style={{ width, height: 1, backgroundColor: color }} />;
