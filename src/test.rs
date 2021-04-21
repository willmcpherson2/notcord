use crate::response::*;
use crate::util::{self, Database};
use rocket::config::{Config, Environment, Value};
use rocket::http::ContentType;
use rocket::local::Client;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};

static DATABASE_NUM: AtomicUsize = AtomicUsize::new(0);

//set up rocket & empty test database
fn setup_test_rocket() -> rocket::Rocket {
    let dir = Path::new("test");
    let database_num = DATABASE_NUM.fetch_add(1, Ordering::SeqCst).to_string();
    let path = &dir.join(database_num);
    let path_str = path.to_str().unwrap();

    if !dir.exists() {
        fs::create_dir(dir).expect("bug: cannot create test database directory");
    }
    if path.exists() {
        fs::remove_file(path).expect("bug: cannot delete old test database");
    }
    util::init_database_file(path);

    let mut database_config = HashMap::new();
    let mut databases = HashMap::new();

    database_config.insert("url", Value::from(path_str));
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

#[test]
fn add_group_not_logged_in() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    let message = client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap()));
}

#[test]
fn add_group_success() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    
    let message = client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Ok::Ok).unwrap()));
}

#[test]
fn add_group_group_exists() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"")
        .dispatch();

    let message = client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::GroupAlreadyExists).unwrap()));
}

#[test]
fn add_user_to_group_success() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"")
        .dispatch();

    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Ok::Ok).unwrap()));
}

#[test]
fn add_user_to_group_already_in_group() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"")
        .dispatch();
    client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",)
        .dispatch();

    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::UserAlreadyInGroup).unwrap()));
}

#[test]
fn add_user_to_group_user_doesnt_exist() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"")
        .dispatch();

    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap()));
}

#[test]
fn add_user_to_group_not_admin() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"")
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();
    client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",)
        .dispatch();

    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap()));
}

#[test]
fn add_user_to_group_group_doesnt_exist() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client.post("/login")
        .header(ContentType::JSON)
        .body(
        "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap()));
}

#[test]
fn add_user_to_group_not_logged_in() {
    let rocket_instance = setup_test_rocket();
    let client = Client::new(rocket_instance).expect("Problem Creating Client");

    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
            }",
        )
        .dispatch();
    client.post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();

    let message = client
        .post("/add_user_to_group")
        .header(ContentType::JSON)
        .body(  "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(), 
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap()));
}