use crate::response::*;
use crate::util::{self, Database};
use rocket::config::{Config, Environment, Value};
use rocket::http::ContentType;
use rocket::local::Client;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

//set up rocket & empty test database
fn setup_test_rocket() -> rocket::Rocket {
    if Path::new("test_database.db").exists() {
        fs::remove_file("test_database.db").expect("bug: cannot delete old database");
    }
    util::init_database_file("test_database.db");

    let mut database_config = HashMap::new();
    let mut databases = HashMap::new();

    database_config.insert("url", Value::from("test_database.db"));
    databases.insert("database", Value::from(database_config));

    let config = Config::build(Environment::Development)
        .extra("databases", databases)
        .finalize()
        .unwrap();

    util::init_rocket(rocket::custom(config))
}

//sign up - new user;
#[test]
fn signup_new_user() {
    let rocket_instance = setup_test_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    let mut stmt = test_db
        .prepare("SELECT username FROM users WHERE (username = 'test_user01')")
        .expect("Problem parsing sql");
    println!("{:?}", stmt.exists(&[]),);
    match stmt.exists(&[]) {
        Ok(exists) => {
            assert!(exists);
        }
        Err(error) => panic!("Problem creating client: {:?}", error),
    };
}

//sign up - existing user
#[test]
fn signup_existing_user() {
    let rocket_instance = setup_test_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    test_db
        .execute(
            "INSERT INTO users (username, password_hash, avatar) VALUES (?1, ?2, ?3)",
            &[
                &"test_user02",
                &"test_hash02",
                &util::DEFAULT_AVATAR.to_vec(),
            ],
        )
        .expect("Unable to insert new users");
    let message = client.post("/signup").header(ContentType::JSON).body(
        "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
    );
    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserAlreadyExists).unwrap())
    );
}

// log in - user does not exist
#[test]
fn login_user_not_exist() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    let message = client.post("/login").header(ContentType::JSON).body(
        "{
            \"username\":\"test_user03\",   
            \"password\":\"test_hash03\"
            }",
    );
    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn login_success() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user04\",   
            \"password\":\"test_hash04\"
            }",
        )
        .dispatch();
    let message = client.post("/login").header(ContentType::JSON).body(
        "{
            \"username\":\"test_user04\",   
            \"password\":\"test_hash04\"
            }",
    );
    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}
