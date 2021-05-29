use crate::response::*;
use crate::util::{self, Database};
use rocket::config::{Config, Environment, Value};
use rocket::http::ContentType;
use rocket::local::Client;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Once;

macro_rules! setup {
    () => {{
        // line!() is the line number at the *call* to setup!(), making it unique.
        let rocket_instance = setup_test_rocket(line!());
        let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
        let client = Client::new(rocket_instance).expect("Problem Creating client");
        (client, test_db)
    }};
}

static SETUP: Once = Once::new();

//set up rocket & empty test database
fn setup_test_rocket(database_num: u32) -> rocket::Rocket {
    let dir = Path::new("test");
    let path = &dir.join(database_num.to_string());
    let path_str = path.to_str().unwrap();

    // Setup function for tests. This is only run once. Put any setup code in here.
    SETUP.call_once(|| {
        // remove the test directory if it exists, then create a new one.
        if dir.exists() {
            fs::remove_dir_all(dir).expect("bug: cannot delete old test databases");
        }
        fs::create_dir(dir).expect("bug: cannot create test database directory");
    });

    // The database path is `test/n`, where n is database_num, which is the line number of the call
    // to setup!().
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
    let (client, test_db) = setup!();
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
    let (client, test_db) = setup!();
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
    let (client, _) = setup!();
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
    let (client, _) = setup!();
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
fn get_username_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user01\",   
                \"password\":\"test_hash01\"
            }",
        )
        .dispatch();

    let message = client.post("/get_username").header(ContentType::JSON);
    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string("test_user01").unwrap())
    );
}

#[test]
fn get_username_not_logged_in() {
    let (client, _) = setup!();

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

    let message = client.post("/get_username").header(ContentType::JSON);
    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn is_group_admin_true() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user01\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(response.body_string(), Some(String::from("true")));
}

#[test]
fn is_group_admin_false() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();
    client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
                }",
        )
        .dispatch();

    let message = client
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user02\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(response.body_string(), Some(String::from("false")));
}

#[test]
fn is_group_admin_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user01\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn is_group_admin_user_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user02\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn is_group_admin_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user02\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn is_group_admin_user_not_in_group() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user02\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserNotInGroup).unwrap())
    );
}

#[test]
fn is_group_admin_permission_denied() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/is_group_admin")
        .header(ContentType::JSON)
        .body(
            "{
                \"username\":\"test_user01\",
                \"group_name\":\"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap())
    );
}

#[test]
fn add_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn add_group_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/add_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn add_group_group_exists() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        Some(serde_json::to_string(&Err::GroupAlreadyExists).unwrap())
    );
}

#[test]
fn invite_user_to_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn invite_user_to_group_already_in_group() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();

    let message = client
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserAlreadyInvited).unwrap())
    );
}

#[test]
fn invite_user_to_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn invite_user_to_group_not_admin() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap())
    );
}

#[test]
fn invite_user_to_group_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    let message = client
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn invite_user_to_group_not_logged_in() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();

    let message = client
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn invite_user_to_group_user_already_invited() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();

    let message = client
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserAlreadyInvited).unwrap())
    );
}

#[test]
fn get_invites_success() {
    let (client, _) = setup!();
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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client.post("/get_invites").header(ContentType::JSON);

    let mut response = message.dispatch();

    assert_ne!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn get_invites_not_logged_in() {
    let (client, _) = setup!();

    let message = client.post("/get_invites").header(ContentType::JSON);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn process_group_invite_success() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn process_group_invite_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn process_group_invite_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn process_group_invite_invite_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::InviteDoesNotExist).unwrap())
    );
}

#[test]
fn remove_user_from_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();
    client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
                }",
        )
        .dispatch();

    let message = client
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn remove_user_from_group_not_logged_in() {
    let (client, _) = setup!();   

    let message = client
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn remove_user_from_group_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn remove_user_from_group_permission_denied() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/invite_user_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();
    client
        .post("/process_group_invite")
        .header(ContentType::JSON)
        .body(
            "{
                \"group_name\":\"test_group01\",
                \"response\":true
                }",
        )
        .dispatch();

    let message = client
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user01\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap())
    );
}

#[test]
fn remove_user_from_group_user_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn remove_user_from_group_user_not_in_group() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/remove_user_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                    \"username\":\"test_user02\",
                    \"group_name\":\"test_group01\"
                }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserNotInGroup).unwrap())
    );
}

