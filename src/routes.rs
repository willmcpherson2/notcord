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
pub struct UserGroupChannel {
    username: String,
    group_name: String,
    channel_name: String,
}

#[derive(Deserialize)]
pub struct ChannelAndGroup {
    channel_name: String,
    group_name: String,
}

#[derive(Deserialize)]
pub struct UserAndGroup {
    username: String,
    group_name: String,
}

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
        "SELECT avatar FROM users WHERE username=?1",
        &username.into_inner()
    );

    let avatar = avatar.unwrap_or_else(|_| DEFAULT_AVATAR.to_vec());
    Content(ContentType::PNG, avatar)
}

#[post("/add_group", data = "<name>")]
pub fn add_group(name: Json<&str>, database: Database, mut cookies: Cookies) -> Response {
    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    let name = name.into_inner();

    let group_already_exists = exists!(database, "SELECT * FROM groups WHERE name=?1", &name);
    if group_already_exists {
        return err!(Err::GroupAlreadyExists);
    }

    execute!(database, "INSERT INTO groups (name) VALUES (?1)", &name);

    let group_id: i64 =
        query_row!(database, "SELECT ROWID FROM groups WHERE name=?1", &name).unwrap();

    execute!(
        database,
        "INSERT INTO group_members (user_id, group_id, is_admin) VALUES (?1, ?2, 1)",
        &user_id,
        &group_id
    );
    ok!()
}

#[post("/add_user_to_group", data = "<user_and_group>")]
pub fn add_user_to_group(
    user_and_group: Json<UserAndGroup>,
    database: Database,
    mut cookies: Cookies,
) -> Response {
    let admin_id = util::get_logged_in_user_id(&mut cookies)?;

    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &user_and_group.group_name
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let is_admin = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2 AND is_admin=1",
        &admin_id,
        &group_id
    );
    if !is_admin {
        return err!(Err::PermissionDenied);
    }

    let user_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM users WHERE username=?1",
        &user_and_group.username
    )
    .map_err(|_| Err::UserDoesNotExist)?;

    let user_already_in_group = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2",
        &user_id,
        &group_id
    );
    if user_already_in_group {
        return err!(Err::UserAlreadyInGroup);
    }

    execute!(
        database,
        "INSERT INTO group_members (user_id, group_id, is_admin) VALUES (?1, ?2, 0)",
        &user_id,
        &group_id
    );
    ok!()
}

#[post("/get_users_in_group", data = "<name>")]
pub fn get_users_in_group(name: Json<&str>, database: Database) -> Response {
    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &name.into_inner()
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let usernames: Vec<String> = query_rows!(
        database,
        "SELECT username FROM users INNER JOIN group_members ON users.ROWID = group_members.user_id WHERE group_id=?1",
        &group_id,
        &group_id
    );

    ok!(Ok::Usernames(usernames))
}

#[post("/get_groups_for_user")]
pub fn get_groups_for_user(mut cookies: Cookies, database: Database) -> Response {
    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    let groups: Vec<String> = query_rows!(
        database,
        "SELECT groups.name FROM groups JOIN group_members ON groups.ROWID = group_members.group_id WHERE group_members.user_id = ?1",
        &user_id
    );

    ok!(Ok::Groups(groups))
}

#[post("/add_channel_to_group", data = "<channel_and_group>")]
pub fn add_channel_to_group(
    channel_and_group: Json<ChannelAndGroup>,
    mut cookies: Cookies,
    database: Database,
) -> Response {
    let admin_id = util::get_logged_in_user_id(&mut cookies)?;

    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &channel_and_group.group_name
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let is_admin = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2 AND is_admin=1",
        &admin_id,
        &group_id
    );
    if !is_admin {
        return err!(Err::PermissionDenied);
    }

    let channel_in_group_exists = exists!(
        database,
        "SELECT * FROM channels INNER JOIN group_channels ON channels.ROWID = group_channels.channel_id WHERE name=?1 AND group_id=?2",
        &channel_and_group.channel_name,
        &group_id
    );
    if channel_in_group_exists {
        return err!(Err::ChannelAlreadyExists);
    }

    execute!(
        database,
        "INSERT INTO channels (name) VALUES (?1)",
        &channel_and_group.channel_name
    );

    // Race condition here? Someone could add a channel with the same name.

    let channel_id: i64 = query_row!(
        database,
        "SELECT MAX(ROWID) FROM channels WHERE name=?1",
        &channel_and_group.channel_name
    )
    .unwrap();

    execute!(
        database,
        "INSERT INTO group_channels (channel_id, group_id) VALUES (?1, ?2)",
        &channel_id,
        &group_id
    );
    ok!()
}

