#![feature(proc_macro_hygiene, decl_macro)]
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

use rocket::response::NamedFile;
use rocket_contrib::databases::rusqlite;
use rocket_contrib::json::Json;
use serde::Deserialize;
use std::io;
use std::path::{Path, PathBuf};

#[database("database")]
struct Database(rusqlite::Connection);

#[derive(Deserialize)]
struct Signup {
    username: String,
    password_hash: String,
}

#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open("app/build/index.html")
}

#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("app/build").join(file)).ok()
}

#[post("/signup", data = "<signup>")]
fn signup(signup: Json<Signup>, database: Database) {
    // TODO: prevent duplicate usernames
    database
        .execute(
            "INSERT INTO User (username, password_hash) VALUES (?1, ?2)",
            &[&signup.username, &signup.password_hash],
        )
        .expect("bug: failed to insert user");
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
        .mount("/", routes![index, files, signup])
        .launch();
}
