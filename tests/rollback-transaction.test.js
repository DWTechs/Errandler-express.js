jest.mock("@dwtechs/winstan", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { errorHandler } = require("../dist/errandler-express.js");

function extractMiddlewares() {
  const app = { use: jest.fn() };
  errorHandler(app);
  const [logError, rollbackTransaction, clientErrorHandler, invalidPathHandler] =
    app.use.mock.calls.map((c) => c[0]);
  return { logError, rollbackTransaction, clientErrorHandler, invalidPathHandler };
}

// The middleware fires the ROLLBACK query but doesn't await it — it calls
// next(err) synchronously so the response can flow forward. `client.release()`
// runs inside `.finally()`, so tests must flush microtasks + one macrotask tick
// to observe it.
const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

describe("rollbackTransaction middleware", () => {
  let rollbackTransaction;
  let req, res, next, err;

  beforeAll(() => {
    ({ rollbackTransaction } = extractMiddlewares());
  });

  beforeEach(() => {
    req = {};
    res = { locals: {} };
    next = jest.fn();
    err = new Error("boom");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("No active dbClient", () => {

    it("passes the error straight through when res.locals.dbClient is undefined", () => {
      rollbackTransaction(err, req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(err);
    });

    it("does not attempt to touch res.locals when dbClient is absent", () => {
      const localsBefore = { ...res.locals };
      rollbackTransaction(err, req, res, next);

      expect(res.locals).toEqual(localsBefore);
    });

  });

  describe("Active dbClient — happy path", () => {

    let client;

    beforeEach(() => {
      client = {
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };
      res.locals.dbClient = client;
    });

    it("issues a ROLLBACK query on the client", () => {
      rollbackTransaction(err, req, res, next);

      expect(client.query).toHaveBeenCalledTimes(1);
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("clears res.locals.dbClient synchronously to prevent re-use", () => {
      rollbackTransaction(err, req, res, next);

      expect(res.locals.dbClient).toBeUndefined();
    });

    it("calls next(err) synchronously — does not block on the ROLLBACK", () => {
      rollbackTransaction(err, req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(err);
    });

    it("releases the client back to the pool after ROLLBACK settles", async () => {
      rollbackTransaction(err, req, res, next);

      // release() is scheduled inside .finally() on the ROLLBACK promise.
      expect(client.release).not.toHaveBeenCalled();
      await flushAsync();
      expect(client.release).toHaveBeenCalledTimes(1);
    });

  });

  describe("Active dbClient — ROLLBACK rejects", () => {

    it("still releases the client and does not throw", async () => {
      const client = {
        query: jest.fn().mockRejectedValue(new Error("connection lost")),
        release: jest.fn(),
      };
      res.locals.dbClient = client;

      // The synchronous portion must not throw even if the underlying query rejects.
      expect(() => rollbackTransaction(err, req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalledWith(err);

      await flushAsync();
      expect(client.release).toHaveBeenCalledTimes(1);
    });

  });

  describe("Active dbClient — release() throws", () => {

    it("swallows release() errors silently", async () => {
      const client = {
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(() => {
          throw new Error("pool closed");
        }),
      };
      res.locals.dbClient = client;

      rollbackTransaction(err, req, res, next);
      // The `try {} catch {}` around release() must not surface an unhandled rejection.
      await expect(flushAsync()).resolves.not.toThrow();
      expect(client.release).toHaveBeenCalledTimes(1);
    });

  });
});