#[test]
fn get_users_in_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/get_users_in_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();
    let mut usernames: Vec<String> = vec![];
    usernames.push("\"test_user01\"".to_string());

    assert_eq!(
        response.body_string().unwrap(),
        //this needs improvement
        "[\"test_user01\"]"
    );
}

#[test]
fn get_users_in_group_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/get_users_in_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn get_users_in_group_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/get_users_in_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn get_users_in_group_user_not_in_group() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/get_users_in_group")
        .header(ContentType::JSON)
        .body("\"test_group01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserNotInGroup).unwrap())
    );
}

#[test]
fn get_groups_for_user_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/get_groups_for_user")
        .header(ContentType::JSON);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string().unwrap(),
        //this needs improvement
        "[\"test_group01\"]"
    );
}

#[test]
fn get_groups_for_user_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/get_groups_for_user")
        .header(ContentType::JSON);

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn add_channel_to_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn add_channel_to_group_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn add_channel_to_group_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn add_channel_to_group_permission_denied() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap())
    );

    //panic!("unfinished test");
}

#[test]
fn add_channel_to_group_channel_already_exists() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        )
        .dispatch();

    let message = client
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::ChannelAlreadyExists).unwrap())
    );
}

#[test]
fn remove_channel_from_group_success() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/add_channel_to_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        )
        .dispatch();

    let message = client
        .post("/remove_channel_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn remove_channel_from_group_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/remove_channel_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn remove_channel_from_group_group_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/remove_channel_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::GroupDoesNotExist).unwrap())
    );
}

#[test]
fn remove_channel_from_group_permission_denied() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
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
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/remove_channel_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::PermissionDenied).unwrap())
    );
}

#[test]
fn remove_channel_from_group_channel_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
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
        .post("/remove_channel_from_group")
        .header(ContentType::JSON)
        .body(
            "{
                \"channel_name\": \"test_channel01\",
                \"group_name\": \"test_group01\"
            }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::ChannelDoesNotExist).unwrap())
    );
}

#[test]
fn add_friend_request_success() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn add_friend_request_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn add_friend_request_user_doesnt_exist() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn add_friend_request_cannot_be_own_friend() {
    let (client, _) = setup!();

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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::CannotBeOwnFriend).unwrap())
    );
}

#[test]
fn add_friend_request_invite_already_exists() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"")
        .dispatch();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::InviteAlreadyExists).unwrap())
    );
}

#[test]
fn add_friend_request_friendship_already_exists() {
    let (client, _) = setup!();

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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"")
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();
    client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",
            \"response\": true
        }",
        )
        .dispatch();

    let message = client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user01\"");

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::FrendshipAlreadyExists).unwrap())
    );
}

#[test]
fn process_friend_request_accept() {
    let (client, _) = setup!();
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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"")
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",
            \"response\": true
        }",
        );

    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn process_friend_request_deny() {
    let (client, _) = setup!();
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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();
    client
        .post("/add_friend_request")
        .header(ContentType::JSON)
        .body("\"test_user02\"")
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",
            \"response\": false
        }",
        );

    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Ok::Ok).unwrap())
    );
}

#[test]
fn process_friend_not_logged_in() {
    let (client, _) = setup!();

    let message = client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",
            \"response\": false
        }",
        );

    let mut response = message.dispatch();

    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::NotLoggedIn).unwrap())
    );
}

#[test]
fn process_friend_user_doesnt_exist() {
    let (client, _) = setup!();
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
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",   
            \"password\":\"test_hash01\"
        }",
        )
        .dispatch();

    let message = client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",
            \"response\": false
        }",
        );

    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::UserDoesNotExist).unwrap())
    );
}

#[test]
fn process_friend_invite_doesnt_exist() {
    let (client, _) = setup!();
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
    client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
            }",
        )
        .dispatch();
    client
        .post("/login")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password\":\"test_hash02\"
        }",
        )
        .dispatch();

    let message = client
        .post("/proccess_friend_request")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user01\",
            \"response\": false
        }",
        );

    let mut response = message.dispatch();
    assert_eq!(
        response.body_string(),
        Some(serde_json::to_string(&Err::InviteDoesNotExist).unwrap())
    );
}
