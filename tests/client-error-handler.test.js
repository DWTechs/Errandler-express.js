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

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe("clientErrorHandler middleware", () => {
  let clientErrorHandler;
  let req, res, next;

  beforeAll(() => {
    ({ clientErrorHandler } = extractMiddlewares());
  });

  beforeEach(() => {
    req = {};
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Status code resolution", () => {

    it("uses err.statusCode when set", () => {
      clientErrorHandler({ statusCode: 401, message: "Unauthorized" }, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith("Unauthorized");
    });

    it("falls back to err.status when statusCode is absent", () => {
      clientErrorHandler({ status: 404, message: "Not found" }, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Not found");
    });

    it("prefers statusCode over status when both are set", () => {
      clientErrorHandler({ statusCode: 401, status: 500, message: "Unauthorized" }, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("defaults to 400 when neither is set", () => {
      clientErrorHandler({ message: "Something wrong" }, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Something wrong");
    });

    it("treats statusCode 0 as unset and defaults to 400", () => {
      // `err.statusCode || err.status || 400` — 0 is falsy and rolls forward,
      // which is the intended behavior (0 is not a valid HTTP status).
      clientErrorHandler({ statusCode: 0, message: "zero" }, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  });

  describe("Message forwarding", () => {

    it("sends the raw err.message string to the client", () => {
      clientErrorHandler({ statusCode: 422, message: "invalid email format" }, req, res, next);

      expect(res.send).toHaveBeenCalledWith("invalid email format");
    });

    it("sends undefined when the error has no message field", () => {
      clientErrorHandler({ statusCode: 500 }, req, res, next);

      // Express.send(undefined) sends an empty body; that's the documented default here.
      expect(res.send).toHaveBeenCalledWith(undefined);
    });

  });

  describe("Terminating middleware", () => {

    it("does not call next() — this is the final response emitter", () => {
      clientErrorHandler({ statusCode: 401, message: "nope" }, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

  });

  describe("Real Error instances", () => {

    it("reads statusCode from a real Error decorated with statusCode", () => {
      const err = new Error("Bad payload");
      err.statusCode = 422;
      clientErrorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith("Bad payload");
    });

  });
});
