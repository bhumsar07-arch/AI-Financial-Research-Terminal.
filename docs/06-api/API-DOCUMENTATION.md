# REST API Documentation — AI Financial Research Terminal

This document defines the complete RESTful API contract for both the **Express.js Main Application API** (port 5000) and the **Python FastAPI RAG Service** (port 8000).

---

## Part 1: Express.js Main Application API (`http://localhost:5000/api`)

All protected endpoints require the HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. Authentication Endpoints (`/api/auth`)

#### 1.1 Register New User
* **Method & Path**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "Alex Vance",
    "email": "alex.vance@equityresearch.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": 1,
        "name": "Alex Vance",
        "email": "alex.vance@equityresearch.com",
        "role": "analyst"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 1.2 Login User
* **Method & Path**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "alex.vance@equityresearch.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Alex Vance",
        "email": "alex.vance@equityresearch.com",
        "role": "analyst"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 1.3 Get Current User Profile
* **Method & Path**: `GET /api/auth/me`
* **Access**: Protected (Bearer Token)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Alex Vance",
      "email": "alex.vance@equityresearch.com",
      "role": "analyst",
      "createdAt": "2026-09-19T10:00:00.000Z"
    }
  }
  ```

#### 1.4 Logout
* **Method & Path**: `POST /api/auth/logout`
* **Access**: Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 2. Company Endpoints (`/api/companies`)

#### 2.1 Search Companies
* **Method & Path**: `GET /api/companies?search=itc`
* **Access**: Public / Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "ticker": "ITC",
        "name": "ITC Limited",
        "exchange": "NSE",
        "sector": "Consumer Goods",
        "industry": "Tobacco & FMCG"
      }
    ]
  }
  ```

#### 2.2 Get Company Details
* **Method & Path**: `GET /api/companies/:ticker`
* **Access**: Public / Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "ticker": "ITC",
      "name": "ITC Limited",
      "exchange": "NSE",
      "sector": "Consumer Goods",
      "industry": "Tobacco & FMCG",
      "description": "ITC Limited is one of India's foremost private sector companies...",
      "currency": "INR",
      "website": "https://www.itcportal.com"
    }
  }
  ```

---

### 3. Financial Endpoints (`/api/financials`)

#### 3.1 Get Company Financial Statements & Ratios
* **Method & Path**: `GET /api/companies/:ticker/financials?period=annual`
* **Access**: Protected
* **Query Parameters**: `period` (`annual` or `quarterly`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "ticker": "ITC",
      "currency": "INR",
      "periods": [
        {
          "fiscalYear": 2024,
          "fiscalQuarter": null,
          "revenue": 76825.00,
          "grossProfit": 43500.00,
          "ebitda": 26150.00,
          "operatingProfit": 24800.00,
          "netProfit": 20450.00,
          "eps": 16.42,
          "totalDebt": 50.00,
          "shareholderEquity": 72500.00,
          "operatingCashFlow": 21300.00,
          "ratios": {
            "grossMargin": 56.62,
            "operatingMargin": 32.28,
            "netMargin": 26.62,
            "roe": 28.21,
            "debtToEquity": 0.001
          }
        }
      ]
    }
  }
  ```

#### 3.2 Compare Multiple Companies
* **Method & Path**: `GET /api/companies/compare?tickers=ITC,HUL`
* **Access**: Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "ticker": "ITC",
        "name": "ITC Limited",
        "latestMetrics": { "operatingMargin": 32.28, "roe": 28.21, "revenueGrowth": 6.8 }
      },
      {
        "ticker": "HUL",
        "name": "Hindustan Unilever Limited",
        "latestMetrics": { "operatingMargin": 23.40, "roe": 20.15, "revenueGrowth": 3.2 }
      }
    ]
  }
  ```

---

### 4. Document Endpoints (`/api/documents`)

#### 4.1 List Company Documents
* **Method & Path**: `GET /api/companies/:ticker/documents?type=conference_call_transcript`
* **Access**: Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "title": "ITC Q4 FY24 Earnings Conference Call Transcript",
        "documentType": "conference_call_transcript",
        "fiscalYear": 2024,
        "fiscalQuarter": "Q4",
        "documentDate": "2024-05-24",
        "sourceUrl": "https://www.itcportal.com/investor/transcript-q4-24.pdf"
      }
    ]
  }
  ```

