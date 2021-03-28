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
    let mut statement = database
        .prepare("SELECT * FROM User WHERE username=?1")
        .expect("bug: failed to prepare statement");
    let user_exists = statement
        .exists(&[&login.username])
        .expect("bug: failed to query database");

    if user_exists {
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
    let mut statement = database
        .prepare("SELECT * FROM User WHERE username=?1 and password_hash=?2")
        .expect("bug: failed to prepare statement");
    let login_exists = statement
        .exists(&[&login.username, &login.password_hash])
        .expect("bug: failed to query database");

    if login_exists {
        cookies.add_private(Cookie::new("username", login.username.clone()));
        Json(ErrorCode::Ok)
    } else {
        Json(ErrorCode::UserDoesNotExist)
    }
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

fn main() {
    init_database_file();

    rocket::ignite()
        .attach(Database::fairing())
        .attach(rocket_cors::CorsOptions::default().to_cors().unwrap())
        .mount("/", routes![index, files, signup, login])
        .launch();
}

#[cfg(test)]
mod tests_main;

