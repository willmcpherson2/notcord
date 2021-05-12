use crate::routes::Message;
use crate::state::Signal;
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
    Username(String),
    Usernames(Vec<String>),
    Groups(Vec<String>),
    Channels(Vec<String>),
    Messages(Vec<Message>),
    Peers(Vec<i64>),
    Signals(Vec<Signal>),
}

#[derive(Serialize)]
pub enum Err {
    UserAlreadyExists,
    UserDoesNotExist,
    UserAlreadyInGroup,
    UserAlreadyInvited,
    UserNotInGroup,
    UserNotInChannel,
    UserAlreadyInChannel,
    GroupDoesNotExist,
    GroupAlreadyExists,
    ChannelAlreadyExists,
    ChannelDoesNotExist,
    InviteDoesNotExist,
    NotLoggedIn,
    PermissionDenied,
    CannotBeOwnFriend,
    InviteAlreadyExists,
    FrendshipAlreadyExists,
    FrendshipDoesntExists,
}

impl<'r> Responder<'r> for Response {
    fn respond_to(self, request: &Request) -> response::Result<'r> {
        match self {
            Response::Ok(ok) => match ok {
                Ok::Username(username) => Json(username).respond_to(request),
                Ok::Usernames(usernames) => Json(usernames).respond_to(request),
                Ok::Groups(groups) => Json(groups).respond_to(request),
                Ok::Channels(channels) => Json(channels).respond_to(request),
                Ok::Messages(messages) => Json(messages).respond_to(request),
                Ok::Peers(peers) => Json(peers).respond_to(request),
                Ok::Signals(signals) => Json(signals).respond_to(request),
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
