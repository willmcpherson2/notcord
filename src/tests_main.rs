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
            \"password_hash\":\"test_hash01\"
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

/*sign up - existing user
#[test]
fn signup_existing_user() {
    init_database_file();
    let rocket_instance = init_rocket();
    let test_db = Database::get_one(&rocket_instance).expect("Unable to retrieve database");
    let client = Client::new(rocket_instance).expect("Problem Creating client");

    test_db
        .execute_batch("BEGIN TRANSACTION
            INSERT INTO User (username, password_hash) VALUES (\"test_user02\", \"test_hash02\")")
        .expect("Unable to start TRANSACTION");
    let message = client
        .post("/signup")
        .header(ContentType::JSON)
        .body(
            "{
            \"username\":\"test_user02\",   
            \"password_hash\":\"test_hash02\"
            }",
        );
    let response = message.dispatch();
    println!("{:?}", response);
    test_db
        .execute("ROLLBACK", &[])
        .expect("Bug:Unable to ROLLBACK TRANSACTION");
}
*/
