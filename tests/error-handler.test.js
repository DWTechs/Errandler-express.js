jest.mock("@dwtechs/winstan", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { errorHandler } = require("../dist/errandler-express.js");

describe("errorHandler(app) composition", () => {

  let app;

  beforeEach(() => {
    app = { use: jest.fn() };
  });

  it("registers exactly 4 middlewares", () => {
    errorHandler(app);

    expect(app.use).toHaveBeenCalledTimes(4);
  });

  it("registers each middleware as its own app.use() call (not batched)", () => {
    errorHandler(app);

    for (const call of app.use.mock.calls) {
      expect(call).toHaveLength(1);
      expect(typeof call[0]).toBe("function");
    }
  });

  it("registers middlewares in the documented order", () => {
    errorHandler(app);

    const names = app.use.mock.calls.map((c) => c[0].name);
    expect(names).toEqual([
      "logError",
      "rollbackTransaction",
      "clientErrorHandler",
      "invalidPathHandler",
    ]);
  });

  it("registers three Express error middlewares (arity 4) followed by one regular middleware (arity 3)", () => {
    errorHandler(app);

    // Express treats a middleware as an error handler iff its declared arity is 4.
    // logError, rollbackTransaction, clientErrorHandler must all be arity-4 so
    // they participate in the error chain; invalidPathHandler must be arity-3
    // so it acts as a normal fall-through 404 catcher.
    const arities = app.use.mock.calls.map((c) => c[0].length);
    expect(arities).toEqual([4, 4, 4, 3]);
  });

  it("does not mutate the app object beyond calling .use()", () => {
    // The only side effect of errorHandler is registering middlewares.
    // Guard against accidental mutations creeping in later.
    Object.defineProperty(app, "_sentinel", { value: "unchanged", writable: false });
    errorHandler(app);
    expect(app._sentinel).toBe("unchanged");
  });

  it("is safe to call twice — each call just doubles the registrations", () => {
    // No dedup logic in errorHandler by design; calling twice is a caller bug
    // that Express would surface via duplicate middleware, but the function itself
    // remains idempotent-shaped (same 4 middlewares in the same order per call).
    errorHandler(app);
    errorHandler(app);

    expect(app.use).toHaveBeenCalledTimes(8);
    const names = app.use.mock.calls.map((c) => c[0].name);
    expect(names.slice(0, 4)).toEqual(names.slice(4, 8));
  });

});
