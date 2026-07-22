import { invoke } from "@tauri-apps/api/core";
import type { SettingKey } from "@/lib/db/models";

export type NotificationType =
  | "new_jobs"
  | "resume_ready"
  | "interview_finished"
  | "update_available"
  | "task_completed"
  | "task_failed";

interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
}

const SETTING_KEY_MAP: Record<NotificationType, SettingKey> = {
  new_jobs: "notify_new_jobs",
  resume_ready: "notify_resume_ready",
  interview_finished: "notify_interview_finished",
  update_available: "notify_update_available",
  task_completed: "notify_task_completed",
  task_failed: "notify_task_completed",
};

const isEnabled = async (type: NotificationType): Promise<boolean> => {
  try {
    const { db } = await import("@/lib/db/service");
    return await db.getSettingBool(SETTING_KEY_MAP[type]);
  } catch {
    return true;
  }
};

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const enabled = await isEnabled(payload.type);
  if (!enabled) return;

  try {
    await invoke("send_notification", {
      title: payload.title,
      body: payload.body,
    });
  } catch {
    // Fallback: log if native notification unavailable
    console.log(`[Notification] ${payload.title}: ${payload.body}`);
  }
}

export const notifications = {
  newJobs(count: number): Promise<void> {
    return sendNotification({
      title: "New Jobs Found!",
      body: `${count} new job${count !== 1 ? "s" : ""} matching your profile discovered.`,
      type: "new_jobs",
    });
  },

  resumeReady(jobTitle: string): Promise<void> {
    return sendNotification({
      title: "ATS Resume Ready",
      body: `Your optimized resume for "${jobTitle}" has been generated.`,
      type: "resume_ready",
    });
  },

  interviewFinished(score: number): Promise<void> {
    return sendNotification({
      title: "Interview Complete",
      body: `Your mock interview finished with a score of ${score}%.`,
      type: "interview_finished",
    });
  },

  updateAvailable(version: string): Promise<void> {
    return sendNotification({
      title: "Update Available",
      body: `Version ${version} is ready to download.`,
      type: "update_available",
    });
  },

  taskCompleted(label: string): Promise<void> {
    return sendNotification({
      title: "Task Completed",
      body: `"${label}" has finished successfully.`,
      type: "task_completed",
    });
  },

  taskFailed(label: string, error?: string): Promise<void> {
    return sendNotification({
      title: "Task Failed",
      body: `"${label}" failed${error ? `: ${error}` : "."}`,
      type: "task_failed",
    });
  },
};
