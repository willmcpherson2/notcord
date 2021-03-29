#![feature(proc_macro_hygiene, decl_macro)]
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

use rocket::http::Cookie;
use rocket::http::Cookies;
use rocket::response::NamedFile;
use rocket_contrib::databases::rusqlite;
use rocket_contrib::json::Json;
use serde::{Deserialize, Serialize};
use std::io;
use std::path::{Path, PathBuf};

#[database("database")]
struct Database(rusqlite::Connection);

#[derive(Deserialize)]
struct Login {
    username: String,
    password_hash: String,
}

#[derive(Serialize)]
enum ErrorCode {
    Ok,
    UserAlreadyExists,
    UserDoesNotExist,
}

#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open("app/build/index.html")
}

#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("app/build").join(file)).ok()
}

#[post("/signup", data = "<login>")]
fn signup(login: Json<Login>, database: Database) -> Json<ErrorCode> {
    if get_login_from_database(&login, &database).is_some() {
        Json(ErrorCode::UserAlreadyExists)
    } else {
        database
            .execute(
                "INSERT INTO User (username, password_hash) VALUES (?1, ?2)",
                &[&login.username, &login.password_hash],
            )
            .expect("bug: failed to insert user");
        Json(ErrorCode::Ok)
    }
}

#[post("/login", data = "<login>")]
fn login(login: Json<Login>, database: Database, mut cookies: Cookies) -> Json<ErrorCode> {
    if let Some(login) = get_login_from_database(&login, &database) {
        cookies.add_private(Cookie::new("username", login.username));
        Json(ErrorCode::Ok)
    } else {
        Json(ErrorCode::UserDoesNotExist)
    }
}

fn get_login_from_database(login: &Login, database: &Database) -> Option<Login> {
    database
        .query_row(
            "SELECT * FROM User WHERE username=?1 AND password_hash=?2",
            &[&login.username, &login.password_hash],
            |row| Login {
                username: row.get(0),
                password_hash: row.get(1),
            },
        )
        .ok()
}

fn init_database_file() {
    rusqlite::Connection::open("database.db")
        .expect("bug: failed to open/create database file")
        .execute(
            "CREATE TABLE IF NOT EXISTS User (username TEXT NOT NULL, password_hash TEXT NOT NULL)",
            &[],
        )
        .expect("bug: failed to create sqlite table");
}

fn init_rocket() -> rocket::Rocket{
    rocket::ignite()
        .attach(Database::fairing())
        .attach(rocket_cors::CorsOptions::default().to_cors().unwrap())
        .mount("/", routes![index, files, signup, login])
}

fn main() {
    init_database_file();
    init_rocket().launch();
}

#[cfg(test)]
mod tests_main;