/**
 * Database service layer for frontend
 * Communicates with Rust backend through Tauri IPC via invoke wrappers
 */

import { dbInvoke } from './invoke';
import type {
  User,
  ChatSession,
  ChatMessage,
  Resume,
  Job,
  Preference,
  ActivityLog,
  AppState,
  AppStateKey,
  AIAgent,
  Setting,
  SettingKey,
  GeneratedResume,
  GeneratedCoverLetter,
  JobApplication,
  InterviewSession,
} from './models';

class DatabaseService {
  // ============ User Operations ============
  
  async createUser(email: string, name?: string): Promise<User> {
    return dbInvoke.user.create(email, name);
  }

  async getUser(id: string): Promise<User | null> {
    return dbInvoke.user.get(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return dbInvoke.user.getByEmail(email);
  }

  async listUsers(): Promise<User[]> {
    return dbInvoke.user.listAll();
  }

  async updateUser(id: string, name?: string, avatar_url?: string): Promise<User> {
    return dbInvoke.user.update(id, name, avatar_url);
  }

  async deleteUser(id: string): Promise<void> {
    return dbInvoke.user.delete(id);
  }

  // ============ Session Operations ============

  async createSession(
    user_id: string,
    title: string,
    model: string,
    mode: string,
    job_id?: string,
    job_description?: string,
    company?: string,
    job_title?: string
  ): Promise<ChatSession> {
    return dbInvoke.session.create(
      user_id,
      title,
      model,
      mode,
      job_id,
      job_description,
      company,
      job_title
    );
  }

  async getSession(id: string): Promise<ChatSession | null> {
    return dbInvoke.session.get(id);
  }

  async listUserSessions(user_id: string): Promise<ChatSession[]> {
    return dbInvoke.session.listByUser(user_id);
  }

  async updateSessionTitle(id: string, title: string): Promise<ChatSession> {
    return dbInvoke.session.updateTitle(id, title);
  }

  async deleteSession(id: string): Promise<void> {
    return dbInvoke.session.delete(id);
  }

  async countUserSessions(user_id: string): Promise<number> {
    return dbInvoke.session.countByUser(user_id);
  }

  // ============ Message Operations ============

  async createMessage(
    session_id: string,
    role: 'user' | 'assistant',
    content: string,
    model?: string,
    tokens_used?: number
  ): Promise<ChatMessage> {
    return dbInvoke.message.create(session_id, role, content, model, tokens_used);
  }

  async getMessage(id: string): Promise<ChatMessage | null> {
    return dbInvoke.message.get(id);
  }

  async listSessionMessages(session_id: string): Promise<ChatMessage[]> {
    return dbInvoke.message.listBySession(session_id);
  }

  async listRecentMessages(limit: number = 10): Promise<ChatMessage[]> {
    return dbInvoke.message.listRecent(limit);
  }

  async deleteMessage(id: string): Promise<void> {
    return dbInvoke.message.delete(id);
  }

  async countSessionTokens(session_id: string): Promise<number> {
    return dbInvoke.message.countTokens(session_id);
  }

  // ============ Resume Operations ============

  async createResume(
    user_id: string,
    filename: string,
    file_path: string,
    file_size?: number,
    mime_type?: string
  ): Promise<Resume> {
    return dbInvoke.resume.create(user_id, filename, file_path, file_size, mime_type);
  }

  async getResume(id: string): Promise<Resume | null> {
    return dbInvoke.resume.get(id);
  }

  async listUserResumes(user_id: string): Promise<Resume[]> {
    return dbInvoke.resume.listByUser(user_id);
  }

  async setDefaultResume(id: string, user_id: string): Promise<void> {
    return dbInvoke.resume.setDefault(id, user_id);
  }

  async getDefaultResume(user_id: string): Promise<Resume | null> {
    return dbInvoke.resume.getDefault(user_id);
  }

  async deleteResume(id: string): Promise<void> {
    return dbInvoke.resume.delete(id);
  }

  async uploadResume(path: string): Promise<Resume> {
    return dbInvoke.resume.upload(path);
  }

  async parseAndStoreResume(fileName: string, fileBytes: number[]): Promise<Resume> {
    return dbInvoke.resume.parseAndStore(fileName, fileBytes);
  }

  // ============ Job Operations ============

  async createJob(
    user_id: string,
    title: string,
    company?: string,
    url?: string
  ): Promise<Job> {
    return dbInvoke.job.create(user_id, title, company, url);
  }

  async getJob(id: string): Promise<Job | null> {
    return dbInvoke.job.get(id);
  }

  async listUserJobs(user_id: string): Promise<Job[]> {
    return dbInvoke.job.listByUser(user_id);
  }

  async updateJobStatus(id: string, status: Job['status']): Promise<void> {
    return dbInvoke.job.updateStatus(id, status);
  }

  async deleteJob(id: string): Promise<void> {
    return dbInvoke.job.delete(id);
  }

  async fetchJobs(title?: string, location?: string, remote: boolean = false): Promise<number> {
    return dbInvoke.job.fetch(title, location, remote);
  }

  async searchJobs(queryText: string): Promise<Job[]> {
    return dbInvoke.job.search(queryText);
  }

  async saveJob(id: string): Promise<void> {
    return dbInvoke.job.save(id);
  }

  async rejectJob(id: string): Promise<void> {
    return dbInvoke.job.reject(id);
  }

  async listAllJobs(): Promise<Job[]> {
    return dbInvoke.job.listAll();
  }

  // ============ Preference Operations ============

  async setPreference(user_id: string, key: string, value: string): Promise<Preference> {
    throw new Error('Preference operations not yet implemented via IPC');
  }

  async getPreference(user_id: string, key: string): Promise<Preference | null> {
    throw new Error('Preference operations not yet implemented via IPC');
  }

  async listUserPreferences(user_id: string): Promise<Preference[]> {
    throw new Error('Preference operations not yet implemented via IPC');
  }

  // ============ Activity Logging ============

  async logActivity(
    action: string,
    entity_type?: string,
    entity_id?: string,
    user_id?: string | null,
    details?: string
  ): Promise<ActivityLog> {
    return dbInvoke.activityLog.create(user_id || null, action, entity_type, entity_id, details);
  }

  async listActivityLogs(user_id: string, limit: number = 50): Promise<ActivityLog[]> {
    return dbInvoke.activityLog.listByUser(user_id, limit);
  }

  // ============ App State Operations ============

  async getAppState(key: AppStateKey): Promise<AppState | null> {
    return dbInvoke.appState.get(key);
  }

  async setAppState(key: AppStateKey, value: string, dataType?: string): Promise<AppState> {
    return dbInvoke.appState.set(key, value, dataType);
  }

  async getAppStateString(key: AppStateKey): Promise<string | null> {
    return dbInvoke.appState.getString(key);
  }

  async getAppStateBool(key: AppStateKey): Promise<boolean> {
    return dbInvoke.appState.getBool(key);
  }

  async listAppState(): Promise<AppState[]> {
    return dbInvoke.appState.listAll();
  }

  // ============ AI Agent Operations ============

  async createAIAgent(
    provider: string,
    name: string,
    display_name: string,
    is_installed?: boolean
  ): Promise<AIAgent> {
    return dbInvoke.aiAgent.create(provider, name, display_name, is_installed);
  }

  async getAIAgent(id: string): Promise<AIAgent | null> {
    return dbInvoke.aiAgent.get(id);
  }

  async listAIAgentsByProvider(provider: string): Promise<AIAgent[]> {
    return dbInvoke.aiAgent.listByProvider(provider);
  }

  async listInstalledAIAgents(): Promise<AIAgent[]> {
    return dbInvoke.aiAgent.listInstalled();
  }

  async getDefaultAIAgent(): Promise<AIAgent | null> {
    return dbInvoke.aiAgent.getDefault();
  }

  async setDefaultAIAgent(id: string): Promise<AIAgent> {
    return dbInvoke.aiAgent.setDefault(id);
  }

  async updateAIAgentInstallStatus(id: string, is_installed: boolean): Promise<AIAgent> {
    return dbInvoke.aiAgent.updateInstallStatus(id, is_installed);
  }

  async updateAIAgentAvailability(id: string, is_available: boolean): Promise<AIAgent> {
    return dbInvoke.aiAgent.updateAvailability(id, is_available);
  }

  async deleteAIAgent(id: string): Promise<void> {
    return dbInvoke.aiAgent.delete(id);
  }

  // ============ Settings Operations ============

  async getSetting(key: SettingKey): Promise<Setting | null> {
    return dbInvoke.settings.get(key);
  }

  async setSetting(key: SettingKey, value: string): Promise<Setting> {
    return dbInvoke.settings.set(key, value);
  }

  async getSettingString(key: SettingKey): Promise<string | null> {
    return dbInvoke.settings.getString(key);
  }

  async getSettingBool(key: SettingKey): Promise<boolean> {
    return dbInvoke.settings.getBool(key);
  }

  async getSettingNumber(key: SettingKey): Promise<number> {
    return dbInvoke.settings.getNumber(key);
  }

  async listSettings(): Promise<Setting[]> {
    return dbInvoke.settings.listAll();
  }

  async resetSettingsToDefaults(): Promise<void> {
    return dbInvoke.settings.resetSettingsToDefaults();
  }

  async getSchedulerStatus(): Promise<any> {
    return dbInvoke.settings.getSchedulerStatus();
  }

  async toggleScheduler(enabled: boolean): Promise<void> {
    return dbInvoke.settings.toggleScheduler(enabled);
  }

  async updateSchedulerFrequency(mins: number): Promise<void> {
    return dbInvoke.settings.updateSchedulerFrequency(mins);
  }

  async runSchedulerNow(): Promise<number> {
    return dbInvoke.settings.runSchedulerNow();
  }

  // ============ Database Health ============

  async getDatabaseSize(): Promise<number> {
    return dbInvoke.health.getSize();
  }

  async ping(): Promise<boolean> {
    return dbInvoke.health.ping();
  }

  // ============ ATS Operations ============

  async generateAtsResume(job_id: string, resume_id: string): Promise<GeneratedResume> {
    return dbInvoke.ats.generateResume(job_id, resume_id);
  }

  async generateCoverLetter(job_id: string, resume_id: string): Promise<GeneratedCoverLetter> {
    return dbInvoke.ats.generateCoverLetter(job_id, resume_id);
  }

  async listGeneratedResumes(job_id: string): Promise<GeneratedResume[]> {
    return dbInvoke.ats.listGeneratedResumes(job_id);
  }

  async listGeneratedCoverLetters(job_id: string): Promise<GeneratedCoverLetter[]> {
    return dbInvoke.ats.listGeneratedCoverLetters(job_id);
  }

  async listAllGeneratedResumes(user_id: string): Promise<GeneratedResume[]> {
    return dbInvoke.ats.listAllGeneratedResumes(user_id);
  }

  async listAllGeneratedCoverLetters(user_id: string): Promise<GeneratedCoverLetter[]> {
    return dbInvoke.ats.listAllGeneratedCoverLetters(user_id);
  }

  async deleteGeneratedResume(id: string): Promise<void> {
    return dbInvoke.ats.deleteGeneratedResume(id);
  }

  async deleteGeneratedCoverLetter(id: string): Promise<void> {
    return dbInvoke.ats.deleteGeneratedCoverLetter(id);
  }

  // ============ Application Operations ============

  async markAsApplied(
    job_id: string,
    resume_id?: string,
    cover_letter_id?: string
  ): Promise<JobApplication> {
    return dbInvoke.ats.markAsApplied(job_id, resume_id, cover_letter_id);
  }

  async listApplications(user_id: string): Promise<JobApplication[]> {
    return dbInvoke.ats.listApplications(user_id);
  }

  async getApplicationByJob(job_id: string): Promise<JobApplication | null> {
    return dbInvoke.ats.getApplicationByJob(job_id);
  }

  // ============ Interview Operations ============

  async createInterviewSession(
    session_type: string,
    job_title?: string,
    company?: string,
    job_id?: string,
    job_description?: string,
    experience_level?: string,
    personality?: string,
    resume_context?: string
  ): Promise<InterviewSession> {
    return dbInvoke.interview.create(
      session_type,
      job_title,
      company,
      job_id,
      job_description,
      experience_level,
      personality,
      resume_context
    );
  }

  async getInterviewSession(id: string): Promise<InterviewSession | null> {
    return dbInvoke.interview.get(id);
  }

  async listInterviewSessions(): Promise<InterviewSession[]> {
    return dbInvoke.interview.listAll();
  }

  async updateInterviewScore(
    id: string,
    score: number,
    feedback: string,
    duration_seconds: number
  ): Promise<void> {
    return dbInvoke.interview.updateScore(id, score, feedback, duration_seconds);
  }

  async deleteInterviewSession(id: string): Promise<void> {
    return dbInvoke.interview.delete(id);
  }
}

export const db = new DatabaseService();
