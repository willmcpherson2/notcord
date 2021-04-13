#![feature(proc_macro_hygiene, decl_macro)]
#![warn(clippy::pedantic, clippy::nursery)]
#![allow(clippy::collapsible_if)]
#![allow(clippy::redundant_else)]
#![allow(clippy::needless_pass_by_value)]
#![allow(clippy::option_if_let_else)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

use rocket::http::ContentType;
use rocket::http::Cookie;
use rocket::http::Cookies;
use rocket::response::Content;
use rocket::response::NamedFile;
use rocket::Data;
use rocket_contrib::databases::rusqlite;
use rocket_contrib::json::Json;
use serde::{Deserialize, Serialize};
use std::io;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::str::FromStr;

#[database("database")]
struct Database(rusqlite::Connection);

#[derive(Deserialize)]
struct Login {
    username: String,
    password: String,
}

#[derive(Serialize)]
enum ErrorCode {
    Ok,
    UserAlreadyExists,
    UserDoesNotExist,
    NotLoggedIn,
}

static DEFAULT_AVATAR: &[u8; 1597] = include_bytes!("../default-avatar.png");

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
        .prepare("SELECT * FROM users WHERE username=?1")
        .expect("bug: failed to prepare statement");
    let user_exists = statement
        .exists(&[&login.username])
        .expect("bug: failed to query database");

    if user_exists {
        Json(ErrorCode::UserAlreadyExists)
    } else {
        let password_hash = bcrypt::hash(&login.password, bcrypt::DEFAULT_COST).unwrap();

        database
            .execute(
                "INSERT INTO users (username, password_hash, avatar) VALUES (?1, ?2, ?3)",
                &[&login.username, &password_hash, &DEFAULT_AVATAR.to_vec()],
            )
            .expect("bug: failed to insert user");
        Json(ErrorCode::Ok)
    }
}

#[post("/login", data = "<login>")]
fn login(login: Json<Login>, database: Database, mut cookies: Cookies) -> Json<ErrorCode> {
    let mut statement = database
        .prepare("SELECT ROWID, password_hash FROM users WHERE username=?1")
        .unwrap();
    let result: Result<(i64, String), _> =
        statement.query_row(&[&login.username], |row| (row.get(0), row.get(1)));

    if let Ok((user_id, password_hash)) = result {
        let hash_match = bcrypt::verify(&login.password, &password_hash).unwrap();
        if hash_match {
            cookies.add_private(Cookie::new("user_id", user_id.to_string()));
            return Json(ErrorCode::Ok);
        }
    }
    Json(ErrorCode::UserDoesNotExist)
}

#[post("/set_avatar", format = "image/png", data = "<png>")]
fn set_avatar(png: Data, database: Database, mut cookies: Cookies) -> Json<ErrorCode> {
    let mut buf = Vec::new();
    png.open()
        .read_to_end(&mut buf)
        .expect("bug: failed to read PNG");

    if let Some(cookie) = cookies.get_private("user_id") {
        let user_id = i64::from_str(cookie.value()).unwrap();
        database
            .execute(
                "UPDATE users SET avatar=?1 WHERE ROWID=?2",
                &[&buf, &user_id],
            )
            .expect("bug: failed to insert avatar");

        Json(ErrorCode::Ok)
    } else {
        Json(ErrorCode::NotLoggedIn)
    }
}

#[post("/get_avatar", data = "<username>")]
fn get_avatar(username: Json<&str>, database: Database) -> Content<Vec<u8>> {
    let username: &str = &username;

    let mut statement = database
        .prepare("SELECT avatar FROM users WHERE username=?1")
        .unwrap();
    let avatar = statement.query_row(&[&username], |row| row.get(0));

    let avatar = avatar.unwrap_or_else(|_| DEFAULT_AVATAR.to_vec());

    Content(ContentType::PNG, avatar)
}

fn init_database_file(filename: &str) {
    rusqlite::Connection::open(filename)
        .expect("bug: failed to open/create database file")
        .execute(
            "CREATE TABLE IF NOT EXISTS users (
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                avatar BLOB NOT NULL
            )",
            &[],
        )
        .expect("bug: failed to create sqlite table");
}

fn init_rocket(rocket: rocket::Rocket) -> rocket::Rocket {
    rocket
        .attach(Database::fairing())
        .attach(rocket_cors::CorsOptions::default().to_cors().unwrap())
        .mount(
            "/",
            routes![index, files, signup, login, set_avatar, get_avatar],
        )
}

fn main() {
    init_database_file("database.db");
    init_rocket(rocket::ignite()).launch();
}

#[cfg(test)]
mod tests_main;
