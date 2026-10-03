/**
 * Clears Gradle caches under expo-modules-autolinking (Windows EBUSY / locks).
 * Does NOT remove the package or its `build/` output — required for Gradle + CLI.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..', 'node_modules');

function stopGradleDaemonsOnWindows() {
  if (process.platform !== 'win32') return;
  try {
    const ps1 = path.join(__dirname, 'stop-gradle-daemons.ps1').replace(/'/g, "''");
    execSync(`powershell -NoProfile -File '${ps1}'`, { stdio: 'ignore', timeout: 20000 });
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
  } catch {
    // best-effort
  }
}

function rmSafe(target) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
      return true;
    } catch {
      if (attempt < 7) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
      }
    }
  }
  return false;
}

function cleanGradleDirsUnder(dir, depth = 0) {
  if (depth > 10 || !fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name === '.gradle') {
      rmSafe(full);
      continue;
    }
    cleanGradleDirsUnder(full, depth + 1);
  }
}

stopGradleDaemonsOnWindows();

if (!fs.existsSync(root)) {
  process.exit(0);
}

const autolinkingRoot = path.join(root, 'expo-modules-autolinking');
if (fs.existsSync(autolinkingRoot)) {
  cleanGradleDirsUnder(autolinkingRoot);
}

try {
  for (const name of fs.readdirSync(root)) {
    if (name.startsWith('.expo-modules-autolinking-')) {
      rmSafe(path.join(root, name));
    }
  }
} catch {
  // ignore
}
