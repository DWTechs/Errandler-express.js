import { log } from "@dwtechs/winstan";
import type { Request, Response, NextFunction, Application } from 'express';

// Extend Error interface to include HTTP status properties
declare global {
  interface Error {
    statusCode?: number;
    status?: number;
  }
}

/**
 * HTTP Error Status Codes grouped by category
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
 * Express middleware that handles requests to invalid/undefined routes.
 * This function should be registered as the last middleware to catch all unmatched routes
 * and return a 404 Not Found response.
 * 
 * @param {Request} _req - The Express request object (unused)
 * @param {Response} res - The Express response object used to send the 404 response
 * @param {NextFunction} _next - The next middleware function (unused)
 * 
 * @returns {void} Sends a 404 response with "invalid path" message
 * 
 */
const invalidPathHandler = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(EC_CLIENT_NOT_FOUND).send("invalid path");
};

/**
 * Express error middleware that logs error details for debugging and monitoring.
 * Logs both the error stack trace and message using the configured logger,
 * then passes the error to the next error handler in the middleware chain.
 * 
 * @param {Error} err - The error object containing stack trace and message
 * @param {Request} _req - The Express request object (unused)
 * @param {Response} _res - The Express response object (unused) 
 * @param {NextFunction} next - Function to pass control to the next error middleware
 * 
 * @returns {void} Logs the error and calls next(err) to continue error handling
 * 
 */
function logError(err: Error, _req: Request, _res: Response, next: NextFunction): void {
  log.error(err.stack ?? "No stack trace available");
  log.error(err.message);
  next(err);
}

/**
 * Express error middleware that handles database transaction rollback on errors.
 * When an error occurs during a request that has an active database transaction,
 * this middleware automatically rolls back the transaction and releases the database client
 * to prevent connection leaks and maintain data consistency.
 * 
 * **Database Client Location:**
 * The database client must be stored in `res.locals.dbClient` and should be a PostgreSQL
 * client instance with `query()` and `release()` methods. This is typically set up by
 * a middleware that runs before your routes to establish database connections and transactions.
 * 
 * @param {Error} err - The error object that triggered the rollback
 * @param {Request} _req - The Express request object (unused)
 * @param {Response} res - The Express response object. Must contain `res.locals.dbClient`
 *   - `res.locals.dbClient` should be a PostgreSQL client instance
 *   - Client must have `query(sql)` method for executing ROLLBACK
 *   - Client must have `release()` method for returning connection to pool
 * @param {NextFunction} next - Function to pass control to the next error middleware
 * 
 * @returns {void} Rolls back transaction if present and calls next(err)
 * 
 * @example
 * ```typescript
 * import { Pool } from 'pg';
 * 
 * const pool = new Pool(dbConfig);
 * 
 * // Middleware to set up database client and transaction
 * app.use(async (req, res, next) => {
 *   try {
 *     const client = await pool.connect();
 *     await client.query('BEGIN');
 *     res.locals.dbClient = client; // ← Must be stored here
 *     next();
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * // Your routes here...
 * 
 * // Error handler will automatically rollback if error occurs
 * app.use(rollbackTransaction);
 * ```
 * 
 */
function rollbackTransaction(err: Error, _req: Request, res: Response, next: NextFunction): void {
  const client = res.locals.dbClient;
  if (client) {
    res.locals.dbClient = undefined;
    client
      .query("ROLLBACK")
      .catch((err: Error) => err)
      .finally(() => {
        try {
          client.release(); // release to avoid memory leak
        } catch {}
      });
  }
  next(err);
}

/**
 * Express error middleware that sends formatted error responses to clients.
 * Extracts the HTTP status code from the error object (or defaults to 400)
 * and sends an appropriate error response with the error message.
 * This should be the final error handler before the invalid path handler.
 * 
 * @param {Error} err - The error object with optional statusCode or status properties
 * @param {Request} _req - The Express request object (unused)
 * @param {Response} res - The Express response object used to send the error response
 * @param {NextFunction} _next - The next middleware function (unused in final handler)
 * 
 * @returns {void} Sends HTTP error response to the client
 * 
 */
function clientErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode || err.status || EC_CLIENT_BAD_REQUEST;
  res.status(status).send(err.message);
}

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
function errorHandler(app: Application): void {
  // Mandatory error handlers
  app.use(logError);
  // Mandatory if the service uses Postgre
  app.use(rollbackTransaction);
  app.use(clientErrorHandler);
  app.use(invalidPathHandler);
}

export {
  errorHandler,
  EC_CLIENT_BAD_REQUEST,
  EC_CLIENT_CONFLICT,
  EC_CLIENT_FORBIDDEN,
  EC_CLIENT_MALFORMED_SYNTAX,
  EC_CLIENT_NOT_FOUND,
  EC_CLIENT_TOO_MANY_REQUESTS,
  EC_CLIENT_UNAUTHORIZED,
  EC_SERVER_INTERNAL_ERROR,
  EC_SERVER_SERVICE_UNAVAILABLE,
};
