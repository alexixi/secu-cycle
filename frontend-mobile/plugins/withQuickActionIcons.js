const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const SOURCE_DIR = "assets/quick-actions";

module.exports = function withQuickActionIcons(config) {
    return withDangerousMod(config, [
        "android",
        (cfg) => {
            const source = path.join(cfg.modRequest.projectRoot, SOURCE_DIR);
            if (!fs.existsSync(source)) return cfg;

            const target = path.join(
                cfg.modRequest.platformProjectRoot,
                "app/src/main/res/drawable"
            );
            fs.mkdirSync(target, { recursive: true });

            for (const nom of fs.readdirSync(source)) {
                if (!nom.endsWith(".xml")) continue;
                if (!/^[a-z][a-z0-9_]*\.xml$/.test(nom)) {
                    throw new Error(
                        `withQuickActionIcons : « ${nom} » n'est pas un nom de ressource ` +
                        `Android valide (minuscules, chiffres et underscores seulement).`
                    );
                }
                fs.copyFileSync(path.join(source, nom), path.join(target, nom));
            }

            return cfg;
        },
    ]);
};