#[post("/add_user_to_channel", data = "<user_group_channel>")]
pub fn add_user_to_channel(
    user_group_channel: Json<UserGroupChannel>,
    mut cookies: Cookies,
    database: Database,
) -> Response {
    let admin_id = util::get_logged_in_user_id(&mut cookies)?;

    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &user_group_channel.group_name
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let is_admin = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2 AND is_admin=1",
        &admin_id,
        &group_id
    );
    if !is_admin {
        return err!(Err::PermissionDenied);
    }

    let channel_id: i64 = query_row!(
        database,
        "SELECT channels.ROWID FROM channels INNER JOIN group_channels ON channels.ROWID = group_channels.channel_id WHERE name=?1 AND group_id=?2",
        &user_group_channel.channel_name,
        &group_id
    )
    .map_err(|_| Err::ChannelDoesNotExist)?;

    let user_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM users WHERE username=?1",
        &user_group_channel.username
    )
    .map_err(|_| Err::UserDoesNotExist)?;

    let user_in_group = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2",
        &user_id,
        &group_id
    );
    if !user_in_group {
        return err!(Err::UserNotInGroup);
    }

    let user_in_channel = exists!(
        database,
        "SELECT * FROM channel_members WHERE user_id=?1 AND channel_id=?2",
        &user_id,
        &channel_id
    );
    if user_in_channel {
        return err!(Err::UserAlreadyInChannel);
    }

    execute!(
        database,
        "INSERT INTO channel_members (user_id, channel_id) VALUES (?1, ?2)",
        &user_id,
        &channel_id
    );
    ok!()
}

#[post("/get_users_in_channel", data = "<channel_and_group>")]
pub fn get_users_in_channel(
    channel_and_group: Json<ChannelAndGroup>,
    mut cookies: Cookies,
    database: Database,
) -> Response {
    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &channel_and_group.group_name
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let user_in_group = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2",
        &user_id,
        &group_id
    );
    if !user_in_group {
        return err!(Err::UserNotInGroup);
    }

    let channel_id: i64 = query_row!(
        database,
        "SELECT channels.ROWID FROM channels INNER JOIN group_channels ON channels.ROWID = group_channels.channel_id WHERE name=?1 AND group_id=?2",
        &channel_and_group.channel_name,
        &group_id
    )
    .map_err(|_| Err::ChannelDoesNotExist)?;

    let user_in_channel = exists!(
        database,
        "SELECT * FROM channel_members WHERE user_id=?1 AND channel_id=?2",
        &user_id,
        &channel_id
    );
    if !user_in_channel {
        return err!(Err::UserNotInChannel);
    }

    let usernames: Vec<String> = query_rows!(
        database,
        "SELECT users.username
        FROM users
        JOIN channel_members
        ON users.ROWID = channel_members.user_id
        WHERE channel_id=?1",
        &channel_id
    );

    ok!(Ok::Usernames(usernames))
}

#[post("/get_channels_in_group", data = "<group_name>")]
pub fn get_channels_in_group(
    group_name: Json<&str>,
    mut cookies: Cookies,
    database: Database,
) -> Response {
    let user_id = util::get_logged_in_user_id(&mut cookies)?;

    let group_id: i64 = query_row!(
        database,
        "SELECT ROWID FROM groups WHERE name=?1",
        &group_name.into_inner()
    )
    .map_err(|_| Err::GroupDoesNotExist)?;

    let user_in_group = exists!(
        database,
        "SELECT * FROM group_members WHERE user_id=?1 AND group_id=?2",
        &user_id,
        &group_id
    );
    if !user_in_group {
        return err!(Err::UserNotInGroup);
    }

    let channels: Vec<String> = query_rows!(
        database,
        "SELECT channels.name
        FROM ((channels
        JOIN group_channels
        ON channels.ROWID = group_channels.channel_id)
        JOIN channel_members
        ON channel_members.channel_id = group_channels.channel_id)
        WHERE channel_members.user_id=?1
        AND group_channels.group_id=?2",
        &user_id,
        &group_id
    );

    ok!(Ok::Channels(channels))
}
