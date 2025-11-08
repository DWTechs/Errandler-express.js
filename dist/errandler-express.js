/*
MIT License

Copyright (c) 2025 DWTechs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/DWTechs/Errandler-express.js
*/

import { log } from '@dwtechs/winstan';

const EC_CLIENT_BAD_REQUEST = 400;
const EC_CLIENT_UNAUTHORIZED = 401;
const EC_CLIENT_FORBIDDEN = 403;
const EC_CLIENT_NOT_FOUND = 404;
const EC_CLIENT_CONFLICT = 409;
const EC_CLIENT_MALFORMED_SYNTAX = 422;
const EC_CLIENT_TOO_MANY_REQUESTS = 429;
const EC_SERVER_INTERNAL_ERROR = 500;
const EC_SERVER_SERVICE_UNAVAILABLE = 503;
const invalidPathHandler = (_req, res, _next) => {
    res.status(EC_CLIENT_NOT_FOUND).send("invalid path");
};
function logError(err, _req, _res, next) {
    var _a;
    log.error((_a = err.stack) !== null && _a !== void 0 ? _a : "No stack trace available");
    log.error(err.message);
    next(err);
}
function rollbackTransaction(err, _req, res, next) {
    const client = res.locals.dbClient;
    if (client) {
        res.locals.dbClient = undefined;
        client
            .query("ROLLBACK")
            .catch((err) => err)
            .finally(() => {
            try {
                client.release();
            }
            catch (_a) { }
        });
    }
    next(err);
}
function clientErrorHandler(err, _req, res, _next) {
    const status = err.statusCode || err.status || EC_CLIENT_BAD_REQUEST;
    res.status(status).send(err.message);
}
function errorHandler(app) {
    app.use(logError);
    app.use(rollbackTransaction);
    app.use(clientErrorHandler);
    app.use(invalidPathHandler);
}

export { EC_CLIENT_BAD_REQUEST, EC_CLIENT_CONFLICT, EC_CLIENT_FORBIDDEN, EC_CLIENT_MALFORMED_SYNTAX, EC_CLIENT_NOT_FOUND, EC_CLIENT_TOO_MANY_REQUESTS, EC_CLIENT_UNAUTHORIZED, EC_SERVER_INTERNAL_ERROR, EC_SERVER_SERVICE_UNAVAILABLE, errorHandler };
