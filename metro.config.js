const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "@workspace/api-client-react": path.resolve(__dirname, "lib/api-client-react"),
};

module.exports = config;
