# NotCord

![GitHub issues](https://img.shields.io/github/issues/willmcpherson2/notcord) ![GitHub top language](https://img.shields.io/github/languages/top/willmcpherson2/notcord)

NotCord is a audio and text chat, that can be compared to similar programs such as Discord and Teamspeak. It is created with the intent of being the Capstone Project for RMIT University.

## Pre-Installtion
The project is constructed using [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable). Yarn is a package manager like npm but is much less prone to the issues that npm suffers. Please install it prior to using this sofware. While not 100% essential, any bugs with the use of npm will not be accepted.
You can check to see if yarn is correctly installed:
```bash
yarn --version
```

## Installation
A first time installation is needed every single time you pull from the git. This is because others may have added new dependancies or made changes to the node_modules folder which is rightly kept out of the git. This is documented in the `package.json` and the `package-lock.json` files. To install any changes, run the following command:
```bash
yarn
```
The `yarn` command is the same as `npm install` in terms of functionality, and actually has the same command (`yarn install`). Running the command makes the package-lock.json file irrelavant, and creates a new yarn.lock file.

If there is no new depenancies then the yarn command should be relatively quick and just skip through things. A full reinstall of the node modules may take up to 1 minute to gather using this command.

## Running the Software
To run the Front-End React is extremely easy. A simple command and the program will open at `localhost:3000`. Alternatives to this IP address are: `127.0.0.1:3000` or typing the full URL `http://localhost:3000/`. Keep in mind to never use ***https*** as there is no SSL on the server. 

To start the server run:
```bash
yarn start
```

## Testing
Testing is essential within the project, and as thus, testing will be completed throughout the entire project. We aim to have 100% testing coverage. Please use the coverage badge at the top to see the coverage. This is readjusted every time a new push to the branch is set. 

Testing React.js:
```bash
yarn test
```

*Note: Testing badge has not been added yet, will eventually be done once testing commences*
