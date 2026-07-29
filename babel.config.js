module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4 splits its worklets engine into
    // react-native-worklets; its babel plugin MUST be listed last. Without
    // it (and without react-native-worklets as a direct dependency) the
    // RNWorklets native framework isn't embedded and the release build
    // crashes on launch — the App Store rejection under Guideline 2.1(a).
    plugins: ['react-native-worklets/plugin'],
  };
};
