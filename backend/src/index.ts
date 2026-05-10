import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { ApifyService } from './services/apify-service';
import { ZyndService } from './services/zynd-service';
import { SuperplaneService } from './services/superplane-service';
import { GigLead } from './shared/types';

dotenv.config();

const app = express();
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

app.use(express.json());

const apifyService = new ApifyService();
const zyndService = new ZyndService(process.env.ZYND_API_KEY || '');
const superplaneService = new SuperplaneService(process.env.SUPERPLANE_API_KEY || '');

// In-memory store for leads (for demo purposes)
let leads: GigLead[] = [];

app.get('/api/leads', (req, res) => {
  res.json(leads);
});

app.post('/api/ingest', async (req, res) => {
  try {
    const newLeads = await apifyService.ingestLeads();
    
    for (const lead of newLeads) {
      // Check if lead already exists
      if (leads.find(l => l.title === lead.title)) continue;
      
      leads.push(lead);
      
      // Step 2: Agentic Evaluation (Zynd AI)
      lead.status = 'evaluating';
      const evaluation = await zyndService.evaluateLead(lead);
      lead.score = evaluation.score;
      lead.reasoning = evaluation.reasoning;
      lead.proposal = evaluation.proposal;
      lead.research = evaluation.research;
      lead.networkLogs = evaluation.networkLogs;
      
      if (evaluation.score > 70) {
        lead.status = 'qualified';
        // Step 3: Workflow Orchestration (Superplane)
        const workflowId = await superplaneService.triggerLeadWorkflow(lead, evaluation);
        lead.workflowId = workflowId;
      } else {
        lead.status = 'rejected';
      }
    }
    
    res.json({ message: 'Ingestion and evaluation complete', count: newLeads.length });
  } catch (error) {
    console.error('Error during ingestion:', error);
    res.status(500).json({ error: 'Failed to ingest leads' });
  }
});

app.listen(port, () => {
  console.log(`[Server] Autonomous Gig-Hunter backend running at port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

