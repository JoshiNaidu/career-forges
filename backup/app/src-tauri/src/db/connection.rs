use rusqlite::{
    OptionalExtension,
    Params,
};

use std::path::Path;

use deadpool_sqlite::{
    Config,
    Pool,
    Runtime,
};

use crate::db::error::{
    DbError,
    DbResult,
};

pub type DbPool = Pool;

/*
    INIT DATABASE
*/
pub async fn init_db(
    db_path: &Path,
) -> DbResult<DbPool> {
    log::info!(
        "Initializing database at: {:?}",
        db_path
    );

    /*
        Ensure parent directory exists
    */
    if let Some(parent) =
        db_path.parent()
    {
        std::fs::create_dir_all(
            parent,
        )?;
    }

    /*
        Create pool config
    */
    let cfg = Config::new(
        db_path.to_path_buf(),
    );

    /*
        Create pool
    */
    let pool = cfg
        .create_pool(Runtime::Tokio1)
        .map_err(|e| {
            DbError::ConnectionError(
                format!(
                    "Failed to create pool: {}",
                    e
                ),
            )
        })?;

    /*
        Initialize SQLite pragmas
    */
    {
        let pool_clone = pool.clone();

        let conn = pool_clone
            .get()
            .await
            .map_err(|e| {
                DbError::ConnectionError(
                    e.to_string(),
                )
            })?;

        conn.interact(|conn| {
            conn.execute_batch(
                "
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA foreign_keys = ON;
                ",
            )
        })
        .await
        .map_err(|e| {
            DbError::QueryError(
                format!(
                    "Pragma interact failed: {}",
                    e
                ),
            )
        })?
        .map_err(
            DbError::SqliteError,
        )?;
    }

    log::info!(
        "Database pool initialized"
    );

    Ok(pool)
}

/*
    GET CONNECTION
*/
pub async fn get_connection(
    pool: &DbPool,
) -> DbResult<
    deadpool_sqlite::Object,
> {
    pool.get().await.map_err(|e| {
        DbError::ConnectionError(
            format!(
                "Failed to get DB connection: {}",
                e
            ),
        )
    })
}

/*
    QUERY SINGLE ROW
*/
pub async fn query_row<T, P, F>(
    pool: &DbPool,
    query: &str,
    params: P,
    mapper: F,
) -> DbResult<Option<T>>
where
    P: Params + Send + 'static,
    T: Send + 'static,
    F: FnOnce(
            &rusqlite::Row,
        ) -> rusqlite::Result<T>
        + Send
        + 'static,
{
    let conn =
        get_connection(pool).await?;

    let query =
        query.to_string();

    conn.interact(move |conn| {
        let mut stmt =
            conn.prepare(&query)?;

        let result = stmt
            .query_row(params, mapper)
            .optional()?;

        Ok(result)
    })
    .await
    .map_err(|e| {
        DbError::QueryError(
            format!(
                "Query interact failed: {}",
                e
            ),
        )
    })?
}

/*
    QUERY MULTIPLE ROWS
*/
pub async fn query_rows<T, P, F>(
    pool: &DbPool,
    query: &str,
    params: P,
    mapper: F,
) -> DbResult<Vec<T>>
where
    P: Params + Send + 'static,
    T: Send + 'static,
    F: Fn(&rusqlite::Row) -> rusqlite::Result<T> + Send + 'static,
{
    let conn = get_connection(pool).await?;
    let query = query.to_string();

    conn.interact(move |conn| {
        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params, mapper)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    })
    .await
    .map_err(|e| {
        DbError::QueryError(format!("Query rows interact failed: {}", e))
    })?
    .map_err(DbError::SqliteError)
}

/*
    EXECUTE
*/
pub async fn execute(
    pool: &DbPool,
    query: &str,
) -> DbResult<usize> {
    let conn =
        get_connection(pool).await?;

    let query =
        query.to_string();

    conn.interact(move |conn| {
        conn.execute(&query, [])
    })
    .await
    .map_err(|e| {
        DbError::QueryError(
            format!(
                "Execute interact failed: {}",
                e
            ),
        )
    })?
    .map_err(DbError::SqliteError)
}

/*
    EXECUTE WITH PARAMS
*/
pub async fn execute_with_params<P>(
    pool: &DbPool,
    query: &str,
    params: P,
) -> DbResult<usize>
where
    P: Params + Send + 'static,
{
    let conn =
        get_connection(pool).await?;

    let query =
        query.to_string();

    conn.interact(move |conn| {
        conn.execute(&query, params)
    })
    .await
    .map_err(|e| {
        DbError::QueryError(
            format!(
                "Execute interact failed: {}",
                e
            ),
        )
    })?
    .map_err(DbError::SqliteError)
}