const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withAndroidLint(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    if (cfg.modResults.contents.includes('disable "ExtraTranslation"')) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /android\s*\{/,
      `android {
    lint {
        disable "ExtraTranslation"
    }`
    );
    return cfg;
  });
};
