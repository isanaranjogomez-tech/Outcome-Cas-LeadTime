// See all configuration options: https://remotion.dev/docs/config
// Each option is also available as a CLI flag: https://remotion.dev/docs/cli
// Note: when using the Node.JS APIs this file does not apply — pass options directly.

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setConcurrency(null); // null = use all available cores
Config.overrideBundlerConfig(enableTailwind);

// Remotion downloads its own Chrome Headless Shell on first use. On machines
// where that download is blocked, point this at an existing Chrome/Chromium:
//   REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
