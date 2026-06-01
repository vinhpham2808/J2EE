const PUBLIC_AUTH_PATHS = new Set([
  "/",
  "/home",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/activate",
]);

const LOGIN_EXPIRED_ROUTE = "/login?expired=true";

let authRedirectInProgress = false;

export const resetAuthRedirectState = () => {
  authRedirectInProgress = false;
};

export const isPublicAuthPath = (pathname) => PUBLIC_AUTH_PATHS.has(pathname);

export const shouldRedirectToLoginForAuthError = (status, pathname) => {
  const isAuthError = status === 401 || status === 403;
  return isAuthError && !isPublicAuthPath(pathname);
};

export const redirectToExpiredSessionLogin = ({
  status,
  pathname = window.location.pathname,
  search = window.location.search,
  replace = (targetPath) => window.location.replace(targetPath),
} = {}) => {
  if (!shouldRedirectToLoginForAuthError(status, pathname)) {
    return false;
  }

  if (authRedirectInProgress) {
    return false;
  }

  if (`${pathname}${search}` === LOGIN_EXPIRED_ROUTE) {
    return false;
  }

  authRedirectInProgress = true;
  replace(LOGIN_EXPIRED_ROUTE);
  return true;
};

export { LOGIN_EXPIRED_ROUTE, PUBLIC_AUTH_PATHS };
