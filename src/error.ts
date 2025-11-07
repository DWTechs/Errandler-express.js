import { log } from "@dwtechs/winstan";
import type { Request, Response, NextFunction } from 'express';

// Extend Error interface to include HTTP status properties
declare global {
  interface Error {
    statusCode?: number;
    status?: number;
  }
}

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
 * Handles the case when an invalid path is requested.
 */
const invalidPathHandler = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(EC_NOT_FOUND).send("invalid path");
};

/**
 * Logs the error stack and message, and passes the error to the next middleware.
 */
function logError(err: Error, _req: Request, _res: Response, next: NextFunction): void {
  log.error(err.stack ?? "No stack trace available");
  log.error(err.message);
  next(err);
}

/**
 * Rolls back the current transaction if any.
 */
function rollbackTransaction(err: Error, req: Request, _res: Response, next: NextFunction): void {
  const client = req.dbClient;
  if (client) {
    req.dbClient = undefined;
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
 * send error to the client
 */
function clientErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode || err.status || EC_BAD_REQUEST;
  res.status(status).send(err.message);
}

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
function errorHandler(app) {
  // Mandatory error handlers
  app.use(logError);
  // Mandatory if the service uses Postgre
  app.use(rollbackTransaction);
  app.use(clientErrorHandler);
  app.use(invalidPathHandler);
}

export {
  errorHandler,
  EC_BAD_REQUEST,
  EC_UNAUTHORIZED,
  EC_FORBIDDEN,
  EC_NOT_FOUND,
  EC_MALFORMED_SYNTAX,
  EC_INTERNAL_ERROR,
  EC_CONFLICT,
  EC_TOO_MANY_REQUESTS,
  EC_SERVICE_UNAVAILABLE
};
