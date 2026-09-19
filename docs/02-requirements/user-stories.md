# User Stories — AI Financial Research Terminal

This document outlines user stories categorized by functional epic, utilizing standard Agile formatting with concrete **Acceptance Criteria (Given-When-Then)**.

---

## Epic 1: Authentication & User Accounts

### US-1.1: User Registration
> **As an** equity analyst,  
> **I want to** create a secure account with my email and password,  
> **So that** I can save my watchlists, notes, and research chat history.

* **Acceptance Criteria**:
  - **Given** valid registration details (name, valid email, password >= 8 characters),
  - **When** I submit the registration form,
  - **Then** my account is created in PostgreSQL with a hashed password, and I receive an authentication token.
  - **Given** an email that is already registered,
  - **When** I submit the form,
  - **Then** the system returns an HTTP 409 Conflict error stating that the email is already in use.

### US-1.2: User Login & Session Persistence
> **As an** authenticated user,  
> **I want to** log in and remain signed in via JWT,  
> **So that** I do not have to re-enter my credentials on every page refresh.

* **Acceptance Criteria**:
  - **Given** correct credentials,
  - **When** I log in,
  - **Then** a JWT is returned and stored securely in local storage / HTTP-only cookies, and the app state reflects my authenticated profile.
  - **Given** an invalid password,
  - **When** I log in,
  - **Then** the system returns an HTTP 401 Unauthorized error without revealing whether the email or password was incorrect.

---

## Epic 2: Company & Financial Research

### US-2.1: Company Search & Profile
> **As an** investor,  
> **I want to** search for a company by name or ticker (e.g., "ITC"),  
> **So that** I can access its profile, sector info, and financial performance.

* **Acceptance Criteria**:
  - **Given** a search query "ITC" or "Tobacco",
  - **When** I query the search bar,
  - **Then** the terminal shows autocomplete suggestions matching ITC Limited with ticker `ITC`.
  - **When** I click the company,
  - **Then** I am navigated to `/company/ITC` displaying company overview, exchange, sector, and industry.

### US-2.2: Historical Financial Statements & Calculated Ratios
> **As an** equity research analyst,  
> **I want to** view multi-year Income Statements, Balance Sheets, and computed margins,  
> **So that** I can evaluate historical revenue growth and profitability trends.

* **Acceptance Criteria**:
  - **Given** an active company view (`/company/ITC/financials`),
  - **When** the page loads,
  - **Then** annual and quarterly financial figures (Revenue, EBITDA, Net Profit, EPS) are displayed in a clean tabular view.
  - **Then** derived ratios (Operating Margin, Net Margin, Debt/Equity) calculated in backend code are shown alongside reported numbers.

### US-2.3: Financial Charts Visualization
> **As an** analyst,  
> **I want to** see interactive visual charts of Revenue, Profit Margins, and Segment Breakdown,  
> **So that** I can quickly spot long-term financial trajectories.

* **Acceptance Criteria**:
  - **Given** the financials tab,
  - **When** I toggle between Revenue, EBITDA, and Margin charts,
  - **Then** Recharts renders responsive bar/line graphs with interactive tooltips showing fiscal period and values.

---

## Epic 3: Document & Transcript Repository

### US-3.1: Document Catalog Filtering
> **As a** researcher,  
> **I want to** filter company filings by document type (Annual Report, Earnings Call Transcript, Presentation),  
> **So that** I can read official source materials directly.

* **Acceptance Criteria**:
  - **Given** the documents tab (`/company/ITC/documents`),
  - **When** I select "conference_call_transcript" from the filter,
  - **Then** only transcript documents for ITC are listed with date, quarter, and fiscal year.
  - **When** I click a document,
  - **Then** I can view its metadata and read the extracted text or open the source link.

---

## Epic 4: AI Research Assistant (RAG)

### US-4.1: Asking "Why" and Qualitative Questions
> **As an** analyst,  
> **I want to** ask the AI assistant questions such as *"Why did ITC's operating margins change in FY2024?"*,  
> **So that** I can quickly uncover management's explanations without reading 200 pages.

* **Acceptance Criteria**:
  - **Given** a question about ITC's margins,
  - **When** submitted to the AI assistant,
  - **Then** the system retrieves chunks from the relevant Annual Report and Q4 Earnings Call.
  - **Then** the answer synthesizes the key drivers (e.g., input cost inflation in agribusiness, paperboards demand).
  - **Then** the answer attributes management statements explicitly (*"Management noted that..."*).

### US-4.2: Verifiable Citations and Evidence Drawer
> **As an** institutional researcher,  
> **I want to** inspect the exact sources and page/speaker citations for every claim made by the AI,  
> **So that** I can verify facts before citing them in an investment memo.

* **Acceptance Criteria**:
  - **Given** an AI response,
  - **When** I review the answer,
  - **Then** citations are displayed at the bottom showing Document Title, Year, Quarter, Page Number (for PDFs), and Speaker Name/Role (for Transcripts).
  - **When** I click a citation,
  - **Then** an evidence drawer opens displaying the exact excerpt extracted from the source filing.

### US-4.3: Speaker Role Discrimination
> **As a** researcher,  
> **I want to** distinguish between what analysts asked and what company executives answered,  
> **So that** I don't confuse external skepticism with official company guidance.

* **Acceptance Criteria**:
  - **Given** an earnings call Q&A segment,
  - **When** the AI responds to questions about future guidance or risks,
  - **Then** the prompt instructions ensure analyst questions are framed as questions, and management answers are credited to the specific executive (e.g., "Sanjiv Puri, Chairman & MD").

---

## Epic 5: Research Productivity & Comparison

### US-5.1: Watchlist Tracking
> **As an** active investor,  
> **I want to** bookmark companies to my watchlist,  
> **So that** I can monitor multiple stocks from my main terminal dashboard.

* **Acceptance Criteria**:
  - **Given** any company page,
  - **When** I click "Add to Watchlist",
  - **Then** the company is linked to my user profile in PostgreSQL, and appears in my `/watchlist` view.

### US-5.2: Multi-Company Financial Comparison
> **As an** analyst evaluating the FMCG sector,  
> **I want to** compare ITC against peer companies across revenue growth and margins,  
> **So that** I can identify relative market valuation and efficiency.

* **Acceptance Criteria**:
  - **Given** the comparison page (`/compare`),
  - **When** I select ITC and a peer,
  - **Then** a side-by-side comparison table displays deterministic financial metrics for both companies across common fiscal periods.
