/**
 * Wipe node_modules on Windows when npm cleanup hits ENOTEMPTY / EPERM
 * (common after switching from pnpm, OneDrive sync, or Gradle holding native paths).
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const nodeModules = path.join(root, "node_modules");

function wipeWithRobocopy(targetDir) {
  const empty = path.join(root, "_empty_node_modules_wipe");
  fs.mkdirSync(empty, { recursive: true });
  try {
    execFileSync(
      "robocopy",
      [empty, targetDir, "/MIR", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"],
      { stdio: "ignore", windowsHide: true },
    );
  } catch (err) {
    const code = err.status;
    // Robocopy: 0–7 = success; 8+ = failure
    if (code == null || code >= 8) throw err;
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
}

function removeNodeModules() {
  if (!fs.existsSync(nodeModules)) {
    console.log("node_modules already absent.");
    return;
  }

  if (process.platform === "win32") {
    wipeWithRobocopy(nodeModules);
  }

  fs.rmSync(nodeModules, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 500,
  });
  console.log("Removed node_modules.");
}

removeNodeModules();