---

### 5. Chat & AI Research Endpoints (`/api/chat`)

#### 5.1 Create Chat Session
* **Method & Path**: `POST /api/chat/sessions`
* **Access**: Protected
* **Request Body**:
  ```json
  {
    "companyId": 1,
    "title": "ITC FY24 Margin Pressure Analysis"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 45,
      "userId": 1,
      "companyId": 1,
      "title": "ITC FY24 Margin Pressure Analysis",
      "createdAt": "2026-09-19T10:15:00.000Z"
    }
  }
  ```

#### 5.2 Send Query to AI Analyst
* **Method & Path**: `POST /api/chat`
* **Access**: Protected
* **Request Body**:
  ```json
  {
    "sessionId": 45,
    "companyId": 1,
    "question": "Why did ITC's operating margins contract in the paperboards segment?"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "messageId": 120,
      "role": "assistant",
      "content": "According to the FY24 disclosures and earnings call commentary, ITC's Paperboards, Paper and Packaging segment experienced sharp margin compression primarily due to two factors: surge in domestic wood costs and aggressive dumping of low-priced paperboards from China and Indonesia...",
      "citations": [
        {
          "citationId": "cite-1",
          "documentTitle": "ITC Limited Annual Report 2024",
          "documentType": "annual_report",
          "fiscalYear": 2024,
          "fiscalQuarter": null,
          "pageNumber": 84,
          "speaker": null,
          "section": "Management Discussion & Analysis"
        },
        {
          "citationId": "cite-2",
          "documentTitle": "ITC Q4 FY24 Earnings Conference Call",
          "documentType": "conference_call_transcript",
          "fiscalYear": 2024,
          "fiscalQuarter": "Q4",
          "pageNumber": null,
          "speaker": "Sanjiv Puri",
          "speakerRole": "Chairman & Managing Director",
          "section": "Q&A Session"
        }
      ]
    }
  }
  ```

---

### 6. Watchlist Endpoints (`/api/watchlist`)

#### 6.1 Get User Watchlist
* **Method & Path**: `GET /api/watchlist`
* **Access**: Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "companyId": 1,
        "ticker": "ITC",
        "name": "ITC Limited",
        "sector": "Consumer Goods"
      }
    ]
  }
  ```

#### 6.2 Add Company to Watchlist
* **Method & Path**: `POST /api/watchlist`
* **Access**: Protected
* **Request Body**: `{ "companyId": 1 }`
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Company added to watchlist"
  }
  ```

#### 6.3 Remove Company from Watchlist
* **Method & Path**: `DELETE /api/watchlist/:companyId`
* **Access**: Protected
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Company removed from watchlist"
  }
  ```

---

## Part 2: Python FastAPI RAG Service (`http://localhost:8000`)

### 1. Health Check
* **Method & Path**: `GET /health`
* **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "pgvector": "connected",
    "embedding_model": "text-embedding-3-small"
  }
  ```

### 2. Query RAG Engine
* **Method & Path**: `POST /query`
* **Request Body**:
  ```json
  {
    "company_id": 1,
    "question": "What did management say about raw material costs in Q4?",
    "filters": {
      "fiscal_year": 2024,
      "document_types": ["conference_call_transcript", "annual_report"]
    }
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "answer": "During the Q4 FY24 earnings conference call, the CFO highlighted that raw material inflation remained elevated in agricultural inputs...",
    "retrieved_chunks_count": 5,
    "citations": [
      {
        "citation_id": "cite-1",
        "document_title": "ITC Q4 FY24 Transcript",
        "document_type": "conference_call_transcript",
        "fiscal_year": 2024,
        "fiscal_quarter": "Q4",
        "page_number": null,
        "speaker": "CFO",
        "speaker_role": "Chief Financial Officer",
        "section": "Prepared Remarks",
        "excerpt": "Agricultural raw materials experienced inflationary trends in wheat and leaf tobacco..."
      }
    ]
  }
  ```

### 3. Ingestion Endpoints
* **Method & Path**: `POST /ingest/pdf`
  - Accepts multipart PDF file upload with metadata (`company_id`, `doc_type`, `year`, `quarter`).
* **Method & Path**: `POST /ingest/transcript`
  - Accepts raw text/file of transcript with metadata, parses speaker segments, chunks, embeds, and writes to PostgreSQL.
