/**
 * Consistent Metro port + Windows-friendly defaults when starting Expo.
 * Vendor app: 8080 (user app uses 8081).
 *
 * Default EXPO_NO_CACHE=1 avoids @expo/cli disk fetch cache races when user +
 * vendor start together ("Body has already been read" in dependency validation).
 * Override with EXPO_NO_CACHE=0 if you want API caching.
 *
 * Windows `run:android` / `run:ios`: see app/scripts/win-native-run-helpers.js
 */
const { spawn } = require("child_process");
const path = require("path");
const {
  applyWindowsPackagerHostname,
  ensureMetroForNativeRun,
  getLanIPv4,
} = require("../../scripts/win-native-run-helpers");

const METRO_PORT = "8080";
const projectRoot = path.join(__dirname, "..");

const expoSubcommand = process.argv[2];
const passthrough = process.argv.slice(3);

const needsPort =
  expoSubcommand === "start" ||
  expoSubcommand === "run:android" ||
  expoSubcommand === "run:ios";

const isNativeRun =
  expoSubcommand === "run:android" || expoSubcommand === "run:ios";

const expoArgs = [expoSubcommand, ...passthrough];
const willUseNoBundlerOnWindows =
  process.platform === "win32" &&
  isNativeRun &&
  !passthrough.includes("--no-bundler");

if (needsPort && !passthrough.includes("--port") && !willUseNoBundlerOnWindows) {
  expoArgs.push("--port", METRO_PORT);
}

function buildEnv() {
  return applyWindowsPackagerHostname({
    ...process.env,
    RCT_METRO_PORT: METRO_PORT,
    ...(process.env.EXPO_NO_CACHE == null ? { EXPO_NO_CACHE: "1" } : {}),
  });
}

function spawnExpo(env) {
  const child = spawn("npx", ["expo", ...expoArgs], {
    cwd: projectRoot,
    env,
    shell: true,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

async function main() {
  const env = buildEnv();

  if (process.platform === "win32" && isNativeRun && !passthrough.includes("--no-bundler")) {
    const lan = getLanIPv4();
    if (lan) {
      console.log(
        `[expo-dev] Physical device: Metro at http://${lan}:${METRO_PORT} (REACT_NATIVE_PACKAGER_HOSTNAME)`,
      );
    }
    try {
      const { started } = await ensureMetroForNativeRun({
        cwd: projectRoot,
        port: METRO_PORT,
        env,
      });
      if (started) {
        console.log(
          `[expo-dev] Started Metro on port ${METRO_PORT} (keeps running after native install).`,
        );
      }
      expoArgs.push("--no-bundler");
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  spawnExpo(env);
}

main();
