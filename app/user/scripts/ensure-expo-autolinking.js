/**
 * expo-modules-autolinking must include `build/` (published on npm).
 * If a broken partial install exists, reinstall the pinned version.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appRoot = path.join(__dirname, '..');
const pkgRoot = path.join(appRoot, 'node_modules', 'expo-modules-autolinking');
const buildEntry = path.join(pkgRoot, 'build', 'index.js');
const PINNED = '3.0.27';

if (fs.existsSync(buildEntry)) {
  process.exit(0);
}

console.warn('[postinstall] expo-modules-autolinking is missing build/ — reinstalling…');

if (fs.existsSync(pkgRoot)) {
  fs.rmSync(pkgRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

execSync(`npm install expo-modules-autolinking@${PINNED} --no-audit --no-fund`, {
  cwd: appRoot,
  stdio: 'inherit',
  env: { ...process.env, npm_config_install_strategy: 'hoisted' },
});

if (!fs.existsSync(buildEntry)) {
  console.error(
    '[postinstall] expo-modules-autolinking still broken. Delete node_modules/expo-modules-autolinking and run npm install.',
  );
  process.exit(1);
}
