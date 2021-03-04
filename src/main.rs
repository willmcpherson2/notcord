#![feature(proc_macro_hygiene, decl_macro)]
#[macro_use]
extern crate rocket;

use rocket::response::NamedFile;
use std::io;
use std::path::{Path, PathBuf};

#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open("app/build/index.html")
}

#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("app/build").join(file)).ok()
}

fn main() {
    rocket::ignite().mount("/", routes![index, files]).launch();
}
