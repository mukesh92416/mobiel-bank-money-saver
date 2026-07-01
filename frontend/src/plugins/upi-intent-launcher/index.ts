import { registerPlugin } from '@capacitor/core'

export interface UPIIntentLauncherPlugin {
  launch(options: { packageName: string; upiUri: string }): Promise<void>
}

export const UPIIntentLauncher = registerPlugin<UPIIntentLauncherPlugin>('UPIIntentLauncher')
