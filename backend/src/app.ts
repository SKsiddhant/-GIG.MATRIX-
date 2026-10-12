import express from 'express';
import cors from 'cors';
import { GigLead, AgentEvaluation } from './shared/types';

// The services are injected so the HTTP layer can be tested without Apify / Zynd / Superplane.
export interface Services {
  apify: { ingestLeads(): Promise<GigLead[]> };
  zynd: { evaluateLead(lead: GigLead): Promise<AgentEvaluation & { proposal?: string; research?: string; networkLogs: string[] }> };
  superplane: { triggerLeadWorkflow(lead: GigLead, evaluation: AgentEvaluation): Promise<string> };
}

export const QUALIFY_THRESHOLD = 70;

export function createApp(services: Services, corsOrigins: string[] = ['http://localhost:3000']) {
  const app = express();

  // Previously a hand-written `Access-Control-Allow-Origin: *`; the `cors` package was installed but unused.
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  // In-memory store for leads (for demo purposes)
  const leads: GigLead[] = [];
  let ingesting = false;

  app.get('/api/leads', (_req, res) => {
    res.json(leads);
  });

  app.post('/api/ingest', async (_req, res) => {
    // Each ingest calls paid third-party APIs and mutates the shared list; overlapping runs used to
    // double-process the same leads.
    if (ingesting) return res.status(409).json({ error: 'An ingestion is already running.' });
    ingesting = true;
    try {
      const incoming = await services.apify.ingestLeads();
      let processed = 0;
      const failed: string[] = [];

      for (const lead of incoming) {
        // Same URL (or, without one, same title) means the same lead
        const key = (l: GigLead) => l.url || l.title;
        if (leads.some((l) => key(l) === key(lead))) continue;

        leads.push(lead);
        try {
          lead.status = 'evaluating';
          const evaluation = await services.zynd.evaluateLead(lead);
          lead.score = evaluation.score;
          lead.reasoning = evaluation.reasoning;
          lead.proposal = evaluation.proposal;
          lead.research = evaluation.research;
          lead.networkLogs = evaluation.networkLogs;

          if (evaluation.score > QUALIFY_THRESHOLD) {
            lead.status = 'qualified';
            lead.workflowId = await services.superplane.triggerLeadWorkflow(lead, evaluation);
          } else {
            lead.status = 'rejected';
          }
          processed++;
        } catch (err) {
          // One bad lead used to abort the whole request and leave this lead stuck in "evaluating".
          // Drop it so the next ingest can retry it.
          console.error(`Failed to process lead "${lead.title}":`, err);
          leads.splice(leads.indexOf(lead), 1);
          failed.push(lead.title);
        }
      }

      res.json({ message: 'Ingestion and evaluation complete', count: processed, failed });
    } catch (error) {
      console.error('Error during ingestion:', error);
      res.status(500).json({ error: 'Failed to ingest leads' });
    } finally {
      ingesting = false;
    }
  });

  return app;
}
