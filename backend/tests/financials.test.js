import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { queryClient } from "../src/config/database.js";
import {
  calculateGrossMargin,
  calculateOperatingMargin,
  calculateNetMargin,
  calculateRoE,
  calculateDebtToEquity,
  calculateFreeCashFlow,
  calculateAllRatios,
} from "../src/services/financial.service.js";

let server;
let baseUrl;

// Start server on an ephemeral port before running API tests
test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

// Clean up server and database connections after tests
test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await queryClient.end();
});

// --- UNIT TESTS: DETERMINISTIC FINANCIAL MATH ---

test("Financial Math: Exact ratio calculations", () => {
  // Test ITC FY24 figures: Revenue 76825, Gross Profit 43500, Operating Profit 24800, Net Profit 20450, Equity 72500, Debt 50
  const grossMargin = calculateGrossMargin(43500, 76825);
  assert.equal(grossMargin, 56.62, "Gross margin should be 56.62%");

  const operatingMargin = calculateOperatingMargin(24800, 76825);
  assert.equal(operatingMargin, 32.28, "Operating margin should be 32.28%");

  const netMargin = calculateNetMargin(20450, 76825);
  assert.equal(netMargin, 26.62, "Net margin should be 26.62%");

  const roe = calculateRoE(20450, 72500);
  assert.equal(roe, 28.21, "Return on equity should be 28.21%");

  const debtToEquity = calculateDebtToEquity(50, 72500);
  assert.equal(debtToEquity, 0.0, "Debt-to-Equity should be 0.00");

  const freeCashFlow = calculateFreeCashFlow(21300, 2400);
  assert.equal(freeCashFlow, 18900, "Free Cash Flow should be 18900");
});

test("Financial Math: Safe handling of zero and invalid values", () => {
  assert.equal(calculateGrossMargin(100, 0), 0);
  assert.equal(calculateOperatingMargin(100, null), 0);
  assert.equal(calculateNetMargin(100, undefined), 0);
  assert.equal(calculateRoE(100, 0), 0);
  assert.equal(calculateDebtToEquity(100, 0), 0);
  assert.equal(calculateFreeCashFlow(null, null), 0);
});

// --- INTEGRATION TESTS: COMPANY & FINANCIAL ENDPOINTS ---

test("Company API: Search companies by ticker or name", async () => {
  // Search for 'itc'
  const res = await fetch(`${baseUrl}/api/companies?search=itc`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length > 0);

  const itc = json.data.find((c) => c.ticker === "ITC");
  assert.ok(itc, "ITC should be present in search results");
  assert.equal(itc.name, "ITC Limited");
  assert.equal(itc.exchange, "NSE");

  // Search for non-existent company
  const emptyRes = await fetch(`${baseUrl}/api/companies?search=xyz_does_not_exist_999`);
  assert.equal(emptyRes.status, 200);
  const emptyJson = await emptyRes.json();
  assert.equal(emptyJson.data.length, 0);
});

test("Company API: Get company details by ticker", async () => {
  // Valid ticker (case insensitive)
  const res = await fetch(`${baseUrl}/api/companies/itc`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.ticker, "ITC");
  assert.equal(json.data.sector, "Consumer Goods");
  assert.equal(json.data.industry, "Tobacco & FMCG");
  assert.ok(json.data.description.includes("ITC Limited"));

  // Non-existent ticker returns 404
  const notFoundRes = await fetch(`${baseUrl}/api/companies/UNKNOWN_TICKER`);
  assert.equal(notFoundRes.status, 404);
  const notFoundJson = await notFoundRes.json();
  assert.equal(notFoundJson.success, false);
  assert.equal(notFoundJson.error.code, "COMPANY_NOT_FOUND");
});

test("Company API: Get annual historical financials with computed ratios", async () => {
  const res = await fetch(`${baseUrl}/api/companies/ITC/financials?period=annual`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.ticker, "ITC");
  assert.equal(json.data.periodType, "annual");

  const periods = json.data.periods;
  assert.ok(periods.length >= 1, "Should have annual financial periods");

  // Verify period structure and pre-computed ratios on first period
  const period = periods[0];
  assert.ok(period.fiscalYear, "Fiscal year must exist");
  assert.ok(period.revenue > 0, "Revenue should be positive");
  assert.ok(period.ratios, "Ratios object should be included");
  assert.ok(typeof period.ratios.operatingMargin === "number", "Operating margin should be numeric");
  assert.ok(typeof period.ratios.netMargin === "number", "Net margin should be numeric");
});

test("Company API: Get quarterly financials for ITC", async () => {
  const res = await fetch(`${baseUrl}/api/companies/ITC/financials?period=quarterly`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.periodType, "quarterly");

  const periods = json.data.periods;
  assert.ok(periods.length >= 1, "Should have quarterly periods");
  assert.ok(periods[0].fiscalQuarter, "Quarter identifier must exist");
  assert.ok(periods[0].revenue > 0, "Quarterly revenue should be positive");
});
