import { check } from '@tauri-apps/plugin-updater';

export type UpdaterDebugStatus = {
  checkedAt: string;
  available: boolean;
  version?: string;
  notes?: string;
  error?: string;
};

export async function checkForUpdates() {
  try {
    console.log('[Updater] Checking for updates...');
    
    const update = await check();

    if (update?.available) {
      console.log(`[Updater] Update available: ${update.version}`);
      console.log(`[Updater] Release notes: ${update.body}`);
      
      // Download and install the update
      // The app will automatically restart after installation
      await update.downloadAndInstall();
      console.log('[Updater] Update downloaded and installed. Restarting...');
    } else {
      console.log('[Updater] No updates available');
    }
  } catch (error) {
    console.error('[Updater] Error checking for updates:', error);
  }
}

export async function checkForUpdatesDebug(): Promise<UpdaterDebugStatus> {
  const checkedAt = new Date().toISOString();

  try {
    console.log('[Updater] Debug check started...');
    const update = await check();

    if (update?.available) {
      console.log(`[Updater] Debug: update available ${update.version}`);
      return {
        checkedAt,
        available: true,
        version: update.version,
        notes: update.body ?? '',
      };
    }

    console.log('[Updater] Debug: no updates available');
    return {
      checkedAt,
      available: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Updater] Debug check error:', error);
    return {
      checkedAt,
      available: false,
      error: message,
    };
  }
}

export async function checkForUpdatesInBackground() {
  // Always check on app launch
  localStorage.setItem('lastUpdateCheck', Date.now().toString());
  await checkForUpdates();
}
