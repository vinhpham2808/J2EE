import test from "node:test";
import assert from "node:assert/strict";
import {
  isActionIntent,
  isExportEmailIntent,
  normalizeAmountInput,
} from "./aiIntentParser.js";

test("identifies only export and email intents for client-side execution", () => {
  assert.equal(isExportEmailIntent("EXPORT_EXCEL_EXPENSE"), true);
  assert.equal(isExportEmailIntent("EXPORT_EXCEL_INCOME"), true);
  assert.equal(isExportEmailIntent("EMAIL_EXPENSE_REPORT"), true);
  assert.equal(isExportEmailIntent("EMAIL_INCOME_REPORT"), true);

  assert.equal(isExportEmailIntent("CREATE_EXPENSE"), false);
  assert.equal(isExportEmailIntent("CREATE_INCOME"), false);
  assert.equal(isExportEmailIntent("CREATE_JAR"), false);
  assert.equal(isExportEmailIntent("TRANSFER_JAR"), false);
  assert.equal(isExportEmailIntent(null), false);
});

test("keeps broad ACTION intent classification separate from export/email handling", () => {
  assert.equal(isActionIntent("CREATE_EXPENSE", "ACTION"), true);
  assert.equal(isExportEmailIntent("CREATE_EXPENSE"), false);
});

test("normalizes shorthand amount inputs before sending to the backend", () => {
  assert.equal(normalizeAmountInput("80k"), 80000);
  assert.equal(normalizeAmountInput("1.5tr"), 1500000);
  assert.equal(normalizeAmountInput("2M"), 2000000);
  assert.equal(normalizeAmountInput("150 nghìn"), 150000);
  assert.equal(normalizeAmountInput("50000"), 50000);
  assert.equal(normalizeAmountInput(""), "");
});
