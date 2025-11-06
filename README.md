
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/errandler-express.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Ferrandler-express.svg)](https://www.npmjs.com/package/@dwtechs/errandler-express)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Errandler-express.js)](https://www.npmjs.com/package/@dwtechs/errandler-express)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-100%25-brightgreen.svg)


- [Synopsis](#synopsis)
- [Support](#support)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Logs](#logs)
- [Contributors](#contributors)
- [Stack](#stack)


## Synopsis

**[Errandler-express.js](https://github.com/DWTechs/Errandler-express.js)** is an open source Errandler gateway toolset for Express.js.  

- 🪶 Very lightweight
- ⚡ High performance
- 🔧 Easy to use
- Only 1 dependency to log errors
- 🧪 Thoroughly tested
- 🚚 Shipped as ECMAScript Express module
- 📝 Written in TypeScript


## Support

- node: 22

This is the oldest targeted version.  


## Installation

```bash
$ npm i @dwtechs/errandler-express
```


## Usage


```javascript

// @ts-check
import express from "express";
// const cors = require("cors");
import { log } from '@dwtechs/winstan';
import error from "@dwtechs/errandler-express";
import { endTimer, startTimer } from "@dwtechs/winstan-plugin-express-perf";
import { listen } from "@dwtechs/servpico-express";


const app = express();
app.disable("x-powered-by");

// Mandatory modules for any service
import health from "health";
 
// import services
// import middlewares
// import routes

app.use(express.json());
app.use("/health", health);
app.use(startTimer);
// Routes
app.use("/xx", ...);
app.use("/xxx", ...);

// Performance measurement ends
app.use(endTimer);

// Error handling
error.use(app);

// Init reference data
Promise.all([
    data1.init(), 
    data2.init(),
  ])
  .then(() => listen(app))
  .catch((err) => log.error(`App cannot start: ${err.msg}`));

```

## API Reference


```typescript

const EC_BAD_REQUEST = 400;
const EC_UNAUTHORIZED = 401;
const EC_FORBIDDEN = 403;
const EC_NOT_FOUND = 404;
const EC_CONFLICT = 409;
const EC_MALFORMED_SYNTAX = 422;
const EC_TOO_MANY_REQUESTS = 429;
const EC_INTERNAL_ERROR = 500;
const EC_SERVICE_UNAVAILABLE = 503;

/**
 * Sets up comprehensive error handling middleware for an Express application.
 * This function configures a series of error handlers that should be registered
 * after all other middleware and routes to properly handle errors and invalid paths.
 * 
 * The middleware stack includes:
 * - Error logging (logs error stack and message)
 * - Database transaction rollback (for PostgreSQL connections)
 * - Client error response handling (sends appropriate HTTP status and error message)
 * - Invalid path handling (handles 404 errors for undefined routes)
 * 
 * @param {import('express').Application} app - The Express application instance to configure
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import errorHandler from './error';
 * 
 * const app = express();
 * 
 * // Define your routes here
 * app.get('/api/users', (req, res) => {
 *   // route logic
 * });
 * 
 * // Apply error handling middleware (should be last)
 * errorHandler.use(app);
 * ```
 * 
 * @since 1.0.0
 */
function use(app) {}

```

### Exported Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `EC_BAD_REQUEST` | 400 | The server cannot process the request due to client error |
| `EC_UNAUTHORIZED` | 401 | Authentication is required and has failed or not been provided |
| `EC_FORBIDDEN` | 403 | The client does not have access rights to the content |
| `EC_NOT_FOUND` | 404 | The server cannot find the requested resource |
| `EC_CONFLICT` | 409 | Request conflicts with the current state of the server |
| `EC_MALFORMED_SYNTAX` | 422 | The request was well-formed but contains semantic errors |
| `EC_TOO_MANY_REQUESTS` | 429 | The user has sent too many requests in a given time |
| `EC_INTERNAL_ERROR` | 500 | The server encountered an unexpected condition |
| `EC_SERVICE_UNAVAILABLE` | 503 | The server is not ready to handle the request |


## Logs

**Errandler-express.js** uses **[@dwtechs/Winstan](https://www.npmjs.com/package/@dwtechs/winstan)** library for logging.
All logs are in debug mode. Meaning they should not appear in production mode.

## Contributors

**Errandler-express.js** is still in development and we would be glad to get all the help you can provide.
To contribute please read **[contributor.md](https://github.com/DWTechs/Errandler-express.js/blob/main/contributor.md)** for detailed installation guide.


## Stack

| Purpose         |                    Choice                    |                                                     Motivation |
| :-------------- | :------------------------------------------: | -------------------------------------------------------------: |
| repository      |        [Github](https://github.com/)         |     hosting for software development version control using Git |
| package manager |     [npm](https://www.npmjs.com/get-npm)     |                                default node.js package manager |
| language        | [TypeScript](https://www.typescriptlang.org) | static type checking along with the latest ECMAScript features |
| module bundler  |      [Rollup](https://rollupjs.org)          |                        advanced module bundler for ES6 modules |
| unit testing    |          [Jest](https://jestjs.io/)          |                  delightful testing with a focus on simplicity |
