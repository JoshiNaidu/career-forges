/**
 * Tauri Invoke Wrapper Layer
 * Type-safe wrappers for all database IPC commands
 * Handles loading states, retries, and error handling
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  AppState,
  AIAgent,
  Setting,
  User,
  ChatSession,
  ChatMessage,
  Resume,
  Job,
  ActivityLog,
  GeneratedResume,
  GeneratedCoverLetter,
  JobApplication,
  InterviewSession,
} from './models';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 100,
  backoffMultiplier: 2,
};

/**
 * Generic invoke wrapper with retry support
 */
async function invokeWithRetry<T>(
  command: string,
  args?: Record<string, unknown>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const result = await invoke<T>(command, args);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retryConfig.maxRetries) {
        const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt);
        console.warn(`Command ${command} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Command ${command} failed after ${retryConfig.maxRetries} retries`);
}

// ============ App State Invoke Wrappers ============

export const appStateInvoke = {
  async get(key: string): Promise<AppState | null> {
    return invokeWithRetry('db_get_app_state', { key });
  },

  async set(key: string, value: string, dataType?: string): Promise<AppState> {
    return invokeWithRetry('db_set_app_state', { key, value, dataType });
  },

  async getBool(key: string): Promise<boolean> {
    return invokeWithRetry('db_get_app_state_bool', { key });
  },

  async getString(key: string): Promise<string | null> {
    return invokeWithRetry('db_get_app_state_string', { key });
  },

  async listAll(): Promise<AppState[]> {
    return invokeWithRetry('db_list_app_state', {});
  },

  async delete(key: string): Promise<void> {
    return invokeWithRetry('db_delete_app_state', { key });
  },

  async isOnboardingCompleted(): Promise<boolean> {
    return invokeWithRetry('db_is_onboarding_completed', {});
  },

  async completeOnboarding(provider: string, model: string): Promise<void> {
    return invokeWithRetry('db_complete_onboarding', { provider, model });
  },

  async resetOnboarding(): Promise<void> {
    return invokeWithRetry('db_reset_onboarding', {});
  },

  async getOnboardingStep(): Promise<string> {
    return invokeWithRetry('db_get_onboarding_step', {});
  },

  async setOnboardingStep(step: string): Promise<void> {
    return invokeWithRetry('db_set_onboarding_step', { step });
  },

  async getSelectedProvider(): Promise<string> {
    return invokeWithRetry('db_get_selected_provider', {});
  },

  async setSelectedProvider(provider: string): Promise<void> {
    return invokeWithRetry('db_set_selected_provider', { provider });
  },

  async getSelectedModel(): Promise<string> {
    return invokeWithRetry('db_get_selected_model', {});
  },

  async setSelectedModel(model: string): Promise<void> {
    return invokeWithRetry('db_set_selected_model', { model });
  },

  async setOllamaDetected(detected: boolean): Promise<void> {
    return invokeWithRetry('db_set_ollama_detected', { detected });
  },

  async setClaudeDetected(detected: boolean): Promise<void> {
    return invokeWithRetry('db_set_claude_detected', { detected });
  },
};

// ============ AI Agent Invoke Wrappers ============

export const aiAgentInvoke = {
  async create(
    provider: string,
    name: string,
    displayName: string,
    isInstalled?: boolean
  ): Promise<AIAgent> {
    return invokeWithRetry('db_create_ai_agent', {
      provider,
      name,
      displayName,
      isInstalled,
    });
  },

  async get(id: string): Promise<AIAgent | null> {
    return invokeWithRetry('db_get_ai_agent', { id });
  },

  async listByProvider(provider: string): Promise<AIAgent[]> {
    return invokeWithRetry('db_list_ai_agents_by_provider', { provider });
  },

  async listInstalled(): Promise<AIAgent[]> {
    return invokeWithRetry('db_list_installed_ai_agents', {});
  },

  async getDefault(): Promise<AIAgent | null> {
    return invokeWithRetry('db_get_default_ai_agent', {});
  },

  async setDefault(id: string): Promise<AIAgent> {
    return invokeWithRetry('db_set_default_ai_agent', { id });
  },

  async updateInstallStatus(id: string, isInstalled: boolean): Promise<AIAgent> {
    return invokeWithRetry('db_update_ai_agent_install_status', {
      id,
      isInstalled,
    });
  },

  async updateAvailability(id: string, isAvailable: boolean): Promise<AIAgent> {
    return invokeWithRetry('db_update_ai_agent_availability', {
      id,
      isAvailable,
    });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_ai_agent', { id });
  },

  async listAll(): Promise<AIAgent[]> {
    return invokeWithRetry('db_list_all_ai_agents', {});
  },
};

