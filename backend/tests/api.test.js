process.env.NODE_ENV = "test";
import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { queryClient } from "../src/config/database.js";

let server;
let baseUrl;

// Start server on an ephemeral port for testing
test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

// Close server and database connections after tests
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await queryClient.end();
});

test("API Health Check: GET /api/health returns 200 with DB status", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.database.connected, true);
});

test("Authentication Flow: Register, Duplicate Prevention, Login, and Protected /me", async () => {
  const testEmail = `analyst_${Date.now()}@terminal.com`;
  const testPassword = "StrongPassword2026!";
  const testName = "Senior Equity Analyst";

  // 1. Test Registration
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.equal(regRes.status, 201);
  const regJson = await regRes.json();
  assert.equal(regJson.success, true);
  assert.equal(regJson.data.user.email, testEmail);
  assert.equal(regJson.data.user.role, "analyst");
  assert.ok(regJson.data.token, "Token should be returned");
  assert.equal(regJson.data.user.passwordHash, undefined, "Password hash must not be exposed");

  const authToken = regJson.data.token;

  // 2. Test Duplicate Registration (Should return 409 Conflict)
  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
    }),
  });
  assert.equal(dupRes.status, 409);
  const dupJson = await dupRes.json();
  assert.equal(dupJson.success, false);
  assert.equal(dupJson.error.code, "EMAIL_ALREADY_EXISTS");

  // 3. Test Login with Valid Credentials
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  assert.equal(loginRes.status, 200);
  const loginJson = await loginRes.json();
  assert.equal(loginJson.success, true);
  assert.ok(loginJson.data.token);

  // 4. Test Login with Wrong Password (Should return 401)
  const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "WrongPassword!",
    }),
  });
  assert.equal(wrongLoginRes.status, 401);
  const wrongJson = await wrongLoginRes.json();
  assert.equal(wrongJson.success, false);
  assert.equal(wrongJson.error.code, "INVALID_CREDENTIALS");

  // 5. Test Accessing Protected /me with Valid Token
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  assert.equal(meRes.status, 200);
  const meJson = await meRes.json();
  assert.equal(meJson.success, true);
  assert.equal(meJson.data.email, testEmail);

  // 6. Test Accessing Protected /me Without Token (Should return 401)
  const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(noTokenRes.status, 401);
  const noTokenJson = await noTokenRes.json();
  assert.equal(noTokenJson.error.code, "TOKEN_MISSING");

  // 7. Test Accessing Protected /me With Invalid Token (Should return 401)
  const invalidTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Authorization: "Bearer invalid.token.value",
    },
  });
  assert.equal(invalidTokenRes.status, 401);
  const invalidTokenJson = await invalidTokenRes.json();
  assert.equal(invalidTokenJson.error.code, "TOKEN_INVALID");

  // 8. Test Logout
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  assert.equal(logoutRes.status, 200);
});
