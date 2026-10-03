const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const exclusionList =
  require('metro-config/private/defaults/exclusionList').default;
const {
  NATIVE_TREE_EXCLUSIONS,
} = require('../scripts/metro-native-exclusions');

const METRO_PORT = 8080;

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  port: METRO_PORT,
};

// Keep Metro from crawling native trees (android/app/build is huge after run:android;
// Windows FallbackWatcher can hit "Failed to start watch mode" if these are watched).
const expoBlockList = config.resolver.blockList;
const blockPatterns = [
  ...(Array.isArray(expoBlockList)
    ? expoBlockList
    : expoBlockList
      ? [expoBlockList]
      : []),
  ...NATIVE_TREE_EXCLUSIONS,
];

config.resolver = {
  ...config.resolver,
  blockList: exclusionList(blockPatterns),
  useWatchman: process.platform !== 'win32',
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
