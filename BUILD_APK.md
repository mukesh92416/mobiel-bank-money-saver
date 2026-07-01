# Build APK with GitHub Actions

Money Vault uses GitHub Actions to build the Android APK automatically.  
No Android Studio or local Android SDK required.

---

## Trigger the Workflow

The workflow runs automatically on:

- **Push** to the `main` branch
- **Pull request** targeting the `main` branch
- **Manual trigger** from the GitHub UI

### Manual Trigger

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Android APK Builder** in the left sidebar
4. Click **Run workflow** → **Run workflow**

---

## Download the APK

1. Go to the **Actions** tab in your repository
2. Click on the completed workflow run
3. Scroll to **Artifacts**
4. Click **MoneyVault-Debug-APK** to download the ZIP

The ZIP contains `app-debug.apk`.

---

## Install the APK

### On Android Device

1. Transfer the APK to your phone (USB, email, cloud drive, etc.)
2. Open the file with a file manager
3. You may need to enable **Install from Unknown Sources**:
   - **Settings → Security → Install Unknown Apps** → enable for your file manager
4. Tap **Install**

### On Emulator

```bash
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Side-load with `adb`

```bash
adb install -r app-debug.apk
```

The `-r` flag replaces an existing installation.

---

## Troubleshooting

### Workflow fails at "Install npm dependencies"

- Ensure `frontend/package-lock.json` exists
- Run `npm install` locally to generate it if missing

### Workflow fails at "Build React app"

- Check for TypeScript errors locally: `cd frontend && npx tsc --noEmit`
- Check for build errors locally: `cd frontend && npm run build`

### Workflow fails at "Sync Capacitor"

- Ensure `capacitor.config.ts` exists in `frontend/`
- Ensure `frontend/android/` directory exists (run `npx cap add android` locally once)

### Workflow fails at "Build Debug APK"

Common causes:

| Issue | Fix |
|-------|-----|
| Gradle cache corrupt | Clear Actions cache in GitHub settings |
| SDK component missing | The ubuntu-latest runner has all required SDK components |
| Gradle out of memory | The runner has 7 GB RAM — sufficient for debug builds |
| `Execution failed for task ':app:mergeDebugNativeLibs'` | Try restarting the workflow — transient runner issue |
| `android/gradlew` not found | Ensure `android/` was committed to the repository |

### APK not downloadable

- The artifact name is **MoneyVault-Debug-APK**
- Only available for completed runs
- Artifacts expire after 90 days by default (configurable in repository settings)

---

## Local Build (Alternative)

If you have the Android SDK installed locally:

```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK will be at:  
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Workflow File

Location: `.github/workflows/android-build.yml`

The workflow:

1. Checks out the repository
2. Sets up Node.js 22 with npm cache
3. Installs dependencies (`npm ci`)
4. Builds the React app (`npm run build`)
5. Syncs Capacitor web assets (`npx cap sync android`)
6. Sets up JDK 21 (Temurin) with Gradle cache
7. Grants execute permission to `gradlew`
8. Builds the debug APK (`./gradlew assembleDebug`)
9. Uploads the APK as a build artifact

No release signing — debug APK only.
