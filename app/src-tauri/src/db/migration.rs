use rusqlite::Connection;
use crate::db::connection::{DbPool, get_connection};
use crate::db::error::{DbError, DbResult};

#[derive(Debug, Clone)]
pub struct Migration {
    pub name: String,
    pub sql: String,
}

pub struct MigrationRunner;

impl MigrationRunner {
    /*
        CREATE MIGRATIONS TABLE
    */
    pub fn init_migrations_table(
        conn: &Connection,
    ) -> DbResult<()> {
        conn.execute(
            "
            CREATE TABLE IF NOT EXISTS _migrations (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                executed_at TIMESTAMP NOT NULL
            );
            ",
            [],
        )?;

        Ok(())
    }

    /*
        GET EXECUTED MIGRATIONS
    */
    pub fn get_executed_migrations(
        conn: &Connection,
    ) -> DbResult<Vec<String>> {
        let mut stmt = conn.prepare(
            "
            SELECT name
            FROM _migrations
            ORDER BY id
            ",
        )?;

        let migrations = stmt
            .query_map([], |row| {
                row.get(0)
            })?
            .collect::<Result<
                Vec<String>,
                _,
            >>()?;

        Ok(migrations)
    }

    /*
        RUN MIGRATIONS
    */
    pub fn run_migrations_sync(
        conn: &mut Connection,
        migrations: Vec<Migration>,
    ) -> DbResult<()> {
        Self::init_migrations_table(
            conn,
        )?;

        for migration in migrations {
            let already_run: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM _migrations WHERE name = ?)",
                [&migration.name],
                |row| row.get(0),
            )?;

            if !already_run {
                log::info!(
                    "Running migration: {}",
                    migration.name
                );

                let tx = conn
                    .transaction()
                    .map_err(|e| {
                        DbError::QueryError(
                            format!(
                                "Failed to start transaction: {}",
                                e
                            ),
                        )
                    })?;

                match tx.execute_batch(
                    &migration.sql,
                ) {
                    Ok(_) => {
                        tx.execute(
                            "INSERT INTO _migrations (name, executed_at) VALUES (?, datetime('now'))",
                            [&migration.name],
                        ).map_err(|e| DbError::QueryError(format!("Failed to record migration: {}", e)))?;
                        
                        tx.commit().map_err(
                            |e| {
                                DbError::QueryError(
                                    format!(
                                        "Failed to commit migration: {}",
                                        e
                                    ),
                                )
                            },
                        )?;
                        log::info!("Migration {} completed successfully", migration.name);
                    }
                    Err(e) => {
                        log::error!("Migration {} failed: {}", migration.name, e);
                        tx.rollback().ok();
                        return Err(
                            DbError::QueryError(
                                format!(
                                    "Migration {} failed: {}",
                                    migration.name,
                                    e
                                ),
                            )
                        );
                    }
                }
            } else {
                log::debug!("Migration {} already run", migration.name);
            }
        }

        Ok(())
    }

    /*
        ASYNC POOL WRAPPER
    */
    pub async fn run_migrations(
        pool: &DbPool,
        migrations: Vec<Migration>,
    ) -> DbResult<()> {
        let conn =
            get_connection(pool).await?;

        conn.interact(move |conn| {
            Self::run_migrations_sync(
                conn,
                migrations,
            )
        })
        .await??;

        Ok(())
    }

    /*
        RESET DATABASE
    */
    pub fn reset_database_sync(
        conn: &Connection,
    ) -> DbResult<()> {
        log::warn!(
            "Resetting database..."
        );

        let mut stmt = conn.prepare(
            "
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            AND name NOT LIKE 'sqlite_%'
            ",
        )?;

        let tables: Vec<String> = stmt
            .query_map([], |row| {
                row.get(0)
            })?
            .collect::<Result<
                Vec<_>,
                _,
            >>()?;

        for table in tables {
            conn.execute(
                &format!(
                    "DROP TABLE IF EXISTS {}",
                    table
                ),
                [],
            )?;
        }

        conn.execute(
            "DELETE FROM _migrations",
            [],
        )?;

        log::info!(
            "Database reset completed"
        );

        Ok(())
    }

    /*
        RESET DATABASE ASYNC
    */
    pub async fn reset_database(
        pool: &DbPool,
    ) -> DbResult<()> {
        let conn =
            get_connection(pool).await?;

        conn.interact(move |conn| {
            Self::reset_database_sync(
                conn,
            )
        })
        .await??;

        Ok(())
    }
}

/*
    MIGRATION MACRO
*/
#[macro_export]
macro_rules! migration {
    ($name:expr, $sql:expr) => {
        $crate::db::migration::Migration {
            name: $name.to_string(),
            sql: $sql.to_string(),
        }
    };
}