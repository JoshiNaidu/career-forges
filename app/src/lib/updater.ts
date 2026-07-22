import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type UpdateStage =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'ready_to_restart'
  | 'restarting'
  | 'up_to_date'
  | 'error';

export type UpdaterDebugStatus = {
  checkedAt: string;
  available: boolean;
  version?: string;
  notes?: string;
  error?: string;
};

export interface UpdaterState {
  stage: UpdateStage;
  version?: string;
  notes?: string;
  progress: number;
  error?: string;
  totalBytes?: number;
  downloadedBytes?: number;
}

export const initialUpdaterState: UpdaterState = {
  stage: 'idle',
  progress: 0,
};

export async function checkForUpdates(): Promise<UpdaterState> {
  try {
    const update = await check();

    if (update?.available) {
      return {
        stage: 'available',
        version: update.version,
        notes: update.body ?? '',
        progress: 0,
      };
    }

    return {
      stage: 'up_to_date',
      progress: 100,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      stage: 'error',
      progress: 0,
      error: message,
    };
  }
}

export async function downloadAndInstallUpdate(
  onProgress: (state: UpdaterState) => void
): Promise<UpdaterState> {
  try {
    const update = await check();

    if (!update?.available) {
      return { stage: 'up_to_date', progress: 100 };
    }

    let downloaded = 0;
    let total = 0;

    onProgress({
      stage: 'downloading',
      version: update.version,
      notes: update.body ?? '',
      progress: 0,
      totalBytes: total,
      downloadedBytes: downloaded,
    });

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          total = event.data.contentLength ?? 0;
          onProgress({
            stage: 'downloading',
            version: update.version,
            progress: 0,
            totalBytes: total,
            downloadedBytes: 0,
          });
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0;
          onProgress({
            stage: 'downloading',
            version: update.version,
            progress: pct,
            totalBytes: total,
            downloadedBytes: downloaded,
          });
          break;
        case 'Finished':
          onProgress({
            stage: 'verifying',
            version: update.version,
            progress: 100,
            totalBytes: total,
            downloadedBytes: downloaded,
          });
          break;
      }
    });

    onProgress({
      stage: 'installing',
      version: update.version,
      progress: 100,
    });

    onProgress({
      stage: 'ready_to_restart',
      version: update.version,
      progress: 100,
    });

    return {
      stage: 'ready_to_restart',
      version: update.version,
      progress: 100,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      stage: 'error',
      progress: 0,
      error: message,
    };
  }
}

export async function restartApp(): Promise<void> {
  try {
    await relaunch();
  } catch (error) {
    console.error('[Updater] Failed to relaunch:', error);
  }
}

export async function checkForUpdatesDebug(): Promise<UpdaterDebugStatus> {
  const checkedAt = new Date().toISOString();

  try {
    const update = await check();

    if (update?.available) {
      return {
        checkedAt,
        available: true,
        version: update.version,
        notes: update.body ?? '',
      };
    }

    return {
      checkedAt,
      available: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      checkedAt,
      available: false,
      error: message,
    };
  }
}

export async function checkForUpdatesInBackground(): Promise<void> {
  localStorage.setItem('lastUpdateCheck', Date.now().toString());

  const state = await checkForUpdates();
  if (state.stage === 'available' && state.version) {
    const { notifications } = await import('./notifications');
    await notifications.updateAvailable(state.version);
  }
}
