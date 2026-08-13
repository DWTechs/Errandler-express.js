jest.mock("@dwtechs/winstan", () => ({
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  EC_CLIENT_BAD_REQUEST,
  EC_CLIENT_UNAUTHORIZED,
  EC_CLIENT_FORBIDDEN,
  EC_CLIENT_NOT_FOUND,
  EC_CLIENT_CONFLICT,
  EC_CLIENT_MALFORMED_SYNTAX,
  EC_CLIENT_TOO_MANY_REQUESTS,
  EC_SERVER_INTERNAL_ERROR,
  EC_SERVER_SERVICE_UNAVAILABLE,
} = require("../dist/errandler-express.js");

describe("Exported HTTP status code constants", () => {

  describe("Client errors (4xx)", () => {

    it("EC_CLIENT_BAD_REQUEST === 400", () => {
      expect(EC_CLIENT_BAD_REQUEST).toBe(400);
    });

    it("EC_CLIENT_UNAUTHORIZED === 401", () => {
      expect(EC_CLIENT_UNAUTHORIZED).toBe(401);
    });

    it("EC_CLIENT_FORBIDDEN === 403", () => {
      expect(EC_CLIENT_FORBIDDEN).toBe(403);
    });

    it("EC_CLIENT_NOT_FOUND === 404", () => {
      expect(EC_CLIENT_NOT_FOUND).toBe(404);
    });

    it("EC_CLIENT_CONFLICT === 409", () => {
      expect(EC_CLIENT_CONFLICT).toBe(409);
    });

    it("EC_CLIENT_MALFORMED_SYNTAX === 422", () => {
      expect(EC_CLIENT_MALFORMED_SYNTAX).toBe(422);
    });

    it("EC_CLIENT_TOO_MANY_REQUESTS === 429", () => {
      expect(EC_CLIENT_TOO_MANY_REQUESTS).toBe(429);
    });

  });

  describe("Server errors (5xx)", () => {

    it("EC_SERVER_INTERNAL_ERROR === 500", () => {
      expect(EC_SERVER_INTERNAL_ERROR).toBe(500);
    });

    it("EC_SERVER_SERVICE_UNAVAILABLE === 503", () => {
      expect(EC_SERVER_SERVICE_UNAVAILABLE).toBe(503);
    });

  });

  describe("Coverage", () => {

    it("exports one constant per unique HTTP status in the 400/500 families used by this lib", () => {
      const all = [
        EC_CLIENT_BAD_REQUEST,
        EC_CLIENT_UNAUTHORIZED,
        EC_CLIENT_FORBIDDEN,
        EC_CLIENT_NOT_FOUND,
        EC_CLIENT_CONFLICT,
        EC_CLIENT_MALFORMED_SYNTAX,
        EC_CLIENT_TOO_MANY_REQUESTS,
        EC_SERVER_INTERNAL_ERROR,
        EC_SERVER_SERVICE_UNAVAILABLE,
      ];
      // Each constant is a distinct integer in [400, 600).
      const unique = new Set(all);
      expect(unique.size).toBe(all.length);
      for (const code of all) {
        expect(Number.isInteger(code)).toBe(true);
        expect(code).toBeGreaterThanOrEqual(400);
        expect(code).toBeLessThan(600);
      }
    });

  });

});
