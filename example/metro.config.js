const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const sdkRoot = path.resolve(__dirname, '..'); // adjust if needed

const defaultConfig = getDefaultConfig(projectRoot);
module.exports = mergeConfig(defaultConfig, {
  resolver: {
    // (optional) allow true FS symlinks if you ever `ln -s` the SDK folder
    unstable_enableSymlinks: true,
    // tell Metro that whenever someone `import 'sahha-react-native'`
    // it should resolve to the local SDK folder instead of node_modules
    extraNodeModules: {
      'sahha-react-native': sdkRoot,
      // also map react & react-native to the app's versions:
      react: path.resolve(projectRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    },
  },
  watchFolders: [
    // so Metro will reload when you change SDK code:
    sdkRoot,
  ],
});
