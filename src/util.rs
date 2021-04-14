use rocket_contrib::databases::rusqlite;
use serde::Serialize;

macro_rules! execute {
    ($database:expr, $query:expr, $($params:expr),*) => {
        $database
            .execute($query, &[$($params),*])
            .unwrap()
    }
}

macro_rules! query_row {
    ($database:expr, $closure:expr, $query:expr, $($params:expr),*) => {
        $database
            .prepare($query)
            .unwrap()
            .query_row(&[$($params)*,], $closure)
    }
}

macro_rules! exists {
    ($database:expr, $query:expr, $($params:expr),*) => {
        $database
            .prepare($query)
            .unwrap()
            .exists(&[$($params)*,])
            .unwrap()
    }
}

#[database("database")]
pub struct Database(rusqlite::Connection);

#[derive(Serialize)]
pub enum ErrorCode {
    Ok,
    UserAlreadyExists,
    UserDoesNotExist,
    NotLoggedIn,
}

pub static DEFAULT_AVATAR: &[u8; 1597] = include_bytes!("../default-avatar.png");

pub fn init_database_file(filename: &str) {
    rusqlite::Connection::open(filename)
        .expect("bug: failed to open/create database file")
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                avatar BLOB NOT NULL
            );
            CREATE TABLE IF NOT EXISTS groups (
                name TEXT NOT NULL,
                admin_id INTEGER NOT NULL,
                FOREIGN KEY (admin_id) REFERENCES users (ROWID) ON DELETE CASCADE
            )",
        )
        .expect("bug: failed to create sqlite tables");
}

pub fn init_rocket(rocket: rocket::Rocket) -> rocket::Rocket {
    use crate::routes::*;

    rocket
        .attach(Database::fairing())
        .attach(rocket_cors::CorsOptions::default().to_cors().unwrap())
        .mount(
            "/",
            routes![index, files, signup, login, set_avatar, get_avatar, add_group],
        )
}
