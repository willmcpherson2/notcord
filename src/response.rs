use rocket::request::Request;
use rocket::response::{self, Responder};
use rocket_contrib::json::Json;
use serde::Serialize;

pub enum Response {
    Ok(Ok),
    Err(Err),
}

#[derive(Serialize)]
pub enum Ok {
    Ok,
}

#[derive(Serialize)]
pub enum Err {
    UserAlreadyExists,
    UserDoesNotExist,
    NotLoggedIn,
}

impl<'r> Responder<'r> for Response {
    fn respond_to(self, request: &Request) -> response::Result<'r> {
        match self {
            Response::Ok(success) => Json(success).respond_to(request),
            Response::Err(failure) => Json(failure).respond_to(request),
        }
    }
}

macro_rules! ok {
    ($success:expr) => {
        Response::Ok($success)
    };
    () => {
        Response::Ok(Ok::Ok)
    };
}

macro_rules! err {
    ($failure:expr) => {
        Response::Err($failure)
    };
}
