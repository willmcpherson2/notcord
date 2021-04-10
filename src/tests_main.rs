use super::*;
use rocket::http::ContentType;
use rocket::local::Client;
use rocket::config::{Config, Environment, Value};
use std::collections::HashMap;
use std::fs;

//set up rocket & empty test database
fn setup_test_rocket() -> rocket::Rocket {
    fs::remove_file("test_database.db")
        .expect("bug: cannot delete old database");
    init_database_file("test_database.db");

    let mut database_config = HashMap::new();
    let mut databases = HashMap::new();

    database_config.insert("url", Value::from("test_database.db"));
    databases.insert("database", Value::from(database_config));
    
    let config = Config::build(Environment::Development)
        .extra("databases", databases)
        .finalize()
        .unwrap();

    init_rocket(rocket::custom(config))
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
        .prepare("SELECT username FROM User WHERE (username = 'test_user01')")
        .expect("Problem parsing sql");
    println!("{:?}", stmt.exists(&[]),);
    match stmt.exists(&[]) {
        Ok(exists) => {
            assert!(exists);
        }
        Err(error) => panic!("Problem creating client: {:?}", error),
    };
}

#[test]
fn signup_existing_user() {
    let rocket_instance = setup_test_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    test_db
        .execute("INSERT INTO User (username, password_hash, avatar) VALUES (?1, ?2, ?3)",
                &[&"test_user02", &"test_hash02", &DEFAULT_AVATAR.to_vec()])
        .expect("Unable to insert new users"); 
    let message = client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        );
    let mut response = message.dispatch();
    assert_eq!(response.body_string(), Some(serde_json::to_string(&ErrorCode::UserAlreadyExists).unwrap()));
}
