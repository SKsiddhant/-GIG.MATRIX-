"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const apify_service_1 = require("./services/apify-service");
const zynd_service_1 = require("./services/zynd-service");
const superplane_service_1 = require("./services/superplane-service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3005;
// Request Logger & CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express_1.default.json());
const apifyService = new apify_service_1.ApifyService();
const zyndService = new zynd_service_1.ZyndService(process.env.ZYND_API_KEY || '');
const superplaneService = new superplane_service_1.SuperplaneService(process.env.SUPERPLANE_API_KEY || '');
// In-memory store for leads (for demo purposes)
let leads = [];
app.get('/api/leads', (req, res) => {
    res.json(leads);
});
app.post('/api/ingest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newLeads = yield apifyService.ingestLeads();
        for (const lead of newLeads) {
            // Check if lead already exists
            if (leads.find(l => l.title === lead.title))
                continue;
            leads.push(lead);
            // Step 2: Agentic Evaluation (Zynd AI)
            lead.status = 'evaluating';
            const evaluation = yield zyndService.evaluateLead(lead);
            lead.score = evaluation.score;
            if (evaluation.score > 70) {
                lead.status = 'qualified';
                // Step 3: Workflow Orchestration (Superplane)
                yield superplaneService.triggerLeadWorkflow(lead, evaluation);
            }
            else {
                lead.status = 'rejected';
            }
        }
        res.json({ message: 'Ingestion and evaluation complete', count: newLeads.length });
    }
    catch (error) {
        console.error('Error during ingestion:', error);
        res.status(500).json({ error: 'Failed to ingest leads' });
    }
}));
app.listen(port, () => {
    console.log(`[Server] Autonomous Gig-Hunter backend running at port ${port}`);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
