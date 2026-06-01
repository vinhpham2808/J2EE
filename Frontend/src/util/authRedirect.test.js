import test from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_EXPIRED_ROUTE,
  redirectToExpiredSessionLogin,
  resetAuthRedirectState,
  shouldRedirectToLoginForAuthError,
} from "./authRedirect.js";

test("redirects protected routes with 401 to the expired login page", () => {
  resetAuthRedirectState();

  let redirectedTo = null;
  const redirected = redirectToExpiredSessionLogin({
    status: 401,
    pathname: "/dashboard",
    search: "",
    replace: (targetPath) => {
      redirectedTo = targetPath;
    },
  });

  assert.equal(redirected, true);
  assert.equal(redirectedTo, LOGIN_EXPIRED_ROUTE);
});

test("redirects protected routes with 403 to the expired login page", () => {
  resetAuthRedirectState();

  let redirectedTo = null;
  const redirected = redirectToExpiredSessionLogin({
    status: 403,
    pathname: "/expense",
    search: "",
    replace: (targetPath) => {
      redirectedTo = targetPath;
    },
  });

  assert.equal(redirected, true);
  assert.equal(redirectedTo, LOGIN_EXPIRED_ROUTE);
});

test("does not redirect public routes for auth errors", () => {
  resetAuthRedirectState();

  const redirected = redirectToExpiredSessionLogin({
    status: 401,
    pathname: "/login",
    search: "",
    replace: () => {
      throw new Error("should not redirect public paths");
    },
  });

  assert.equal(redirected, false);
});

test("does not redirect non-auth errors", () => {
  assert.equal(shouldRedirectToLoginForAuthError(500, "/dashboard"), false);
});
