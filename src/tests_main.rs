use super::*;
use rocket::http::ContentType;
use rocket::local::Client;

fn set_up_test_db() -> rusqlite::Connection {
    let test_db = rusqlite::Connection::open("database.db")
        .expect("bug: failed to open/create database file");
    test_db
        .execute(
            "CREATE TABLE IF NOT EXISTS User (username TEXT NOT NULL, password_hash INTEGER)",
            &[],
        )
        .expect("bug: failed to create sqlite table");
    test_db
}

fn set_up_test_server() -> rocket::Rocket {
    rocket::ignite()
        .attach(Database::fairing())
        .mount("/", routes![index, files, signup, login])
}



//sign up - new user;
#[test]
fn signup_new_user() {
    let test_db = set_up_test_db();
    let client = Client::new(set_up_test_server()).expect("Problem Creating client");
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
    let stmt = &test_db
        .prepare("SELECT username FROM User WHERE (username = 'test_user01')")
        .expect("Problem parsing sql");
    match stmt.exists(&[]) {
        Ok(exists) => {
            test_db
                .execute("ROLLBACK", &[])
                .expect("Bug:Unable to ROLLBACK TRANSACTION");
            assert!(exists);
        }
        Err(error) => panic!("Problem creating client: {:?}", error),
    };
    rusqlite::Connection::close(test_db);
}

//sign up - existing user
#[test]
fn signup_existing_user() {
    let test_db = set_up_test_db();
    let client = Client::new(set_up_test_server()).expect("Problem Creating client");
    test_db
        .execute("BEGIN TRANSACTION", &[])
        .expect("Unable to start TRANSACTION");
    test_db
        .execute("INSERT INTO User (username, password_hash) VALUES (\"test_user02\", \"test_hash02\")", &[])
        .expect("Unable toinput test data");
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