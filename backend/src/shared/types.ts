export interface GigLead {
  id: string;
  title: string;
  description: string;
  budget?: string;
  platform: string;
  url: string;
  createdAt: string;
  status: 'new' | 'evaluating' | 'qualified' | 'rejected' | 'approved' | 'engaged';
  score?: number;
  reasoning?: string;
  workflowId?: string;
  proposal?: string;
  research?: string;
  networkLogs?: string[];
}

export interface AgentEvaluation {
  leadId: string;
  score: number;
  reasoning: string;
  recommendedAction: string;
}
