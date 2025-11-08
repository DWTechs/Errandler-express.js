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

import type { Application } from 'express';

declare const EC_CLIENT_BAD_REQUEST = 400;
declare const EC_CLIENT_UNAUTHORIZED = 401;
declare const EC_CLIENT_FORBIDDEN = 403;
declare const EC_CLIENT_NOT_FOUND = 404;
declare const EC_CLIENT_CONFLICT = 409;
declare const EC_CLIENT_MALFORMED_SYNTAX = 422;
declare const EC_CLIENT_TOO_MANY_REQUESTS = 429;
declare const EC_SERVER_INTERNAL_ERROR = 500;
declare const EC_SERVER_SERVICE_UNAVAILABLE = 503;
declare function errorHandler(app: Application): void;

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


