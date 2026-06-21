import { appNavigationRef } from "../navigationRef";

describe("navigationRef", () => {
  it("initializes with current as null", () => {
    expect(appNavigationRef.current).toBeNull();
  });

  it("can hold a reference to navigation object", () => {
    const mockNavigation = { navigate: jest.fn() };
    appNavigationRef.current = mockNavigation;
    expect(appNavigationRef.current).toBe(mockNavigation);
    appNavigationRef.current = null; // Clean up
  });
});
