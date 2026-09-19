# Sprint 3 Report — Companies & Financial Data Engine

**Sprint Goal**: Implement structured company and financial data management with deterministic ratio calculations and REST APIs.

---

## 1. What Was Built & Delivered

1. **Git Branch Workflow**:
   - Created and switched to working branch: `feature/companies-financial-data`.

2. **Deterministic Financial Math Service (`financial.service.js`)**:
   - Exact mathematical ratio calculations without relying on AI:
     - **Gross Margin**: `(Gross Profit / Revenue) * 100`
     - **Operating Margin**: `(Operating Profit / Revenue) * 100`
     - **Net Margin**: `(Net Profit / Revenue) * 100`
     - **Return on Equity (RoE)**: `(Net Profit / Shareholder Equity) * 100`
     - **Debt-to-Equity**: `Total Debt / Shareholder Equity`
     - **Free Cash Flow**: `Operating Cash Flow - Capital Expenditure`
   - Safe division-by-zero protection.
   - Clean rounding to 2 decimal places.

3. **Database Seeding (`seed.js`)**:
   - Script runnable anytime with `npm run db:seed`.
   - **Company Profile**: ITC Limited (NSE: `ITC`, Sector: Consumer Goods, Industry: Tobacco & FMCG).
   - **5 Years Annual Financials (FY2021 to FY2025)**:
     - Income Statement, Balance Sheet, and Cash Flow metrics.
   - **4 Quarters of FY2024 (Q1 to Q4)**:
     - For granular quarterly analysis.
   - Idempotent and clean re-execution.

4. **Company & Financial Query Service & Controllers**:
   - `GET /api/companies?search=itc`: Fuzzy search by ticker or name.
   - `GET /api/companies/:ticker`: Full company profile with 404 handling.
   - `GET /api/companies/:ticker/financials?period=annual|quarterly`: Financial statements with pre-computed ratios and numeric formatting.

---

## 2. Test Verification Summary

Running `npm test` runs both test suites (`api.test.js` and `financials.test.js`):

```text
✔ API Health Check: GET /api/health returns 200 with DB status
✔ Authentication Flow: Register, Duplicate Prevention, Login, and Protected /me
✔ Financial Math: Exact ratio calculations
✔ Financial Math: Safe handling of zero and invalid values
✔ Company API: Search companies by ticker or name
✔ Company API: Get company details by ticker
✔ Company API: Get annual historical financials with computed ratios
✔ Company API: Get quarterly financials for FY2024

Total tests: 8 | Passed: 8 | Failed: 0
Duration: ~1.2s
```

---

## 3. Next Sprint

* **Sprint 4 — React Frontend**:
  - Setup React + Vite frontend on port 5173.
  - Institutional dark theme with Tailwind CSS.
  - Company search, profile page, and financial charts (Recharts).
