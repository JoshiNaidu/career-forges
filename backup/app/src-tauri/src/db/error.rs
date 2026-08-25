use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    /*
        SQLITE
    */
    #[error("SQLite error: {0}")]
    SqliteError(
        #[from] rusqlite::Error,
    ),

    /*
        DEADPOOL POOL
    */
    #[error("Deadpool pool error: {0}")]
    DeadpoolPoolError(
        #[from]
        deadpool_sqlite::PoolError,
    ),

    /*
        DEADPOOL INTERACT
    */
    #[error("Interact error: {0}")]
    InteractError(
        #[from]
        deadpool_sqlite::InteractError,
    ),

    /*
        CONNECTION
    */
    #[error("Connection error: {0}")]
    ConnectionError(String),

    /*
        MIGRATION
    */
    #[error("Migration error: {0}")]
    MigrationError(String),

    /*
        TRANSACTION
    */
    #[error("Transaction error: {0}")]
    TransactionError(String),

    /*
        QUERY
    */
    #[error("Query error: {0}")]
    QueryError(String),

    /*
        SERIALIZATION
    */
    #[error("Serialization error: {0}")]
    SerializationError(
        #[from] serde_json::Error,
    ),

    /*
        UUID
    */
    #[error("UUID error: {0}")]
    UuidError(String),

    /*
        IO
    */
    #[error("IO error: {0}")]
    IoError(
        #[from] std::io::Error,
    ),

    /*
        NOT FOUND
    */
    #[error("Not found")]
    NotFound,

    /*
        UNKNOWN
    */
    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type DbResult<T> =
    Result<T, DbError>;