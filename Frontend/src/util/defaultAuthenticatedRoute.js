export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

export const getPostAuthRedirectPath = (user) => {
  void user;
  // Role-specific areas stay opt-in; every authenticated user lands on the shared dashboard.
  return DEFAULT_AUTHENTICATED_ROUTE;
};
