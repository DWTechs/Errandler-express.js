
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/errandler-express.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Ferrandler-express.svg)](https://www.npmjs.com/package/@dwtechs/errandler-express)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Errandler-express.js)](https://www.npmjs.com/package/@dwtechs/errandler-express)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-100%25-brightgreen.svg)


- [Synopsis](#synopsis)
- [Support](#support)
- [Installation](#installation)
- [Error Flow](#error-flow)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Logs](#logs)
- [Contributors](#contributors)
- [Stack](#stack)


## Synopsis

**[Errandler-express.js](https://github.com/DWTechs/Errandler-express.js)** is an open source Errandler gateway toolset for Express.js.  

- 🪶 Very lightweight
- ⚡  High performance
- 🔧 Easy to use
- 📦 Only 1 dependency to log errors
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

## Error Flow

```
┌─────────────────┐
│ Error Occurs    │
│ next(error)     │
└─────────┬───────┘
          │
          ▼
┌──────────────────┐
│ Step 1: logError │
│ • Log stack      │
│ • Log message    │
│ • next(err) ─────┼──┐
└──────────────────┘  │
                      │
          ┌───────────┘
          ▼
┌───────────────────┐
│ Step 2: rollback  │
│ • Check db client │
│ • ROLLBACK        │
│ • Release conn    │
│ • next(err) ──────┼─┐
└───────────────────┘ │
                      │
          ┌───────────┘
          ▼
┌───────────────────┐
│ Step 3: clientErr │
│ • Get status      │
│ • Send response   │
│ • END CHAIN       │
└───────────────────┘

┌──────────────────┐
│ No route matches │ 
│ • Unmatched URL  │
│ • Send 404       │
└──────────────────┘
```


## Usage

```javascript

// @ts-check
import express from "express";
// const cors = require("cors");
import { log } from '@dwtechs/winstan';
import { errorHandler } from "@dwtechs/errandler-express";
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

// Routes
app.use("/xx", ...);
app.use("/xxx", ...);


// Error handling
errorHandler(app);

// Init reference data
Promise.all([
    data1.init(), 
    data2.init(),
  ])
  .then(() => listen(app))
  .catch((err) => log.error(`App cannot start: ${err.msg}`));

```

### Error Codes

```typescript
import { 
  EC_CLIENT_BAD_REQUEST, 
  EC_CLIENT_UNAUTHORIZED, 
  EC_CLIENT_FORBIDDEN, 
  EC_CLIENT_NOT_FOUND,
  EC_CLIENT_CONFLICT,
  EC_CLIENT_MALFORMED_SYNTAX,
  EC_CLIENT_TOO_MANY_REQUESTS,
  EC_SERVER_INTERNAL_ERROR, 
  EC_SERVER_SERVICE_UNAVAILABLE
 } from '@dwtechs/errandler-express';

// Create custom errors with status codes
function createValidationError(message: string) {
  const error = new Error(message);
  error.statusCode = EC_CLIENT_BAD_REQUEST;
  return error;
}

// Use in middleware
app.use('/api/protected', (req, res, next) => {
  if (!req.user) {
    return res.status(EC_CLIENT_UNAUTHORIZED)
              .send('Authentication required');
  }
  next();
});

// Error handling in routes
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(EC_CLIENT_NOT_FOUND)
                .send('User not found');
    }
    res.json(user);
  } catch (error) {
    error.statusCode = EC_SERVER_INTERNAL_ERROR;
    next(error);
  }
});


```

## API Reference


```typescript

/**
 * Exported HTTP Error Status Codes grouped by category
 * Client Error Responses (4xx)
 * These errors indicate that the client made an error in the request
 * Server Error Responses (5xx)
 * These errors indicate that the server encountered an error 
 */
const EC_CLIENT_BAD_REQUEST = 400; // 400 - The server cannot process the request due to client error 
const EC_CLIENT_UNAUTHORIZED = 401; // 401 - Authentication is required and has failed or not been provided
const EC_CLIENT_FORBIDDEN = 403; // 403 - The client does not have access rights to the content
const EC_CLIENT_NOT_FOUND = 404; // 404 - The server cannot find the requested resource
const EC_CLIENT_CONFLICT = 409; // 409 - Request conflicts with the current state of the server
const EC_CLIENT_MALFORMED_SYNTAX = 422; // 422 - The request was well-formed but contains semantic errors
const EC_CLIENT_TOO_MANY_REQUESTS = 429; // 429 - The user has sent too many requests in a given time
const EC_SERVER_INTERNAL_ERROR = 500; // 500 - The server encountered an unexpected condition */
const EC_SERVER_SERVICE_UNAVAILABLE = 503; // 503 - The server is not ready to handle the request */

/**
 * Sets up comprehensive error handling middleware for an Express application.
 * This function configures a complete error handling pipeline that should be registered
 * after all other middleware and routes to properly handle errors and invalid paths.
 * 
 * The middleware stack is applied in the following order:
 * 1. **Error Logging** - Logs error details for debugging and monitoring
 * 2. **Transaction Rollback** - Rolls back database transactions on errors (PostgreSQL)
 * 3. **Client Error Response** - Sends formatted HTTP error responses to clients
 * 4. **Invalid Path Handling** - Handles 404 errors for undefined routes
 * 
 * @param {Application} app - The Express application instance to configure with error handlers
 * 
 * @returns {void} Configures the application with error handling middleware
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { errorHandler } from './error';
 * 
 * const app = express();
 * 
 * // Configure your routes and middleware first
 * app.use(express.json());
 * app.get('/api/users', getUsersHandler);
 * app.post('/api/users', createUserHandler);
 * 
 * // Apply comprehensive error handling (should be last)
 * errorHandler(app);
 * 
 * app.listen(3000, () => {
 *   console.log('Server running with error handling configured');
 * });
 * ```
 * 
 */
function errorHandler(app) {}

```

### Error Code Reference

| Category | Code | Value | Description |
|----------|------|-------|-------------|
| Client | `BAD_REQUEST` | 400 | The server cannot process the request due to Client error |
| Client | `UNAUTHORIZED` | 401 | Authentication is required and has failed or not been provided |
| Client | `FORBIDDEN` | 403 | The Client does not have access rights to the content |
| Client | `NOT_FOUND` | 404 | The server cannot find the requested resource |
| Client | `CONFLICT` | 409 | Request conflicts with the current state of the server |
| Client | `MALFORMED_SYNTAX` | 422 | The request was well-formed but contains semantic errors |
| Client | `TOO_MANY_REQUESTS` | 429 | The user has sent too many requests in a given time |
| Server | `INTERNAL_ERROR` | 500 | The server encountered an unexpected condition |
| Server | `SERVICE_UNAVAILABLE` | 503 | The server is not ready to handle the request |


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
