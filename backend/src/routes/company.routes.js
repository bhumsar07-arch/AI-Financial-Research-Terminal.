import { Router } from "express";
import * as companyController from "../controllers/company.controller.js";

const router = Router();

// Company and Financial Statement Routes
// 1. Search companies or list top companies: GET /api/companies?search=itc
router.get("/", companyController.searchCompanies);

// 2. Get specific company profile by ticker: GET /api/companies/:ticker
router.get("/:ticker", companyController.getCompanyByTicker);

// 3. Get financial statements and computed ratios: GET /api/companies/:ticker/financials?period=annual|quarterly
router.get("/:ticker/financials", companyController.getCompanyFinancials);

export default router;
