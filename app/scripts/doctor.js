/**
 * Checks an Expo app (user / vendor) before running it:
 *   1. Every dependency in package.json is present in node_modules (runs `npm install` if not).
 *   2. metro.config.js loads. Metro hides the real error behind
 *      ERR_UNSUPPORTED_ESM_URL_SCHEME on Windows, so we load it ourselves and print the real one.
 *
 * Usage: node scripts/doctor.js user vendor
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const APPS_ROOT = path.join(__dirname, "..");
const KNOWN_APPS = ["user", "vendor"];

function appDir(name) {
  if (!KNOWN_APPS.includes(name)) {
    throw new Error(`Unknown app "${name}". Use one of: ${KNOWN_APPS.join(", ")}`);
  }
  return path.join(APPS_ROOT, name);
}

function missingDependencies(dir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  return names.filter(
    (name) => !fs.existsSync(path.join(dir, "node_modules", name, "package.json")),
  );
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: true });
  return result.status === 0;
}

function checkMetroConfig(dir) {
  // Fresh process so a cached/partial require can't hide the error.
  const code =
    "try{require(process.argv[1]);console.log('OK')}" +
    "catch(e){console.error(e.stack);process.exit(1)}";
  const result = spawnSync(process.execPath, ["-e", code, path.join(dir, "metro.config.js")], {
    cwd: dir,
    encoding: "utf8",
  });
  return { ok: result.status === 0, error: (result.stderr || "").trim() };
}

function doctor(name) {
  const dir = appDir(name);
  console.log(`\n[doctor] ${name} app (${dir})`);

  let missing = missingDependencies(dir);
  if (missing.length > 0) {
    console.log(`[doctor] Missing packages: ${missing.join(", ")}`);
    console.log("[doctor] Running npm install...");
    run("npm", ["install", "--no-audit", "--no-fund"], dir);
    missing = missingDependencies(dir);
    if (missing.length > 0) {
      console.error(`[doctor] Still missing after npm install: ${missing.join(", ")}`);
      console.error(`[doctor] Try: cd ${dir} && npm install ${missing.join(" ")}`);
      return false;
    }
  }
  console.log("[doctor] Dependencies OK");

  const metro = checkMetroConfig(dir);
  if (!metro.ok) {
    console.error("[doctor] metro.config.js failed to load. Real error:\n");
    console.error(metro.error);
    return false;
  }
  console.log("[doctor] metro.config.js OK");
  return true;
}

module.exports = { doctor, appDir, KNOWN_APPS };

if (require.main === module) {
  const names = process.argv.slice(2);
  const targets = names.length > 0 ? names : KNOWN_APPS;
  const allOk = targets.map(doctor).every(Boolean);
  process.exit(allOk ? 0 : 1);
}