// ============ Settings Invoke Wrappers ============

export const settingsInvoke = {
  async get(key: string): Promise<Setting | null> {
    return invokeWithRetry('db_get_setting', { key });
  },

  async set(key: string, value: string): Promise<Setting> {
    return invokeWithRetry('db_set_setting', { key, value });
  },

  async getBool(key: string): Promise<boolean> {
    return invokeWithRetry('db_get_setting_bool', { key });
  },

  async getString(key: string): Promise<string | null> {
    return invokeWithRetry('db_get_setting_string', { key });
  },

  async getNumber(key: string): Promise<number> {
    return invokeWithRetry('db_get_setting_number', { key });
  },

  async listAll(): Promise<Setting[]> {
    return invokeWithRetry('db_list_settings', {});
  },

  async delete(key: string): Promise<void> {
    return invokeWithRetry('db_delete_setting', { key });
  },

  async resetSettingsToDefaults(): Promise<void> {
    return invokeWithRetry('db_reset_settings_to_defaults', {});
  },

  async getSchedulerStatus(): Promise<any> {
    return invokeWithRetry('get_scheduler_status', {});
  },

  async toggleScheduler(enabled: boolean): Promise<void> {
    return invokeWithRetry('toggle_scheduler', { enabled });
  },

  async updateSchedulerFrequency(mins: number): Promise<void> {
    return invokeWithRetry('update_scheduler_frequency', { mins });
  },

  async runSchedulerNow(): Promise<number> {
    return invokeWithRetry('run_scheduler_now', {});
  },

  async getTheme(): Promise<string> {
    return invokeWithRetry('db_get_theme', {});
  },

  async setTheme(theme: string): Promise<void> {
    return invokeWithRetry('db_set_theme', { theme });
  },

  async getAutoSaveSessions(): Promise<boolean> {
    return invokeWithRetry('db_get_auto_save_sessions', {});
  },

  async setAutoSaveSessions(enabled: boolean): Promise<void> {
    return invokeWithRetry('db_set_auto_save_sessions', { enabled });
  },
};

// ============ User Invoke Wrappers ============

export const userInvoke = {
  async create(email: string, name?: string): Promise<User> {
    return invokeWithRetry('db_create_user', { email, name });
  },

  async get(id: string): Promise<User | null> {
    return invokeWithRetry('db_get_user', { id });
  },

  async getByEmail(email: string): Promise<User | null> {
    return invokeWithRetry('db_get_user_by_email', { email });
  },

  async listAll(): Promise<User[]> {
    return invokeWithRetry('db_list_users', {});
  },

  async update(id: string, name?: string, avatarUrl?: string): Promise<User> {
    return invokeWithRetry('db_update_user', { id, name, avatarUrl });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_user', { id });
  },
};

// ============ Session Invoke Wrappers ============

export const sessionInvoke = {
  async create(
    userId: string,
    title: string,
    model: string,
    mode: string,
    jobId?: string,
    jobDescription?: string,
    company?: string,
    jobTitle?: string
  ): Promise<ChatSession> {
    return invokeWithRetry('db_create_session', {
      userId,
      title,
      model,
      mode,
      jobId,
      jobDescription,
      company,
      jobTitle,
    });
  },

  async get(id: string): Promise<ChatSession | null> {
    return invokeWithRetry('db_get_session', { id });
  },

  async listByUser(userId: string): Promise<ChatSession[]> {
    return invokeWithRetry('db_list_user_sessions', { userId });
  },

  async updateTitle(id: string, title: string): Promise<ChatSession> {
    return invokeWithRetry('db_update_session_title', { id, title });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_session', { id });
  },

  async countByUser(userId: string): Promise<number> {
    return invokeWithRetry('db_count_user_sessions', { userId });
  },
};

