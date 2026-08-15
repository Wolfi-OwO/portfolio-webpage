'use strict';

// Loaded via mocha's --require flag before any test file (and therefore
// before server.js) so the required auth env vars are present at import time.
// Run the HTTP server on an OS-assigned free port during tests instead of the
// production 8080, so a real server already listening on 8080 is never the
// reason a mocha run fails.
process.env.PORT ??= '0';
process.env.JWT_SECRET ??= 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.ADMIN_USER ??= 'admin';
process.env.ADMIN_PASSWORD ??= 'test-admin-password';
process.env.ADMIN_PASSWORD_HASH ??= '$2b$12$zhs0g9j.UDhRBaxBC30D4e5YC8mJr.ec9suU8ajj6Q8ONgnths6.q';
