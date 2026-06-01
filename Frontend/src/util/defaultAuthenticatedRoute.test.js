import test from "node:test";
import assert from "node:assert/strict";
import { getPostAuthRedirectPath } from "./defaultAuthenticatedRoute.js";

test("routes admin users to the shared dashboard after authentication", () => {
  assert.equal(getPostAuthRedirectPath({ role: "admin" }), "/dashboard");
});

test("routes standard users to the shared dashboard after authentication", () => {
  assert.equal(getPostAuthRedirectPath({ role: "user" }), "/dashboard");
});

test("falls back to the shared dashboard when user data is missing", () => {
  assert.equal(getPostAuthRedirectPath(null), "/dashboard");
});
