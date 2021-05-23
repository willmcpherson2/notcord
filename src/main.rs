#![feature(proc_macro_hygiene, decl_macro, try_trait)]
#![warn(clippy::pedantic, clippy::nursery)]
#![allow(
    clippy::collapsible_if,
    clippy::redundant_else,
    clippy::needless_pass_by_value,
    clippy::option_if_let_else,
    clippy::option_if_let_else,
    clippy::wildcard_imports,
    clippy::match_wildcard_for_single_variants,
    clippy::similar_names
)]

use std::path::Path;

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

#[cfg(test)]
mod test;
#[macro_use]
mod util;
#[macro_use]
mod response;
mod routes;

fn main() {
    util::init_database_file(Path::new("database.db"));
    util::init_rocket(rocket::ignite()).launch();
}
