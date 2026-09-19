# Test Cases Specification — AI Financial Research Terminal

This document details concrete test cases with inputs, expected outputs, and test categories.

---

## 1. Authentication & Security Test Cases (TC-AUTH)

| Case ID | Title | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Successful Registration | Valid name, email, password >= 8 chars | HTTP 201, User created, JWT token returned, password hash not exposed | Planned |
| **TC-AUTH-02** | Duplicate Email Registration | Email already present in database | HTTP 409 Conflict, descriptive error message | Planned |
| **TC-AUTH-03** | Short Password Validation | Password < 8 characters | HTTP 400 Bad Request, validation error | Planned |
| **TC-AUTH-04** | Valid User Login | Correct email and password | HTTP 200 OK, JWT returned | Planned |
| **TC-AUTH-05** | Invalid Password Login | Correct email, wrong password | HTTP 401 Unauthorized | Planned |
| **TC-AUTH-06** | Protected Route Access Without Token | Request to `/api/auth/me` without Authorization header | HTTP 401 Unauthorized | Planned |
| **TC-AUTH-07** | Protected Route Access With Expired Token | Request with expired JWT | HTTP 401 Unauthorized, token expired message | Planned |

---

## 2. Financial Metrics & Deterministic Engine Test Cases (TC-FIN)

| Case ID | Title | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-FIN-01** | Operating Margin Calculation | Operating Profit = 24,800, Revenue = 76,825 | Calculated Margin = 32.28% ($\pm 0.01$) | Planned |
| **TC-FIN-02** | RoE Calculation | Net Income = 20,450, Equity = 72,500 | Calculated RoE = 28.21% ($\pm 0.01$) | Planned |
| **TC-FIN-03** | Zero Revenue Division by Zero Defense | Revenue = 0 | Margin returns `null` or 0, does not crash or throw unhandled error | Planned |
| **TC-FIN-04** | Company Search Autocomplete | Query: `"ITC"` | Returns array with ITC Limited record | Planned |
| **TC-FIN-05** | Financial Statement Ordering | Fetch ITC annual financials | Periods returned sorted in descending order (FY24, FY23, FY22...) | Planned |

---

## 3. Transcript Processing & RAG Test Cases (TC-RAG)

| Case ID | Title | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RAG-01** | Executive Speaker Detection | Header: `"Sanjiv Puri - Chairman and Managing Director:"` | `speaker_name: "Sanjiv Puri"`, `is_management: true` | Planned |
| **TC-RAG-02** | Analyst Speaker Detection | Header: `"Percy Panthaki - Analyst, CLSA:"` | `speaker_name: "Percy Panthaki"`, `is_management: false` | Planned |
| **TC-RAG-03** | Q&A Section Identification | Transcript contains `"Question-and-Answer Session"` | Chunks in section tagged with `section: "Q&A Session"` | Planned |
| **TC-RAG-04** | Vector Cosine Search | Query embedding for FMCG margins | Returns top chunks related to FMCG margin drivers | Planned |
| **TC-RAG-05** | Attribution Check | Query: *"What did management say about demand?"* | Generated response includes *"Management stated..."* and valid citation | Planned |