// ============ Message Invoke Wrappers ============

export const messageInvoke = {
  async create(
    sessionId: string,
    role: string,
    content: string,
    model?: string,
    tokensUsed?: number
  ): Promise<ChatMessage> {
    return invokeWithRetry('db_create_message', {
      sessionId,
      role,
      content,
      model,
      tokensUsed,
    });
  },

  async get(id: string): Promise<ChatMessage | null> {
    return invokeWithRetry('db_get_message', { id });
  },

  async listBySession(sessionId: string): Promise<ChatMessage[]> {
    return invokeWithRetry('db_list_session_messages', { sessionId });
  },

  async listRecent(limit: number): Promise<ChatMessage[]> {
    return invokeWithRetry('db_list_recent_messages', { limit });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_message', { id });
  },

  async countTokens(sessionId: string): Promise<number> {
    return invokeWithRetry('db_count_session_tokens', { sessionId });
  },
};

// ============ Resume Invoke Wrappers ============

export const resumeInvoke = {
  async create(
    userId: string,
    filename: string,
    filePath: string,
    fileSize?: number,
    mimeType?: string,
    hash?: string
  ): Promise<Resume> {
    return invokeWithRetry('db_create_resume', {
      userId,
      filename,
      filePath,
      fileSize,
      mimeType,
      hash,
    });
  },

  async get(id: string): Promise<Resume | null> {
    return invokeWithRetry('db_get_resume', { id });
  },

  async listByUser(userId: string): Promise<Resume[]> {
    return invokeWithRetry('db_list_resumes', { userId });
  },

  async setDefault(id: string, userId: string): Promise<void> {
    return invokeWithRetry('db_set_default_resume', { id, userId });
  },

  async getDefault(userId: string): Promise<Resume | null> {
    return invokeWithRetry('db_get_default_resume', { userId });
  },

  async updateContent(id: string, content: string): Promise<void> {
    return invokeWithRetry('db_update_resume_content', { id, content });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_resume', { id });
  },

  async upload(path: string): Promise<Resume> {
    return invokeWithRetry('upload_resume', { path });
  },

  async parseAndStore(fileName: string, fileBytes: number[]): Promise<Resume> {
    return invokeWithRetry('parse_and_store_resume', { fileName, fileBytes });
  },

  async view(path: string): Promise<void> {
    return invokeWithRetry('view_resume', { path });
  },

  async download(path: string): Promise<void> {
    return invokeWithRetry('download_resume', { path });
  },
};

// ============ Job Invoke Wrappers ============

export const jobInvoke = {
  async create(
    userId: string,
    title: string,
    company?: string,
    url?: string
  ): Promise<Job> {
    return invokeWithRetry('db_create_job', { userId, title, company, url });
  },

  async get(id: string): Promise<Job | null> {
    return invokeWithRetry('db_get_job', { id });
  },

  async listByUser(userId: string): Promise<Job[]> {
    return invokeWithRetry('db_list_jobs', { userId });
  },

  async updateStatus(id: string, status: string): Promise<void> {
    return invokeWithRetry('db_update_job_status', { id, status });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_job', { id });
  },

  async fetch(title?: string, location?: string, remote: boolean = false): Promise<number> {
    return invokeWithRetry('fetch_jobs', { title, location, remote });
  },

  async search(queryText: string): Promise<Job[]> {
    return invokeWithRetry('search_jobs', { queryText });
  },

  async save(id: string): Promise<void> {
    return invokeWithRetry('save_job', { id });
  },

  async reject(id: string): Promise<void> {
    return invokeWithRetry('reject_job', { id });
  },

  async listAll(): Promise<Job[]> {
    return invokeWithRetry('get_jobs', {});
  },
};

// ============ Activity Log Invoke Wrappers ============

