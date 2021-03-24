# NotCord

Not Discord

## Project Structure

The top-level directory is the Rust project (server).

The app/ directory is the React project (frontend).

## Building

To build this you'll need to install yarn and rustup:

https://classic.yarnpkg.com/en/docs/install

https://rustup.rs

Then you can build and run everything:

    cd app
    yarn
    yarn build
    cd ..
    cargo run

This will serve the app locally and you should be able to follow the link that
Rocket printed to your terminal. It will probably be something like
localhost:8000

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
