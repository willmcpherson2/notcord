Product URL
-----------

https://not-cord.herokuapp.com

Github URLs
----------

https://github.com/willmcpherson2/notcord

https://github.com/willmcpherson2/notcord-buildpack

Building
--------

Install yarn, rustup and sqlite3:

https://classic.yarnpkg.com/en/docs/install

https://rustup.rs

https://sqlite.org/download.html

Run the backend:

    cargo run

Run the frontend:

    cd app
    yarn
    yarn start

Then visit http://localhost:3000 in your browser.

Testing
-------

Test the backend:

    cargo test

Test the frontend:

    cd app
    yarn test

Deploying
---------

Deploying requires git and access to the Heroku account.

Once you have access, add the Heroku remote repository:

    git remote add heroku https://git.heroku.com/not-cord.git

To deploy the app, push to the Heroku main branch:

    git push heroku main

If the local and remote branches are identical, this has no effect.

The build script that is used to install dependencies can be found here:

https://github.com/willmcpherson2/notcord-buildpack/blob/master/bin/compile

The exact command used to run the server can be found here:

https://github.com/willmcpherson2/notcord/blob/main/Procfile
