/**
 * Quick pre-build sanity check: Metro config loads, and the resolved Expo config
 * has the Android size settings. Run: node scripts/check-build-config.js
 */
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
process.chdir(root);

try {
  require(path.join(root, 'metro.config.js'));
  console.log('METRO OK');
} catch (e) {
  console.log('METRO FAIL', e.stack);
}

try {
  const out = execSync('npx expo config --type prebuild --json', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const cfg = JSON.parse(out.slice(out.indexOf('{')));
  const plugin = (cfg.plugins || []).find(
    (p) => Array.isArray(p) && p[0] === 'expo-build-properties',
  );
  console.log('CONFIG OK');
  console.log('package:', cfg.android?.package, 'versionCode:', cfg.android?.versionCode);
  console.log('build-properties:', JSON.stringify(plugin?.[1]?.android ?? null, null, 0).slice(0, 200));
} catch (e) {
  console.log('CONFIG FAIL', e.stderr || e.message);
}
