import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyReportAiChatRequest } from "./monthlyReportAiRequest.js";

test("builds the monthly report AI analysis request payload", () => {
  const prompt = "Phan tich hanh vi tai chinh thang 5";

  assert.deepEqual(buildMonthlyReportAiChatRequest(prompt), {
    prompt,
  });
});
