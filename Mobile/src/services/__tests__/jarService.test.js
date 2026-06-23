jest.mock("../apiClient", () => ({ get: jest.fn() }));

import { fetchJars } from "../jarService";

describe("jarService", () => {
  const apiClient = require("../apiClient");

  beforeEach(() => { jest.clearAllMocks(); });

  describe("fetchJars", () => {
    test("returns data array on success", async () => {
      const mockData = [{ id: 1, name: "Emergency", balance: 1000 }];
      apiClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchJars();
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith("/jars");
    });

    test("returns empty array when response data is not an array", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await fetchJars();
      expect(result).toEqual([]);
    });
  });
});
