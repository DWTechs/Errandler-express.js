
# 0.1.1 (Aug 10th 2026)

- `logError` now emits a single log line per error instead of two:
  - Real `Error` instances → log `err.stack` (which already begins with the message).
  - Plain `next({ statusCode, message })`-style errors → log `"<statusCode> <message>"`
    (e.g. `"400 Passken-express: Missing hash from the database…"`) instead of
    the previous `"No stack trace available"` + separate `err.message` pair.
  - Thrown strings or objects without `.message` → log a JSON dump.
- Package configuration updates:
  - Added `"type": "module"` for native ESM support.
  - Added `"exports"` field to support standard ESM entry points.
  - Added `"sideEffects": false`, `"engines": { "node": ">=22" }`, and `"publishConfig"`.
  - Upgraded dependencies: `@dwtechs/winstan` to `0.7.1`, `@types/express` to `5.0.6`, `typescript` to `6.0.3`.
  - Updated TS configuration to `ES2022` with `bundler` module resolution.

# 0.1.0 (Oct 31th 2025)

- Initial release
