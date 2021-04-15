use rocket::request::Request;
use rocket::response::{self, Responder};
use rocket_contrib::json::Json;
use serde::Serialize;
use std::ops::Try;

macro_rules! ok {
    ($ok:expr) => {
        Response::Ok($ok)
    };
    () => {
        Response::Ok(Ok::Ok)
    };
}

macro_rules! err {
    ($err:expr) => {
        Response::Err($err)
    };
}

pub enum Response {
    Ok(Ok),
    Err(Err),
}

#[derive(Serialize)]
pub enum Ok {
    Ok,
    Usernames(Vec<String>),
}

#[derive(Serialize)]
pub enum Err {
    UserAlreadyExists,
    UserDoesNotExist,
    UserAlreadyInGroup,
    GroupDoesNotExist,
    GroupAlreadyExists,
    NotLoggedIn,
    PermissionDenied,
}

impl<'r> Responder<'r> for Response {
    fn respond_to(self, request: &Request) -> response::Result<'r> {
        match self {
            Response::Ok(ok) => match ok {
                Ok::Usernames(usernames) => Json(usernames).respond_to(request),
                _ => Json(ok).respond_to(request),
            },
            Response::Err(err) => Json(err).respond_to(request),
        }
    }
}

impl Try for Response {
    type Ok = Ok;
    type Error = Err;

    fn into_result(self) -> Result<Ok, Err> {
        match self {
            Self::Ok(ok) => Ok(ok),
            Self::Err(err) => Err(err),
        }
    }

    fn from_ok(ok: Ok) -> Self {
        ok!(ok)
    }

    fn from_error(err: Err) -> Self {
        err!(err)
    }
}