export const activityLogInvoke = {
  async create(
    userId: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: string
  ): Promise<ActivityLog> {
    return invokeWithRetry('db_create_activity_log', {
      userId,
      action,
      entityType,
      entityId,
      details,
    });
  },

  async listByUser(userId: string, limit: number): Promise<ActivityLog[]> {
    return invokeWithRetry('db_list_activity_logs', { userId, limit });
  },
};

// ============ ATS Invoke Wrappers ============

export const atsInvoke = {
  async generateResume(jobId: string, resumeId: string): Promise<GeneratedResume> {
    return invokeWithRetry('generate_ats_resume', { jobId, resumeId });
  },

  async generateCoverLetter(jobId: string, resumeId: string): Promise<GeneratedCoverLetter> {
    return invokeWithRetry('generate_cover_letter', { jobId, resumeId });
  },

  async listGeneratedResumes(jobId: string): Promise<GeneratedResume[]> {
    return invokeWithRetry('db_list_generated_resumes', { jobId });
  },

  async listGeneratedCoverLetters(jobId: string): Promise<GeneratedCoverLetter[]> {
    return invokeWithRetry('db_list_generated_cover_letters', { jobId });
  },

  async listAllGeneratedResumes(userId: string): Promise<GeneratedResume[]> {
    return invokeWithRetry('db_list_all_generated_resumes', { userId });
  },

  async listAllGeneratedCoverLetters(userId: string): Promise<GeneratedCoverLetter[]> {
    return invokeWithRetry('db_list_all_generated_cover_letters', { userId });
  },

  async deleteGeneratedResume(id: string): Promise<void> {
    return invokeWithRetry('db_delete_generated_resume', { id });
  },

  async deleteGeneratedCoverLetter(id: string): Promise<void> {
    return invokeWithRetry('db_delete_generated_cover_letter', { id });
  },

  async markAsApplied(
    jobId: string,
    resumeId?: string,
    coverLetterId?: string
  ): Promise<JobApplication> {
    return invokeWithRetry('mark_job_as_applied', {
      jobId,
      resumeId,
      coverLetterId,
    });
  },

  async listApplications(userId: string): Promise<JobApplication[]> {
    return invokeWithRetry('db_list_applications', { userId });
  },

  async getApplicationByJob(jobId: string): Promise<JobApplication | null> {
    return invokeWithRetry('db_get_application_by_job', { jobId });
  },
};

// ============ Interview Invoke Wrappers ============

export const interviewInvoke = {
  async create(
    sessionType: string,
    jobTitle?: string,
    company?: string,
    jobId?: string,
    jobDescription?: string,
    experienceLevel?: string,
    personality?: string,
    resumeContext?: string
  ): Promise<InterviewSession> {
    return invokeWithRetry('db_create_interview_session', {
      sessionType,
      jobTitle,
      company,
      jobId,
      jobDescription,
      experienceLevel,
      personality,
      resumeContext,
    });
  },

  async get(id: string): Promise<InterviewSession | null> {
    return invokeWithRetry('db_get_interview_session', { id });
  },

  async listAll(): Promise<InterviewSession[]> {
    return invokeWithRetry('db_list_interview_sessions', {});
  },

  async updateScore(
    id: string,
    score: number,
    feedback: string,
    durationSeconds: number
  ): Promise<void> {
    return invokeWithRetry('db_update_interview_score', {
      id,
      score,
      feedback,
      durationSeconds,
    });
  },

  async delete(id: string): Promise<void> {
    return invokeWithRetry('db_delete_interview_session', { id });
  },
};

// ============ Database Health Invoke Wrappers ============

export const dbHealthInvoke = {
  async ping(): Promise<boolean> {
    try {
      return await invokeWithRetry('db_ping', {});
    } catch {
      return false;
    }
  },

  async getSize(): Promise<number> {
    return invokeWithRetry('db_get_size', {});
  },
};

export const dbInvoke = {
  appState: appStateInvoke,
  aiAgent: aiAgentInvoke,
  settings: settingsInvoke,
  user: userInvoke,
  session: sessionInvoke,
  message: messageInvoke,
  resume: resumeInvoke,
  job: jobInvoke,
  activityLog: activityLogInvoke,
  health: dbHealthInvoke,
  ats: atsInvoke,
  interview: interviewInvoke,
};
