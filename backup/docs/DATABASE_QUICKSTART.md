# Database Quick Start Guide

## Installation Complete ✅

Your CareerForges app now has a production-ready SQLite database! Here's how to use it.

## Quick Start

### 1. Access from React Component

```typescript
import { db, type ChatSession } from '@/lib/db';

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    // Load user's chat sessions
    db.listUserSessions(userId).then(setSessions);
  }, [userId]);

  return (
    <div>
      {sessions.map(session => (
        <div key={session.id}>{session.title}</div>
      ))}
    </div>
  );
}
```

### 2. Create and Store Data

```typescript
// Create a user
const user = await db.createUser('user@example.com', 'John Doe');

// Create a chat session
const session = await db.createSession(
  user.id,
  'Interview Practice',
  'mistral:7b',
  'interview_practice'
);

// Add messages
await db.createMessage(session.id, 'user', 'Tell me about React');
await db.createMessage(
  session.id,
  'assistant',
  'React is a JavaScript library for building UIs...',
  'mistral:7b'
);

// Retrieve messages
const messages = await db.listSessionMessages(session.id);
```

### 3. Manage Resume Data

```typescript
// Upload resume
const resume = await db.createResume(
  userId,
  'John_Doe_Resume.pdf',
  '/home/user/documents/resume.pdf',
  245123,  // file size
  'application/pdf'
);

// Set as default
await db.setDefaultResume(resume.id);

// Get all resumes
const resumes = await db.listUserResumes(userId);
```

### 4. Track Jobs

```typescript
// Save a job
const job = await db.createJob(
  userId,
  'Senior React Developer',
  'Tech Corp',
  'https://example.com/job/123'
);

// Update status as you progress
await db.updateJobStatus(job.id, 'applied');
await db.updateJobStatus(job.id, 'interview');

// View by status
const applied = await db.listUserJobs(userId, 'applied');
const interviews = await db.listUserJobs(userId, 'interview');
```

### 5. Store User Preferences

```typescript
// Save a preference
await db.setPreference(userId, 'preferred_model', 'mistral:7b');
await db.setPreference(userId, 'interview_difficulty', 'hard');

// Load preference
const pref = await db.getPreference(userId, 'preferred_model');
```

### 6. Activity Logging

```typescript
// Log important actions
await db.logActivity(
  'session_created',
  'session',
  session.id,
  userId
);

await db.logActivity(
  'resume_uploaded',
  'resume',
  resume.id,
  userId,
  JSON.stringify({
    filename: resume.filename,
    size: resume.file_size
  })
);
```

## Common Workflows

### Chat with Message History

```typescript
// 1. Create session
const session = await db.createSession(
  userId,
  'Career Advice',
  'qwen2.5:3b',
  'career'
);

// 2. Store conversation
for (const message of conversationArray) {
  await db.createMessage(
    session.id,
    message.role,
    message.content,
    'qwen2.5:3b',
    message.tokens
  );
}

// 3. Later: Load conversation
const messages = await db.listSessionMessages(session.id);
// messages are ordered chronologically

// 4. Track tokens used
const totalTokens = await db.countSessionTokens(session.id);
```

### Interview Practice Session

```typescript
// 1. Create interview session
const interview = await db.createInterviewSession(
  userId,
  'technical',
  'Senior Full Stack Engineer',
  'Google'
);

// 2. Store interview messages
await db.createMessage(interview.id, 'assistant', 'Tell me about your experience...');
await db.createMessage(interview.id, 'user', 'I worked on...');

// 3. Score and feedback
await db.updateInterviewScore(interview.id, 8.5, 'Great answers, could improve follow-up questions');

// 4. Review past interviews
const interviews = await db.listUserInterviews(userId, 'technical');
```

### Resume Management

```typescript
// 1. Store multiple resumes
const res1 = await db.createResume(userId, 'resume.pdf', 'path1');
const res2 = await db.createResume(userId, 'resume_v2.pdf', 'path2');

// 2. Set one as default
await db.setDefaultResume(res2.id);

// 3. Use in job applications
const jobApplication = {
  resume_id: res2.id,
  job_id: job.id,
  cover_letter: '...'
};
```

## Error Handling

```typescript
try {
  const user = await db.createUser('test@example.com');
} catch (error) {
  if (error instanceof DbError) {
    if (error.message.includes('UNIQUE constraint')) {
      console.error('Email already exists');
    } else if (error.message.includes('database locked')) {
      console.error('Database is busy, retry');
    }
  }
}
```

## Database Files

- **Location**: `~/.local/share/CareerForges/careerforges.db`
- **Backup**: Automatically created in `~/.local/share/CareerForges/backups/`
- **Size**: Starts ~100KB, grows with usage

## Enable Logging

For debugging, enable detailed logs:

```bash
export RUST_LOG=debug
cargo tauri dev
```

You'll see:
- ✓ Database initialization
- ✓ Migrations running
- ✓ All queries executed
- ✓ Errors with context

## Available Repositories

All repositories follow the same pattern:

### UserRepository
```typescript
db.createUser(email, name)
db.getUser(id)
db.getUserByEmail(email)
db.listUsers()
db.updateUser(id, name, avatar_url)
db.deleteUser(id)
```

### SessionRepository
```typescript
db.createSession(user_id, title, model, mode)
db.getSession(id)
db.listUserSessions(user_id)
db.updateSessionTitle(id, title)
db.deleteSession(id)
db.countUserSessions(user_id)
```

### MessageRepository
```typescript
db.createMessage(session_id, role, content, model, tokens_used)
db.getMessage(id)
db.listSessionMessages(session_id)
db.listRecentMessages(session_id, limit)
db.deleteMessage(id)
db.deleteSessionMessages(session_id)
db.countSessionTokens(session_id)
```

## Performance Tips

1. **Use Transactions** for multiple writes:
   ```typescript
   // Good: Single transaction
   await db.transaction(async () => {
     for (const msg of messages) await db.createMessage(...);
   });
   ```

2. **Load Recent Data First**:
   ```typescript
   // Get last 50 messages (faster)
   const recent = await db.listRecentMessages(sessionId, 50);
   ```

3. **Batch Log Activities**:
   ```typescript
   // Bundle related logs
   await db.logActivity('batch_import', 'job', jobId, userId);
   ```

4. **Use Counts Sparingly**:
   ```typescript
   // Cache this value
   const count = await db.countSessionTokens(sessionId);
   ```

## Next Steps

1. ✅ Database initialized
2. 🔗 Connect to your React components
3. 📊 Populate with user data
4. 🔍 Monitor with logging
5. 💾 Set up automated backups

## Need Help?

- 📖 Full docs: `docs/DATABASE_ARCHITECTURE.md`
- 🛠️ Technical details: `app/src-tauri/src/db/README.md`
- 💬 TypeScript models: `app/src/lib/db/models.ts`
- 🔧 Frontend service: `app/src/lib/db/service.ts`

---

Your database is production-ready! 🚀
