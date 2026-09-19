// Financial Service: Deterministic Financial Ratio Calculations
// This file does all the math for financial statements.
// It never uses AI to guess numbers. Everything is computed with exact formulas.

// Helper function to round numbers to 2 decimal places
export const roundToTwo = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return 0;
  }
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

// 1. Gross Margin (%): (Gross Profit / Total Revenue) * 100
export const calculateGrossMargin = (grossProfit, revenue) => {
  const rev = Number(revenue);
  const gp = Number(grossProfit);
  if (!rev || rev === 0) return 0;
  return roundToTwo((gp / rev) * 100);
};

// 2. Operating Margin (%): (Operating Profit / Total Revenue) * 100
export const calculateOperatingMargin = (operatingProfit, revenue) => {
  const rev = Number(revenue);
  const op = Number(operatingProfit);
  if (!rev || rev === 0) return 0;
  return roundToTwo((op / rev) * 100);
};

// 3. Net Margin (%): (Net Profit / Total Revenue) * 100
export const calculateNetMargin = (netProfit, revenue) => {
  const rev = Number(revenue);
  const np = Number(netProfit);
  if (!rev || rev === 0) return 0;
  return roundToTwo((np / rev) * 100);
};

// 4. Return on Equity (RoE %): (Net Profit / Shareholder Equity) * 100
export const calculateRoE = (netProfit, shareholderEquity) => {
  const eq = Number(shareholderEquity);
  const np = Number(netProfit);
  if (!eq || eq === 0) return 0;
  return roundToTwo((np / eq) * 100);
};

// 5. Debt to Equity Ratio: Total Debt / Shareholder Equity
export const calculateDebtToEquity = (totalDebt, shareholderEquity) => {
  const eq = Number(shareholderEquity);
  const debt = Number(totalDebt);
  if (!eq || eq === 0) return 0;
  return roundToTwo(debt / eq);
};

// 6. Free Cash Flow: Operating Cash Flow - Capital Expenditure
export const calculateFreeCashFlow = (operatingCashFlow, capitalExpenditure) => {
  const ocf = Number(operatingCashFlow) || 0;
  const capex = Number(capitalExpenditure) || 0;
  return roundToTwo(ocf - capex);
};

// Calculate all ratios at once from financial numbers
export const calculateAllRatios = (data) => {
  const grossMargin = calculateGrossMargin(data.grossProfit, data.revenue);
  const operatingMargin = calculateOperatingMargin(data.operatingProfit, data.revenue);
  const netMargin = calculateNetMargin(data.netProfit, data.revenue);
  const roe = calculateRoE(data.netProfit, data.shareholderEquity);
  const debtToEquity = calculateDebtToEquity(data.totalDebt, data.shareholderEquity);
  const freeCashFlow = calculateFreeCashFlow(data.operatingCashFlow, data.capitalExpenditure);

  return {
    grossMargin,
    operatingMargin,
    netMargin,
    roe,
    debtToEquity,
    freeCashFlow,
  };
};
