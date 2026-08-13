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

describe("invalidPathHandler middleware", () => {
  let invalidPathHandler;
  let req, res, next;

  beforeAll(() => {
    ({ invalidPathHandler } = extractMiddlewares());
  });

  beforeEach(() => {
    req = { originalUrl: "/does/not/exist" };
    res = makeRes();
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('responds with 404 "invalid path"', () => {
    invalidPathHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("invalid path");
  });

  it("does not call next() — this is a terminal 404 catcher", () => {
    invalidPathHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it("emits status and send in the correct order", () => {
    invalidPathHandler(req, res, next);

    // res.status(...).send(...) chains; assert status resolved before send.
    const statusCall = res.status.mock.invocationCallOrder[0];
    const sendCall = res.send.mock.invocationCallOrder[0];
    expect(statusCall).toBeLessThan(sendCall);
  });

  it("is a 3-arg regular middleware (not an error middleware)", () => {
    // Express distinguishes error vs. regular middlewares by function.length:
    // error middleware = 4, regular = 3. invalidPathHandler must be 3 so Express
    // treats it as a fall-through 404 catcher instead of an error handler.
    expect(invalidPathHandler.length).toBe(3);
  });
});
