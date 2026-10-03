/**
 * Windows: keep Metro alive across `expo run:android` / `run:ios` (CLI often exits after install).
 */
const http = require("http");
const os = require("os");
const { spawn } = require("child_process");

function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function metroIsRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForMetro(port, maxMs = 180_000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = async () => {
      if (await metroIsRunning(port)) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= maxMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, 500);
    };
    tick();
  });
}

/**
 * @param {{ cwd: string, port: string, env: NodeJS.ProcessEnv }} opts
 */
async function ensureMetroForNativeRun({ cwd, port, env }) {
  if (await metroIsRunning(port)) {
    return { started: false };
  }

  const metro = spawn(
    "npx",
    ["expo", "start", "--port", String(port), "--dev-client"],
    {
      cwd,
      env,
      shell: true,
      detached: true,
      stdio: "ignore",
    },
  );
  metro.unref();

  const ok = await waitForMetro(port);
  if (!ok) {
    throw new Error(
      `Metro did not respond on http://localhost:${port}/status within 3 minutes. ` +
        `Start it manually: npm start`,
    );
  }

  return { started: true };
}

function applyWindowsPackagerHostname(env) {
  if (process.platform !== "win32") {
    return env;
  }
  if (env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    return env;
  }
  const lan = getLanIPv4();
  if (!lan) {
    return env;
  }
  return { ...env, REACT_NATIVE_PACKAGER_HOSTNAME: lan };
}

module.exports = {
  applyWindowsPackagerHostname,
  ensureMetroForNativeRun,
  getLanIPv4,
  metroIsRunning,
};
