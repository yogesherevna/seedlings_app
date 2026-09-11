const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite web uses a WASM worker. Keep the native SQLite support intact
// while allowing Metro to serve the WASM asset required by the web build.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = withNativeWind(config, {
  input: './global.css',
});
