# NotCord

Not Discord

## Project Structure

The top-level directory is the Rust project (server).

The app/ directory is the React project (frontend).

## Building

To build this you'll need to install yarn, rustup and sqlite3:

https://classic.yarnpkg.com/en/docs/install

https://rustup.rs

https://sqlite.org/download.html

Then you can build and run everything:

    cd app
    yarn install
    yarn build
    cd ..
    cargo run

This will serve the app locally and you should be able to follow the link that
Rocket printed to your terminal. It will probably be something like
localhost:8000

## Database

The server creates a database file called `database.db`, or uses the existing
one. This means the database is persistent and you can create your own. You can
create data manually with the `sqlite3` command:

    sqlite3 database.db

A sqlite interpreter will open and you can execute any command you'd like.

For nicer output, add this to your `~/.sqliterc`:

    .mode column
    .headers on

## .gitignore

A .gitignore is a file that git looks at to know which files to track.

https://git-scm.com/docs/gitignore

Our .gitignore (the one in this directory) is super strict and will require you
to manually add files.

You'll see these two lines at the top of our .gitignore:

    *
    */*

`*` ignores everything in the root directory. `*/*` ignores everything
in every subdirectory. This also works for subdirectories with their own
.gitignores, such as our app/ directory.

Whitelist a file in the root directory:

    !file

Whitelist a file in a subdirectory:

    !dir
    !dir/file

Whitelist everything in a directory:

    !dir
    !dir/*

Recursively whitelist a directory:

    !dir
    !dir/**

You'll notice we've allowed the entire app/ directory:

    !app
    !app/**

This means we're using the .gitignore in the app directory *for that
directory*.
