const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
    expo: {
        name: IS_DEV ? "Sécu Cycle Dev" : "Sécu Cycle",
        slug: "secu-cycle",
        version: "1.0.0",
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
                UIBackgroundModes: ["location"],
                NSLocationWhenInUseUsageDescription: "Sécu'Cycle a besoin de votre position pour vous guider en temps réel.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "Sécu Cycle utilise votre position en arrière-plan pour continuer la navigation avec le téléphone dans votre poche.",
                NSMicrophoneUsageDescription: "Sécu'Cycle utilise la synthèse vocale pour les instructions de navigation."
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: IS_DEV ? "./assets/images/adaptive-icon-dev.png" : "./assets/images/adaptive-icon.png",
                backgroundColor: "#e7ecfb"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            usesCleartextTraffic: true,
            package: IS_DEV ? "fr.secucycle.app.dev" : "fr.secucycle.app",
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION",
                "POST_NOTIFICATIONS"
            ]
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
                    "locationAlwaysAndWhenInUsePermission": "Sécu Cycle utilise votre position pour la navigation vélo.",
                    "locationAlwaysPermission": "Sécu Cycle utilise votre position en arrière-plan pour continuer la navigation avec le téléphone dans votre poche.",
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
            "@react-native-community/datetimepicker",
            "@maplibre/maplibre-react-native"
        ],
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

