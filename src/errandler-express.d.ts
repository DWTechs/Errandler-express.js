import type { Request, Response, NextFunction } from 'express';

declare function getConsumer(req: Request, res: Response, next: NextFunction): void;

export { 
  use,
  EC_BAD_REQUEST,
  EC_UNAUTHORIZED,
  EC_FORBIDDEN,
  EC_NOT_FOUND,
  EC_MALFORMED_SYNTAX,
  EC_INTERNAL_ERROR,
  EC_CONFLICT,
  EC_TOO_MANY_REQUESTS,
  EC_SERVICE_UNAVAILABLE,
};


