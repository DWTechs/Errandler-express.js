import type { Application } from 'express';
// declare global {
//     interface Error {
//         statusCode?: number;
//         status?: number;
//     }
// }
declare const EC_BAD_REQUEST = 400;
declare const EC_UNAUTHORIZED = 401;
declare const EC_FORBIDDEN = 403;
declare const EC_NOT_FOUND = 404;
declare const EC_CONFLICT = 409;
declare const EC_MALFORMED_SYNTAX = 422;
declare const EC_TOO_MANY_REQUESTS = 429;
declare const EC_INTERNAL_ERROR = 500;
declare const EC_SERVICE_UNAVAILABLE = 503;
declare function errorHandler(app: Application): void;
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


