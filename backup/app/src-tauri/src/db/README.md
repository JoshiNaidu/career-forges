# CareerForges SQLite Database Architecture

## Overview

This is a production-grade SQLite database architecture designed for offline-first operation in a Tauri + React + TypeScript desktop application. The system uses a migration-based schema management approach with a repository pattern for data access.

## Technology Stack

- **Database**: SQLite with WAL (Write-Ahead Logging) mode
- **Rust ORM**: rusqlite (synchronous, no async overhead for desktop)
- **Connection Pool**: Arc<Mutex<Connection>> (single connection with sync access)
- **Migrations**: Version-controlled SQL files with execution tracking
- **Logging**: env_logger for diagnostic output

## Architecture

```
src-tauri/src/
├── db/
│   ├── mod.rs                  # Main module exports
│   ├── error.rs                # Error handling types
│   ├── connection.rs           # Connection pool & helpers
│   ├── migration.rs            # Migration runner
│   ├── schema.rs               # Schema definitions & migrations
│   └── repositories/           # Data access layer
│       ├── mod.rs
│       ├── user_repository.rs
│       ├── session_repository.rs
│       └── message_repository.rs
└── lib.rs                      # App initialization

app/src/
└── lib/db/
    ├── models.ts               # TypeScript entity models
    ├── service.ts              # Frontend service layer
    └── index.ts                # Module exports
```

## Key Components

### 1. Error Handling (`error.rs`)

Custom `DbError` enum with specific error variants:
- `SqliteError` - Low-level SQLite errors
- `MigrationError` - Migration execution failures
- `ConnectionError` - Connection pool issues
- `TransactionError` - Transaction failures
- `QueryError` - Query execution problems

All operations return `DbResult<T>` for unified error handling.

### 2. Connection Management (`connection.rs`)

- **Connection Pool**: `Arc<Mutex<Connection>>` provides thread-safe access
- **Pragmas**: WAL mode, foreign keys enabled, optimized cache
- **Helper Functions**:
  - `init_db()` - Initialize connection with optimizations
  - `query_row()` - Single row queries with mappers
  - `query_rows()` - Multiple row queries
  - `execute()` - DML operations (INSERT/UPDATE/DELETE)
  - `transaction()` - ACID transactions with rollback

### 3. Migration System (`migration.rs`)

- **Automatic Tracking**: `_migrations` table tracks executed migrations
- **Features**:
  - Run only pending migrations
  - Automatic rollback on failure
  - Timestamp tracking of execution
  - Idempotent execution (safe to run multiple times)

### 4. Schema Definitions (`schema.rs`)

Nine versioned migrations covering:
1. **users** - User accounts and profiles
2. **sessions** - Chat conversations
3. **messages** - Chat messages with streaming support
4. **resumes** - Uploaded resume documents
5. **jobs** - Job listings and tracking
6. **preferences** - User settings
7. **app_config** - Application configuration
8. **interview_sessions** - Interview practice records
9. **activity_logs** - Audit trail

### 5. Repository Pattern (`repositories/`)

Each entity has a dedicated repository:

```rust
impl UserRepository {
    pub fn create() -> DbResult<User>
    pub fn get_by_id() -> DbResult<Option<User>>
    pub fn list_installed() -> DbResult<Vec<User>>
    pub fn update() -> DbResult<User>
    pub fn delete() -> DbResult<()>
}
```

Benefits:
- Encapsulated data access logic
- Reusable query patterns
- Type-safe operations
- Easy to extend

### 6. TypeScript Models (`models.ts`)

Auto-synced entity interfaces:
```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}
```

### 7. Frontend Service (`service.ts`)

Singleton service for frontend access:
```typescript
import { db } from '@/lib/db';

// User operations
await db.createUser('user@example.com', 'John');
const user = await db.getUser(userId);

// Session operations
const session = await db.createSession(userId, 'My Chat', 'qwen', 'career');

// Message operations
await db.createMessage(sessionId, 'user', 'Hello!');
const messages = await db.listSessionMessages(sessionId);
```

## Usage Patterns

### Basic CRUD

```rust
// Create
let user = UserRepository::create(&pool, "test@example.com", Some("John"))?;

// Read
let user = UserRepository::get_by_id(&pool, &user.id)?;

// Update
let updated = UserRepository::update(&pool, &user.id, Some("Jane"), None)?;

// Delete (soft delete)
UserRepository::delete(&pool, &user.id)?;
```

### Queries

```rust
// Single row
let user = query_row(&pool, "SELECT ...", |row| {
    Ok(User { ... })
})?;

// Multiple rows
let users = query_rows(&pool, "SELECT ... ORDER BY created_at", mapper)?;
```

### Transactions

```rust
transaction(&pool, |conn| {
    // Operations inside transaction
    conn.execute("INSERT INTO ...", [])?;
    conn.execute("UPDATE ...", [])?;
    
    // Automatic rollback on error, commit on success
    Ok(result)
})?;
```

