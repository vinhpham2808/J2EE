import { PAYMENT_PLANS } from "../paymentPlans";

describe("paymentPlans", () => {
  test("exports exactly 2 plans", () => {
    expect(PAYMENT_PLANS).toHaveLength(2);
  });

  test("premium plan has correct structure", () => {
    const premium = PAYMENT_PLANS.find((p) => p.id === "premium");
    expect(premium).toBeDefined();
    expect(premium.amount).toBe(299000);
    expect(premium.originalAmount).toBe(399000);
    expect(premium.featured).toBe(true);
    expect(premium.icon).toBe("sparkles-outline");
    expect(premium.featuresKeys).toHaveLength(4);
  });

  test("basic plan has correct structure", () => {
    const basic = PAYMENT_PLANS.find((p) => p.id === "basic");
    expect(basic).toBeDefined();
    expect(basic.amount).toBe(2000);
    expect(basic.featured).toBeUndefined();
    expect(basic.icon).toBe("shield-checkmark-outline");
    expect(basic.featuresKeys).toHaveLength(4);
  });

  test("every plan has all required fields", () => {
    PAYMENT_PLANS.forEach((plan) => {
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("displayNameKey");
      expect(plan).toHaveProperty("descriptionKey");
      expect(plan).toHaveProperty("amount");
      expect(plan).toHaveProperty("cycleLabelKey");
      expect(plan).toHaveProperty("icon");
      expect(plan).toHaveProperty("featuresKeys");
    });
  });

  test("premium amount is higher than basic", () => {
    const premium = PAYMENT_PLANS.find((p) => p.id === "premium");
    const basic = PAYMENT_PLANS.find((p) => p.id === "basic");
    expect(premium.amount).toBeGreaterThan(basic.amount);
  });

  test("premium has original amount (discount) while basic does not", () => {
    const premium = PAYMENT_PLANS.find((p) => p.id === "premium");
    const basic = PAYMENT_PLANS.find((p) => p.id === "basic");
    expect(premium.originalAmount).toBeDefined();
    expect(premium.originalAmount).toBeGreaterThan(premium.amount);
    expect(basic.originalAmount).toBeUndefined();
  });
});
