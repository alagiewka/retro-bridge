<p align="center">
  RETRO BRIDGE
</p>

  <p align="center">Open your retro machine to the world.</p>

## Description

Nestjs based service bridging telnet client with discord bot backend. Allows retro machines (currently C64 supported, more to come) to connect to discord chat.

## Status

Current implementation is still in PoC phase. Project architecture will undergo rapid changes in the near future.
First goal is to get this PoC to a usable state before going into polishing mode.

## Prerequisites

Make sure you have [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) cli tool installed.

In project root directory run the following commands before each use of node runtimes (once per shell lifecycle, unless you've changed the node version in the meantime)
```bash
$ nvm use 
```
If you'll get an error that selected node version is unavailable, run:
```bash
$ nvm install 
```
To list your installed runtime versions you can use
```bash
$ nvm list 
```

## Installation

```bash
$ npm ci
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Code quality

The following tools are used in the project to assure code quality:
- [husky](https://www.npmjs.com/package/husky) - for automated git hook based acceptance checks
- [commitlint](https://commitlint.js.org/#/) - verifies if commit messages comply with conventional commits standard
- [prettier](https://prettier.io/) - for standarized formatting
- [eslint](https://eslint.org/) - static code analysis

To run a complete check
```bash
$ npm run code:check
```

To apply formatting
```bash
$ npm run format:write
```

## GIT workflow

We're working with GIT using clean history convention.
Find out more: [here](https://simondosda.github.io/posts/2022-01-03-git-rebase-workflow.html)

## License

This project is [MIT licensed](https://github.com/ala/nest/blob/master/LICENSE).
