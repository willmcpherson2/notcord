use super::*;
use rocket::http::ContentType;
use rocket::local::Client;


//sign up - new user;
#[test]
fn signup_new_user() {
    init_database_file();
    let rocket_instance = init_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");
    test_db
        .execute("BEGIN TRANSACTION", &[])
        .expect("Unable to start TRANSACTION");
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
            test_db
                .execute("ROLLBACK", &[])
                .expect("Bug:Unable to ROLLBACK TRANSACTION");
            assert!(exists);
        }
        Err(error) => panic!("Problem creating client: {:?}", error),
    };
}

#[test]
fn signup_existing_user() {
    init_database_file();
    let rocket_instance = init_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");

    test_db
        .execute("BEGIN TRANSACTION", &[])
        .expect("Unable to start TRANSACTION");
    test_db
        .execute("INSERT INTO User (username, password_hash, avatar) VALUES (?1, ?2, ?3)",
                &[&"test_user02", &"test_hash02", &DEFAULT_AVATAR.to_vec()])
        .expect("Unable to insert new users"); 
    let message = client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user03\",   
            \"password\":\"test_hash02\"
            }",
        );
    let mut response = message.dispatch();
    //println!("{:?}", response.body_string());
    //println!("{:?}", Some(ErrorCode::UserAlreadyExists.to_string()));
    assert_eq!(response.body_string(), Some("\"".to_string()+&ErrorCode::UserAlreadyExists.to_string()+"\""));
    test_db
        .execute("ROLLBACK", &[])
        .expect("Bug:Unable to ROLLBACK TRANSACTION");
}