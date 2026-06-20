import { validatePasswordRequirements, isPasswordValid } from "../authPassword";

describe("validatePasswordRequirements", () => {
  test("returns false for all checks when password is empty", () => {
    const result = validatePasswordRequirements("");
    expect(result.hasNumber).toBe(false);
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasSpecial).toBe(false);
    expect(result.hasMinLength).toBe(false);
    expect(result.notTooLong).toBe(true);
  });

  test("detects number present", () => {
    expect(validatePasswordRequirements("abc1").hasNumber).toBe(true);
    expect(validatePasswordRequirements("abc").hasNumber).toBe(false);
  });

  test("detects uppercase letter", () => {
    expect(validatePasswordRequirements("Abc").hasUppercase).toBe(true);
    expect(validatePasswordRequirements("abc").hasUppercase).toBe(false);
  });

  test("detects lowercase letter", () => {
    expect(validatePasswordRequirements("Abc").hasLowercase).toBe(true);
    expect(validatePasswordRequirements("ABC").hasLowercase).toBe(false);
  });

  test("detects special character", () => {
    expect(validatePasswordRequirements("!").hasSpecial).toBe(true);
    expect(validatePasswordRequirements("a").hasSpecial).toBe(false);
  });

  test("validates min length (8)", () => {
    expect(validatePasswordRequirements("1234567").hasMinLength).toBe(false);
    expect(validatePasswordRequirements("12345678").hasMinLength).toBe(true);
  });

  test("validates max length (256)", () => {
    expect(validatePasswordRequirements("a".repeat(256)).notTooLong).toBe(true);
    expect(validatePasswordRequirements("a".repeat(257)).notTooLong).toBe(false);
  });
});

describe("isPasswordValid", () => {
  test("returns true when all requirements met", () => {
    const req = {
      hasNumber: true,
      hasUppercase: true,
      hasLowercase: true,
      hasSpecial: true,
      hasMinLength: true,
      notTooLong: true,
    };
    expect(isPasswordValid(req)).toBe(true);
  });

  test("returns false when any requirement is missing", () => {
    const base = { hasNumber: true, hasUppercase: true, hasLowercase: true, hasSpecial: true, hasMinLength: true, notTooLong: true };
    expect(isPasswordValid({ ...base, hasNumber: false })).toBe(false);
    expect(isPasswordValid({ ...base, hasUppercase: false })).toBe(false);
    expect(isPasswordValid({ ...base, hasLowercase: false })).toBe(false);
    expect(isPasswordValid({ ...base, hasSpecial: false })).toBe(false);
    expect(isPasswordValid({ ...base, hasMinLength: false })).toBe(false);
    expect(isPasswordValid({ ...base, notTooLong: false })).toBe(false);
  });

  test("validates a real strong password", () => {
    const req = validatePasswordRequirements("MyStr0ng!Pass");
    expect(isPasswordValid(req)).toBe(true);
  });

  test("rejects a weak password", () => {
    const req = validatePasswordRequirements("weak");
    expect(isPasswordValid(req)).toBe(false);
  });
});
