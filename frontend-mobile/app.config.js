const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PROD = process.env.APP_VARIANT === 'production';

export default {
    expo: {
        name: IS_DEV ? "Sécu Cycle Dev" : "Sécu Cycle",
        slug: "secu-cycle",
        version: "1.2.0",
        runtimeVersion: {
            policy: "appVersion"
        },
        updates: {
            url: "https://u.expo.dev/6fffe32f-044e-4033-8da0-4431b0a81f3a",
            fallbackToCacheTimeout: 0
        },
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "secucycle",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            icon: IS_DEV ? "./assets/images/ios-icon-dev.png" : "./assets/images/ios-icon.png",
            supportsTablet: false,
            bundleIdentifier: IS_DEV ? "fr.secucycle.app.dev" : "fr.secucycle.app",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                UIBackgroundModes: ["location"]
                // Les descriptions NSLocation* sont fournies par la clé `locales`
                // ci-dessous, qui les traduit. Les redéclarer ici les figerait en
                // français : l'Info.plist littéral gagne sur les catalogues.
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: IS_DEV ? "./assets/images/adaptive-icon-dev.png" : "./assets/images/adaptive-icon.png",
                backgroundColor: "#e7ecfb"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            usesCleartextTraffic: !IS_PROD,
            package: IS_DEV ? "fr.secucycle.app.dev" : "fr.secucycle.app",
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION",
                "POST_NOTIFICATIONS"
            ],
            intentFilters: [
                {
                    action: 'VIEW',
                    category: ['DEFAULT', 'BROWSABLE'],
                    data: [{ scheme: 'geo' }],
                },
            ],
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    "image": IS_DEV ? "./assets/images/adaptive-icon-dev.png" : "./assets/images/splash-icon.png",
                    "imageWidth": 200,
                    "resizeMode": "contain",
                    "backgroundColor": "#e7ecfb",
                    "dark": {
                        "backgroundColor": "#2f3148"
                    }
                }
            ],
            [
                "expo-location",
                {
                    // Volontairement sans locationAlways*Permission : ces clés
                    // écrasent l'Info.plist et gagneraient sur les catalogues de
                    // `locales`, ce qui figerait les demandes de permission en
                    // français. Les textes vivent dans i18n/locales/native/.
                    "isAndroidBackgroundLocationEnabled": true
                }
            ],
            [
                "expo-notifications",
                {
                    "icon": "./assets/images/notification-icon.png",
                    "color": "#646cff"
                }
            ],
            "expo-localization",
            "@react-native-community/datetimepicker",
            "@maplibre/maplibre-react-native",
            "./plugins/withAndroidLint.js",
            "./plugins/withQuickActionIcons.js",
            "expo-quick-actions",
            "expo-share-intent"
        ],
        defaultLanguage: "fr",
        locales: {
            fr: "./i18n/locales/native/fr.json",
            en: "./i18n/locales/native/en.json"
        },
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            eas: {
                projectId: "6fffe32f-044e-4033-8da0-4431b0a81f3a"
            }
        }
    }
}

