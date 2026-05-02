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
            supportsTablet: true,
            bundleIdentifier: IS_DEV ? "com.alexixisorganization.secucycle.dev" : "com.alexixisorganization.secucycle",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSLocationWhenInUseUsageDescription: "Sécu'Cycle a besoin de votre position pour vous guider en temps réel.",
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
            package: IS_DEV ? "com.alexixisorganization.secucycle.dev" : "com.alexixisorganization.secucycle",
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION"
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

