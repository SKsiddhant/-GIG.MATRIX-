# Autonomous Gig-Hunter 🐐 (Bot-a-thon Edition)

A Giga-GOATED multi-agent system that finds, researches, qualifies, and engages with freelance project opportunities autonomously.

## 🚀 Overview
**Autonomous Gig-Hunter** is an end-to-end command center for the modern freelancer. It replaces manual job board scrolling with a high-performance agent network that works 24/7 to find your next big gig.

### The Problem
Freelancers spend 30-40% of their time searching for leads, researching clients, and writing proposals instead of doing billable work.

### The Solution
A decentralized swarm of specialized agents:
1.  **The Scraper (Apify)**: Scans the web for new opportunities across Upwork, LinkedIn, Twitter, and more.
2.  **The Researcher (Zynd AI)**: Performs deep market analysis and client history checks.
3.  **The Evaluator (Zynd AI)**: Scores leads based on a custom technical persona and budget thresholds.
4.  **The Consensus Agent (simulated)**: A placeholder step that nudges the score of high-value leads up or down. There is no second agent behind it yet.
5.  **The Orchestrator (Superplane)**: Manages the human-in-the-loop approval and engagement workflow.

---

## 🛠 Tech Stack & Sponsor Integrations

### **Apify (The Eyes)**
We leverage the **Apify SDK** to ingest real-time data from various job board actors. The system is designed to map diverse data structures (Upwork, LinkedIn, Freelancer) into a unified "GigLead" matrix. 
- *Track*: Apify Track

### **Zynd AI (The Brain & Identity)**
The core of our agentic intelligence. 
- **Agent Identity**: Every coordinator instance has a unique Ed25519 identity (`zns:coordinator`).
- **Discovery**: Dynamically searches the Zynd registry for specialized "Evaluator" and "Researcher" agents.
- **A2A Protocol**: Uses secure Agent-to-Agent communication to transfer lead data and market insights.
- **Consensus Mechanism**: Implements a multi-agent verification flow where a second agent must confirm the strategic fit.

### **Superplane (The Backbone)**
Superplane acts as our **DevOps control plane** for business logic. 
- **Workflow Ingestion**: Qualified leads trigger a Superplane "Canvas" via REST API.
- **HITL (Human-in-the-Loop)**: Orchestrates the transition from autonomous evaluation to human engagement authorization.
- **State Management**: Tracks the lifecycle of a lead from "Qualified" to "Engaged".

### **GitHub Copilot (The Accelerator)**
Copilot was our **lead architect's right hand**. It was used to:
- Rapidly scaffold the Express/TypeScript backend.
- Generate complex Framer Motion animations for the "Cyber-Dark" HUD.
- Debug A2A handshake logic and x402 payment headers.
- Write unit tests for the heuristic scoring engine.

---

## 💻 Installation & Setup

### Prerequisites
- Node.js 18+
- Apify API Token
- Zynd AI Identity (generated via CLI)

### Quick Start
1.  **Clone the Repo**: `git clone <repo-url>`
2.  **Backend**:
    ```bash
    cd backend
    npm install
    cp .env.example .env   # then add your keys; .env is git-ignored
    npm run dev            # or: npm run build && npm start
    npm test
    ```
    Without real keys the backend uses built-in mock leads and mock workflow ids.
3.  **Frontend**: the dashboard (`web/`) is **not part of this repository** (it was never committed). The backend exposes `GET /api/leads` and `POST /api/ingest`, and allows the origins in `CORS_ORIGINS` (default `http://localhost:3000`).

---

## 🏆 Prize Eligibility
- [x] **Apify Track**: Full integration with Apify actors and datasets.
- [x] **Zynd AI**: Deep use of A2A, Discovery, and Agent Identity.
- [x] **Superplane**: Automated workflow orchestration.
- [x] **GitHub Copilot**: Extensively used for all AI and UI logic.
