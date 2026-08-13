// Errandler-express does not export the individual middlewares that
// `errorHandler(app)` composes. Tests extract them by observing what
// `errorHandler` registers on a fake app whose `use` is a jest mock.
// Order of app.use() calls (defined in src/error.ts → errorHandler):
//   0 → logError, 1 → rollbackTransaction, 2 → clientErrorHandler, 3 → invalidPathHandler

jest.mock("@dwtechs/winstan", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { errorHandler } = require("../dist/errandler-express.js");
const { log } = require("@dwtechs/winstan");

function extractMiddlewares() {
  const app = { use: jest.fn() };
  errorHandler(app);
  const [logError, rollbackTransaction, clientErrorHandler, invalidPathHandler] =
    app.use.mock.calls.map((c) => c[0]);
  return { logError, rollbackTransaction, clientErrorHandler, invalidPathHandler };
}

describe("logError middleware", () => {
  let logError;
  let req, res, next;

  beforeAll(() => {
    ({ logError } = extractMiddlewares());
  });

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Real Error instances (have a .stack)", () => {

    it("logs err.stack on a single line", () => {
      const err = new Error("boom");
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith(err.stack);
    });

    it("does not log err.message separately when stack is present", () => {
      const err = new Error("boom");
      logError(err, req, res, next);

      // Old behavior would log the message on a second line - regression guard.
      const calls = log.error.mock.calls.map((c) => c[0]);
      expect(calls).not.toContain("boom");
    });

    it("propagates the same error via next(err)", () => {
      const err = new Error("boom");
      logError(err, req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(err);
    });

    it("still handles Errors that were stripped of their stack", () => {
      const err = new Error("stackless");
      // Explicitly kill the stack to exercise the fallback branch.
      err.stack = undefined;
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledTimes(1);
      // Falls through to the "no stack" branch → logs the message (no status here).
      expect(log.error).toHaveBeenCalledWith("stackless");
      expect(next).toHaveBeenCalledWith(err);
    });

  });

  describe("Plain next({ statusCode, message })-style errors (no stack)", () => {

    it("logs '<statusCode> <message>' on a single line", () => {
      const err = { statusCode: 400, message: "Missing hash from the database" };
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith("400 Missing hash from the database");
      expect(next).toHaveBeenCalledWith(err);
    });

    it("falls back to err.status when err.statusCode is absent", () => {
      const err = { status: 404, message: "Not found" };
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledWith("404 Not found");
    });

    it("prefers statusCode over status when both are present", () => {
      const err = { statusCode: 401, status: 500, message: "Unauthorized" };
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledWith("401 Unauthorized");
    });

    it("logs just the message when no statusCode nor status is set", () => {
      const err = { message: "orphan message" };
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledWith("orphan message");
    });

    it("serializes the error object when it has neither message nor stack", () => {
      const err = { statusCode: 500 };
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledWith('500 {"statusCode":500}');
    });

  });

  describe("Non-Error thrown values", () => {

    it("handles a thrown string", () => {
      logError("oops", req, res, next);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith("oops");
      expect(next).toHaveBeenCalledWith("oops");
    });

    it("handles an empty object with no message and no status", () => {
      const err = {};
      logError(err, req, res, next);

      expect(log.error).toHaveBeenCalledWith("{}");
    });

    it("handles null without throwing", () => {
      expect(() => logError(null, req, res, next)).not.toThrow();

      // null → no stack, no statusCode, no message; JSON.stringify(null) === "null".
      expect(log.error).toHaveBeenCalledWith("null");
      expect(next).toHaveBeenCalledWith(null);
    });

  });

  describe("Regression: single log line per error", () => {

    // The old logError emitted two lines: err.stack ?? "No stack trace available",
    // then err.message. Every test in this suite already asserts a single call,
    // but keep an explicit regression guard for the exact old sentinel string.

    it('never emits the literal "No stack trace available" sentinel', () => {
      const cases = [
        new Error("real"),
        { statusCode: 400, message: "plain" },
        { message: "no status" },
        "raw string",
        {},
        null,
      ];
      for (const err of cases) {
        jest.clearAllMocks();
        logError(err, req, res, next);
        const calls = log.error.mock.calls.map((c) => c[0]);
        expect(calls).not.toContain("No stack trace available");
      }
    });

  });
});