### Frontend Usage

```typescript
// In React component
const [sessions, setSessions] = useState<ChatSession[]>([]);

useEffect(() => {
  db.listUserSessions(userId).then(setSessions);
}, [userId]);

// Create new session
const newSession = await db.createSession(
  userId,
  'Interview Practice',
  'mistral:7b',
  'interview_practice'
);

// Log activity
await db.logActivity('session_created', 'session', newSession.id, userId);
```

## Database Initialization Flow

```
App Startup
    ↓
logger init
    ↓
database init (create/open)
    ↓
connection pool creation
    ↓
run migrations
    ↓
app ready
    ↓
serve IPC endpoints
```

### In `lib.rs`:

```rust
let db_pool = init_db(&db_path)?;
let migrations = get_migrations();
MigrationRunner::run_migrations(&conn, migrations)?;

tauri::Builder::default()
    .manage(db_pool)  // Make pool available to commands
    .invoke_handler(...)
    .run(...)
```

## Performance Optimizations

### SQLite Pragmas

```sql
PRAGMA foreign_keys = ON;        -- Enable referential integrity
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging
PRAGMA synchronous = NORMAL;      -- Balanced durability
PRAGMA cache_size = -64000;       -- 64MB cache
PRAGMA temp_store = MEMORY;       -- In-memory temp tables
```

### Indexing Strategy

- Primary keys on all tables
- Foreign key indices for joins
- Indices on frequently queried columns (user_id, status)
- Composite indices where appropriate

### Query Optimization

- Soft deletes with `deleted_at IS NULL` filtering
- Pagination support (LIMIT/OFFSET)
- Efficient token counting (SUM aggregation)

## Extending the Database

### Adding a New Entity

1. **Create Migration** in `schema.rs`:
```rust
migration!(
    "010_my_table",
    "CREATE TABLE my_table (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ...
        FOREIGN KEY (user_id) REFERENCES users(id)
    );"
)
```

2. **Create Repository** in `repositories/my_repository.rs`:
```rust
pub struct MyRepository;
impl MyRepository {
    pub fn create(...) -> DbResult<MyEntity> { ... }
    pub fn get_by_id(...) -> DbResult<Option<MyEntity>> { ... }
}
```

3. **Add TypeScript Model** in `models.ts`:
```typescript
export interface MyEntity {
    id: string;
    // ... properties
}
```

4. **Update Frontend Service** in `service.ts`:
```typescript
async createMyEntity(...): Promise<MyEntity> {
    return invoke('db_create_my_entity', { ... });
}
```

## Testing

### Local Testing

```bash
# Run Tauri app with logging
RUST_LOG=debug cargo tauri dev

# Check database file
ls -lh ~/.local/share/CareerForges/careerforges.db
```

### Reset Database (Development Only)

```rust
// In debug builds only
if cfg!(debug_assertions) {
    MigrationRunner::reset_database(&conn)?;
}
```

## Monitoring & Debugging

### Enable Detailed Logging

```bash
export RUST_LOG=debug,careerforges=debug
cargo tauri dev
```

### Check Migration Status

```sql
SELECT name, executed_at FROM _migrations ORDER BY id;
```

### Database Health

```typescript
const size = await db.getDatabaseSize();  // Bytes
const isHealthy = await db.ping();        // Health check
```

## Backup & Recovery

### Automatic Backups (Optional)

Add to app startup:
```rust
let backup_path = app_data_dir.join("backups").join(format!("careerforges-{}.db", Utc::now().format("%Y%m%d-%H%M%S")));
std::fs::copy(&db_path, &backup_path)?;
```

### Manual Restore

```bash
cp ~/.local/share/CareerForges/careerforges.db.backup ~/.local/share/CareerForges/careerforges.db
```

## Production Checklist

- [x] Migration system implemented
- [x] Error handling with custom error types
- [x] Connection pooling with pragmas
- [x] Soft deletes for data integrity
- [x] Transaction support for ACID operations
- [x] Comprehensive indices for performance
- [x] Foreign key constraints enabled
- [x] Logging integration
- [x] TypeScript model sync
- [x] Frontend service layer
- [ ] Add automated backups
- [ ] Add database encryption (SEE)
- [ ] Add compression for old records
- [ ] Add query profiling

## Common Issues

### "Database is locked"

**Cause**: Multiple threads trying to write simultaneously
**Solution**: Use `transaction()` for multiple operations

### Migrations not running

**Cause**: `_migrations` table corruption
**Solution**: Check logs, manually verify schema

### Type mismatches in queries

**Cause**: Schema changed but code didn't update
**Solution**: Use typed repositories, regenerate models

## Resources

- [rusqlite docs](https://docs.rs/rusqlite/)
- [SQLite docs](https://www.sqlite.org/docs.html)
- [Tauri API reference](https://tauri.app/docs/)
