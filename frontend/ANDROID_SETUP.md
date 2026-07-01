# Android Setup Guide

## Prerequisites

- **Node.js** >= 18
- **Android Studio** (latest version)
- **Java JDK** >= 17 (bundled with Android Studio)
- **Android SDK** (managed by Android Studio)

## Install Dependencies

```bash
cd frontend
npm install
```

## Environment Variables

Ensure all environment variables from `.env` are also defined for the Capacitor build:

```bash
# Example .env
VITE_API_URL=https://your-api.onrender.com
```

> **Important**: Android WebView uses `https` by default. If your API runs on `http`, set `server.cleartext: true` in `capacitor.config.ts` (already configured).

## Build for Android

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to Android project
npx cap sync

# 3. Open in Android Studio
npx cap open android
```

Once Android Studio opens:

1. Wait for Gradle sync to complete
2. Select a device or emulator
3. Click **Run** (green triangle)

## Development Workflow

```bash
# After making web changes:
npm run build && npx cap sync

# Then refresh the Android app (stop and re-run, or use Live Reload)
```

### Live Reload (Optional)

```bash
# Start Vite dev server on your network
npx vite --host

# Update capacitor.config.ts to point to your dev server:
# server: {
#   url: 'http://192.168.x.x:5173',
#   cleartext: true,
# }

# Sync and run
npx cap sync
npx cap run android
```

## Build Release APK

### Generate a Signed APK

1. Open `android/` in Android Studio
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **APK**
4. Create a new keystore or use existing one
5. Fill in keystore details
6. Select **release** build variant
7. Choose signature versions: **V1** and **V2**
8. Click **Finish**

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Generate a Signed AAB (Play Store)

1. Open `android/` in Android Studio
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Select your keystore
5. Select **release** build variant
6. Click **Finish**

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Using Command Line

```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# Build release AAB
./gradlew bundleRelease

# The APK/AAB will be in:
# android/app/build/outputs/apk/release/
# android/app/build/outputs/bundle/release/
```

On Windows:
```powershell
cd android
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

## Keystore Configuration

Create `android/keystore.properties` (or use Android Studio UI):

```properties
storeFile=../moneyvault.keystore
storePassword=yourStorePassword
keyAlias=yourKeyAlias
keyPassword=yourKeyPassword
```

## App Icons

Capacitor uses adaptive icons for Android 8+. Place your icons at:

```
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
```

Generate icons using [Android Studio Image Asset Tool](https://developer.android.com/studio/write/image-asset-studio):

1. Right-click `android/app/src/main/res` → **New → Image Asset**
2. Choose **Launcher Icons (Adaptive & Legacy)**
3. Select your foreground and background layers
4. Click **Next → Finish**

## Splash Screen

Configured in `capacitor.config.ts`. Customize the background color and duration.

To use a custom splash image:

1. Place your image at `android/app/src/main/res/drawable/splash.png`
2. The plugin will render it centered with the background color

## Status Bar & Navigation Bar

Configured in `capacitor.config.ts` under `StatusBar` plugin settings:

- `style`: `DARK` (light text) or `LIGHT` (dark text)
- `backgroundColor`: hex color for Android

## Testing Checklist

| Feature       | Web | PWA | Android |
|---------------|-----|-----|---------|
| Login         | ✓   | ✓   |         |
| Register      | ✓   | ✓   |         |
| Dashboard     | ✓   | ✓   |         |
| Goals         | ✓   | ✓   |         |
| Add Money     | ✓   | ✓   |         |
| Withdraw      | ✓   | ✓   |         |
| QR Scanner    | ✓   | ✓   |         |
| QR Generator  | ✓   | ✓   |         |
| UPI Apps      | ✓   | ✓   |         |
| Copy UPI ID   | ✓   | ✓   |         |
| Share         | ✓   | ✓   |         |
| Notifications | ✓   | ✓   |         |

## Common Issues

### Cleartext Traffic Not Allowed

If you see `ERR_CLEARTEXT_NOT_PERMITTED`, the app is trying to load `http` URLs.
Either:

- Use `https` for API and all external URLs, or
- Set `server.cleartext: true` in `capacitor.config.ts` (already configured for development)

### WebView Caching

If changes aren't reflected, clear the app cache:

- **Android**: Settings → Apps → Money Vault → Storage → Clear Cache
- Or uninstall and reinstall the app

### Deep Links Not Working

Android may not open `upi://pay` links from WebView reliably.
The app uses `@capacitor/app-launcher` to open UPI URIs natively, which is more reliable than browser-based deep linking.

## Useful Commands

```bash
# Build web app
npm run build

# Copy web assets to Android
npx cap copy

# Sync all assets and plugins
npx cap sync

# Open Android Studio
npx cap open android

# Run on connected device
npx cap run android

# Full build + sync
npm run build && npx cap sync
```
