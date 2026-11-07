/**
 * One entry point for running the Expo apps.
 *
 *   node scripts/run-app.js <user|vendor> <start|android|ios|web> [extra expo args]
 *
 * Runs doctor.js first (installs missing packages, checks metro.config.js),
 * then hands off to the app's own scripts/expo-dev.js (ports, Windows Metro handling).
 */
const path = require("path");
const { spawn } = require("child_process");
const { doctor, appDir, KNOWN_APPS } = require("./doctor");

const COMMANDS = {
  start: ["start"],
  android: ["run:android"],
  ios: ["run:ios"],
  web: ["start", "--web"],
};

const [appName, command = "start", ...extra] = process.argv.slice(2);

if (!KNOWN_APPS.includes(appName) || !COMMANDS[command]) {
  console.error(
    `Usage: node scripts/run-app.js <${KNOWN_APPS.join("|")}> <${Object.keys(COMMANDS).join("|")}>`,
  );
  process.exit(1);
}

if (!doctor(appName)) {
  console.error(`\n[run-app] Fix the error above, then run again.`);
  process.exit(1);
}

const dir = appDir(appName);
const child = spawn(
  process.execPath,
  [path.join(dir, "scripts", "expo-dev.js"), ...COMMANDS[command], ...extra],
  { cwd: dir, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
