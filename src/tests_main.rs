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

//sign up;
#[test]
fn signup() {
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
            \"password_hash\":12345678
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