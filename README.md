# Intelligent User Flow Mapper

An end-to-end full-stack application that intelligently crawls a website, extracts **meaningful user navigation flows**, and visualizes them as an interactive product-flow diagram.

Instead of producing a raw link graph, this system detects *real user journeys* such as:

> **Home → Login → Product Listing → Product Details → Add to Cart → Checkout**

---

## 🚀 Features

### Backend (Node.js + TypeScript)

#### Smart Crawling
- Internal-links-only crawling
- Depth and page limits
- Rate limiting & timeouts
- Optional authenticated flows (login)
- Robots.txt support (optional)
- Domain, path & file-type filtering

#### Intelligent Flow Extraction
- Global navigation detection (menus, headers, footers)
- Hub page detection
- Noise & low-value link removal
- Adaptive key page selection
- Importance scoring
- Flow inference (not raw sitemap)

#### Outputs
- **JSON** for frontend visualization
- **Text-based diagrams**
- **Mermaid syntax**
- **ASCII diagrams**

---

### Frontend (Next.js + React Flow)

- Configure crawl constraints from UI
- Trigger backend crawler
- Visualize detected flows
- Interactive node-based graph
- Stats overlay & filters

---

## 📂 Repository Structure

```bash
.
├── backend/                      # Crawler + flow analyzer
│   ├── src/
│   │   ├── index.ts              # Orchestrator + CLI
│   │   ├── config/
│   │   │   └── CrawlConfig.ts
│   │   ├── crawler/
│   │   │   ├── PageCrawler.ts
│   │   │   └── types.ts
│   │   ├── analyzer/
│   │   │   ├── FlowAnalyzer.ts
│   │   │   ├── NoiseReducer.ts
│   │   │   └── types.ts
│   │   ├── output/
│   │   │   ├── FlowFormatter.ts
│   │   │   └── TextFlowGenerator.ts
│   │   └── utils/
│   │       ├── UrlUtils.ts
│   │       └── Logger.ts
│   ├── crawl-config.example.json
│   └── package.json
│
└── frontend/                     # Next.js + React Flow UI
    ├── src/
    │   ├── app/
    │   │   ├── api/crawl/route.ts
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── CrawlerForm.tsx
    │   │   ├── AdvancedSettings.tsx
    │   │   └── FlowVisualization.tsx
    │   └── types/
    └── package.json
````

---

## ⚙️ Installation

### 1. Clone

```bash
git clone <repo-url> intelligent-user-flow-mapper
cd intelligent-user-flow-mapper
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Install browser
npx playwright install chromium

# Build
npm run build
```

#### Test Backend

```bash
npm start https://example.com 2 20
```
---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```
---

## 🔗 Wiring Frontend to Backend

Ensure:

* Backend is built
* Backend path in `frontend/src/app/api/crawl/route.ts` is correct
* Backend CLI supports `--config`

---

## 🧠 How It Works

### Flow Detection Pipeline

1. Crawl site
2. Extract links + metadata
3. Remove noise & global nav
4. Score pages
5. Select key nodes
6. Build flow graph
7. Output diagrams

---

## 🧪 Usage Examples

### Basic Crawl

```
URL: https://example.com  
Depth: 2  
Pages: 20  
```

### Deep Crawl

```
Depth: 5  
Pages: 150  
Concurrency: 5  
Max Links/Page: 100  
```

### Authenticated Crawl

Provide:

* Login URL
* Username
* Password

---

## 🧾 CLI Usage

```bash
npm start https://example.com 3 50
npm start https://example.com --config=crawl-config.json
```

---

## 🧩 Example Crawl Config

```json
{
  "startUrl": "https://example.com",
  "maxDepth": 3,
  "maxPages": 50,
  "constraints": {
    "maxConcurrency": 3,
    "maxLinksPerPage": 50,
    "followExternalLinks": false,
    "headless": true
  }
}
```

---

## 📊 Flow Output (JSON)

```json
{
  "graph": { "nodes": [], "edges": [] },
  "metadata": { "totalPages": 42 },
  "statistics": { "totalEdges": 38 }
}
```

---

## 📈 Flow Types

| Type        | Meaning              |
| ----------- | -------------------- |
| Entry       | Home, landing        |
| Form        | Login, signup        |
| Content     | Info, blogs          |
| Transaction | Cart, checkout       |
| Exit        | Logout, confirmation |
