use crate::response::*;
use crate::util;
use crate::util::*;
use rocket::http::{ContentType, Cookie, Cookies};
use rocket::response::{Content, NamedFile};
use rocket::Data;
use rocket_contrib::json::Json;
use serde::Deserialize;
use std::io::{self, Read};
use std::path::{Path, PathBuf};

#[derive(Deserialize)]
pub struct Login {
    username: String,
    password: String,
}

#[get("/")]
pub fn index() -> io::Result<NamedFile> {
    NamedFile::open("app/build/index.html")
}

#[get("/<file..>")]
pub fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("app/build").join(file)).ok()
}

#[post("/signup", data = "<login>")]
pub fn signup(login: Json<Login>, database: Database) -> Response {
    let user_exists = exists!(
        database,
        "SELECT * FROM users WHERE (username=?1)",
        &login.username
    );

    if user_exists {
        return err!(Err::UserAlreadyExists);
    }

    let password_hash = bcrypt::hash(&login.password, bcrypt::DEFAULT_COST).unwrap();

    execute!(
        database,
        "INSERT INTO users (username, password_hash, avatar) VALUES (?1, ?2, ?3)",
        &login.username,
        &password_hash,
        &DEFAULT_AVATAR.to_vec()
    );
    ok!()
}

#[post("/login", data = "<login>")]
pub fn login(login: Json<Login>, database: Database, mut cookies: Cookies) -> Response {
    let result: Result<(i64, String), _> = query_row!(
        database,
        |row| (row.get(0), row.get(1)),
        "SELECT ROWID, password_hash FROM users WHERE username=?1",
        &login.username
    );

    let (user_id, password_hash) = result.map_err(|_| Err::UserDoesNotExist)?;

    let hash_match = bcrypt::verify(&login.password, &password_hash).unwrap();
    if !hash_match {
        return err!(Err::UserDoesNotExist);
    }

    cookies.add_private(Cookie::new("user_id", user_id.to_string()));
    ok!()
}

#[post("/set_avatar", format = "image/png", data = "<png>")]
pub fn set_avatar(png: Data, database: Database, mut cookies: Cookies) -> Response {
    let mut buf = Vec::new();
    png.open()
        .read_to_end(&mut buf)
        .expect("bug: failed to read PNG");

    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    execute!(
        database,
        "UPDATE users SET avatar=?1 WHERE ROWID=?2",
        &buf,
        &user_id
    );
    ok!()
}

#[post("/get_avatar", data = "<username>")]
pub fn get_avatar(username: Json<&str>, database: Database) -> Content<Vec<u8>> {
    let avatar = query_row!(
        database,
        |row| row.get(0),
        "SELECT avatar FROM users WHERE username=?1",
        &username.into_inner()
    );

    let avatar = avatar.unwrap_or_else(|_| DEFAULT_AVATAR.to_vec());
    Content(ContentType::PNG, avatar)
}

#[post("/add_group", data = "<name>")]
pub fn add_group(name: Json<&str>, database: Database, mut cookies: Cookies) -> Response {
    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    execute!(
        database,
        "INSERT INTO groups (name, admin_id) VALUES (?1, ?2)",
        &name.into_inner(),
        &user_id
    );
    ok!()
}