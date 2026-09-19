import * as companyService from "../services/company.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// Company Controller
// Handles incoming HTTP requests for companies and financial data.

// 1. GET /api/companies?search=...
export const searchCompanies = async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const companies = await companyService.searchCompanies(search);
    return successResponse(res, companies, "Companies retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/companies/:ticker
export const getCompanyByTicker = async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const company = await companyService.getCompanyByTicker(ticker);

    if (!company) {
      return errorResponse(res, `Company not found with ticker: ${ticker}`, 404, "COMPANY_NOT_FOUND");
    }

    return successResponse(res, company, "Company details retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/companies/:ticker/financials?period=annual|quarterly
export const getCompanyFinancials = async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const { period = "annual" } = req.query;

    const financials = await companyService.getCompanyFinancials(ticker, period);

    if (!financials) {
      return errorResponse(res, `Company not found with ticker: ${ticker}`, 404, "COMPANY_NOT_FOUND");
    }

    return successResponse(res, financials, "Financial statements retrieved successfully");
  } catch (error) {
    next(error);
  }
};
