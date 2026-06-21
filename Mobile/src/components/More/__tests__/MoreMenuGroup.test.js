import { getMoreMenuGroups } from "../MoreMenuGroup";

describe("getMoreMenuGroups", () => {
  test("returns correct list of menu groups with expected keys", () => {
    const mockT = jest.fn((k) => `translated_${k}`);
    const groups = getMoreMenuGroups(mockT);

    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBe(6);

    const keys = groups.map(g => g.key);
    expect(keys).toContain("account");
    expect(keys).toContain("customization");
    expect(keys).toContain("finance");
    expect(keys).toContain("app-info");
    expect(keys).toContain("notifications");
    expect(keys).toContain("appearance");

    // Check account items
    const accountGroup = groups.find(g => g.key === "account");
    expect(accountGroup.title).toBe("translated_more.groups.account");
    expect(accountGroup.items.length).toBe(3);
    expect(accountGroup.items[0].key).toBe("edit-profile");
    expect(accountGroup.items[1].key).toBe("payment");
    expect(accountGroup.items[2].key).toBe("payment-history");

    // Check appearance item
    const appearanceGroup = groups.find(g => g.key === "appearance");
    expect(appearanceGroup.items[0].key).toBe("dark-mode");
    expect(appearanceGroup.items[0].isSwitch).toBe(true);
  });
});
