import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.markd.app',
    appName: 'markd',
    webDir: '.next',
    server: {
        url: 'https://markd-ashen.vercel.app/en', // Update with actual Vercel assigned domain if different
        cleartext: true
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 0,
            launchAutoHide: true,
            backgroundColor: "#000000",
            androidSplashResourceName: "splash",
            androidScaleType: "CENTER_CROP",
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
