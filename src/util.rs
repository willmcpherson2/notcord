use crate::response::*;
use crate::state::State;
use rocket::http::Cookies;
use rocket_contrib::databases::rusqlite;
use std::path::Path;
use std::str::FromStr;

macro_rules! execute {
    ($database:expr, $query:literal, $($params:expr),*) => {
        $database
            .execute($query, &[$($params),*])
            .unwrap()
    }
}

macro_rules! query_row {
    ($database:expr, $closure:expr, $query:literal, $($params:expr),*) => {
        $database
            .prepare($query)
            .unwrap()
            .query_row(&[$($params),*], $closure)
    };
    ($database:expr, $query:expr, $($params:expr),*) => {
        query_row!($database, |row| row.get(0), $query, $($params),*)
    }
}

macro_rules! query_rows {
    ($database:expr, $closure:expr, $query:literal, $($params:expr),*) => {{
        let mut statement = $database
            .prepare($query)
            .unwrap();

        let row_iter = statement
            .query_map(&[$($params),*], $closure)
            .unwrap();

        let mut rows = vec![];
        for row in row_iter {
            rows.push(row.unwrap());
        }
        rows
    }};
    ($database:expr, $query:literal, $($params:expr),*) => {
        query_rows!($database, |row| row.get(0), $query, $($params),*)
    }
}

macro_rules! exists {
    ($database:expr, $query:literal, $($params:expr),*) => {
        $database
            .prepare($query)
            .unwrap()
            .exists(&[$($params),*])
            .unwrap()
    }
}

#[database("database")]
pub struct Database(rusqlite::Connection);

pub static DEFAULT_AVATAR: &[u8; 1597] = include_bytes!("../default-avatar.png");

pub fn init_database_file(path: &Path) {
    rusqlite::Connection::open(path)
        .expect("bug: failed to open/create database file")
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                avatar BLOB NOT NULL
            );
            CREATE TABLE IF NOT EXISTS groups (
                name TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS group_members (
                user_id INTEGER NOT NULL,
                group_id INTEGER NOT NULL,
                is_admin INTEGER NOT NULL,
                PRIMARY KEY (user_id, group_id),
                FOREIGN KEY (user_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups (ROWID) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS group_invites (
                user_id INTEGER NOT NULL,
                group_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, group_id),
                FOREIGN KEY (user_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups (ROWID) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS channels (
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS group_channels (
                channel_id INTEGER NOT NULL,
                group_id INTEGER NOT NULL,
                PRIMARY KEY (channel_id, group_id),
                FOREIGN KEY (channel_id) REFERENCES channels (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups (ROWID) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS channel_members (
                user_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, channel_id),
                FOREIGN KEY (user_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES channels (ROWID) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS messages (
                user_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (ROWID),
                FOREIGN KEY (channel_id) REFERENCES channels (ROWID) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS friendships (
                user1_id INTEGER NOT NULL,
                user2_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL,
                PRIMARY KEY (user1_id, user2_id),
                FOREIGN KEY (user1_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES channels (ROWID) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS friend_requests (
                requester_id INTEGER NOT NULL,
                requestee_id INTEGER NOT NULL,
                PRIMARY KEY (requester_id, requestee_id),
                FOREIGN KEY (requester_id) REFERENCES users (ROWID) ON DELETE CASCADE,
                FOREIGN KEY (requestee_id) REFERENCES users (ROWID) ON DELETE CASCADE
            );",
        )
        .expect("bug: failed to create sqlite tables");
}

pub fn init_rocket(rocket: rocket::Rocket) -> rocket::Rocket {
    use crate::routes::*;

    let cors = rocket_cors::CorsOptions {
        allow_credentials: true,
        ..rocket_cors::CorsOptions::default()
    }
    .to_cors()
    .unwrap();

    rocket
        .attach(Database::fairing())
        .attach(cors)
        .mount(
            "/",
            routes![
                index,
                files,
                signup,
                login,
                logout,
                get_username,
                set_avatar,
                get_avatar,
                is_group_admin,
                add_group,
                invite_user_to_group,
                get_invites,
                process_group_invite,
                remove_user_from_group,
                get_users_in_group,
                add_channel_to_group,
                remove_channel_from_group,
                add_user_to_channel,
                remove_user_from_channel,
                get_groups_for_user,
                get_channels_in_group,
                get_users_in_channel,
                send_message,
                get_messages,
                add_friend_request,
                process_friend_request,
                delete_friendship,
                get_friends_for_user,
                send_friend_message,
                get_friend_messages,
                join_voice,
                get_peers,
                signal,
                get_signals,
                leave_voice,
                get_users_in_voice,
            ],
        )
        .manage(State::new())
}

pub fn get_logged_in_user_id(cookies: &mut Cookies) -> Result<i64, Err> {
    let cookie = cookies.get_private("user_id").ok_or(Err::NotLoggedIn)?;

    let value = cookie.value();

    let user_id = i64::from_str(value).unwrap();

    Ok(user_id)
}
