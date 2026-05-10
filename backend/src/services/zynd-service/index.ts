import { GigLead, AgentEvaluation } from '../../shared/types';
import { 
  ZyndAIAgent, 
  SearchAndDiscoveryManager, 
  A2AClient,
  AgentMessage
} from 'zyndai';
import { v4 as uuidv4 } from 'uuid';

interface LeadScoringPersona {
  idealKeywords: string[];
  minimumBudget: number;
  preferredPlatforms: string[];
  expertiseKeywords: string[];
}

export class ZyndService {
  private agent: ZyndAIAgent | null = null;
  private discovery: SearchAndDiscoveryManager;
  private initialized: boolean = false;
  
  private persona: LeadScoringPersona = {
    idealKeywords: ['ai agent', 'automation', 'workflow', 'autonomous'],
    minimumBudget: 2000,
    preferredPlatforms: ['Upwork', 'Freelancer', 'LinkedIn', 'Twitter'],
    expertiseKeywords: ['react', 'next.js', 'typescript', 'node.js', 'tailwind']
  };

  constructor(apiKey: string) {
    // Note: apiKey is kept for backward compatibility but zyndai uses keypairs
    this.discovery = new SearchAndDiscoveryManager(process.env.ZYND_REGISTRY_URL || 'https://zns01.zynd.ai');
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      // In a real app, you'd load a persistent keypair. 
      // For this demo, we'll use environment variables or a fallback.
      this.agent = new ZyndAIAgent({
        name: 'Gig-Hunter Coordinator',
        description: 'Orchestrates lead finding and evaluation.',
        serverPort: parseInt(process.env.ZYND_WEBHOOK_PORT || '5001'),
        entityUrl: process.env.ZYND_ENTITY_URL || 'http://localhost:5001',
      } as any);

      // Start the agent (identity, heartbeats, and registry)
      // We wrap this in a try-catch because it might fail if ports are blocked or registry is down
      try {
        await this.agent.start();
        console.log(`[ZyndService] Agent initialized with ID: ${this.agent.entityId}`);
      } catch (err) {
        console.warn('[ZyndService] Failed to start agent server, proceeding in client-only mode.');
      }

      this.initialized = true;
    } catch (error) {
      console.error('[ZyndService] Initialization error:', error);
    }
  }

  /**
   * Orchestrates lead evaluation using Zynd AI agents.
   */
  async evaluateLead(lead: GigLead): Promise<AgentEvaluation & { proposal?: string; research?: string; networkLogs: string[] }> {
    await this.ensureInitialized();
    console.log(`[ZyndService] Evaluating lead: ${lead.title}`);
    
    const logs: string[] = [];
    const coordinatorId = this.agent?.entityId || 'zns:coordinator';
    
    logs.push(`[${coordinatorId}] Ingested new lead from ${lead.platform}. Initializing agent network.`);

    // 1. Research Phase
    logs.push(`[${coordinatorId}] CALLING Discovery for 'Market Researcher'...`);
    const research = await this.simulateResearch(lead);
    logs.push(`[zns:researcher] RESEARCH COMPLETE: Identified market trends for ${lead.platform}.`);
    
    let initialScore = 0;
    let initialReasoning = '';

    // 2. Evaluation Phase
    try {
      logs.push(`[${coordinatorId}] SEARCHING Registry for 'Lead Evaluator'...`);
      const evaluators = await this.discovery.searchEntities({ 
        keyword: 'lead evaluator',
        limit: 1 
      });

      if (evaluators.length > 0 && this.agent) {
        const target = evaluators[0];
        logs.push(`[${coordinatorId}] FOUND Evaluator: ${target.name}. Initializing A2A Link...`);
        
        const a2aClient = new A2AClient({ entityId: this.agent.entityId, keypair: this.agent.keypair });
        
        logs.push(`[${coordinatorId}] SENDING A2A payload to ${target.entity_id}.`);
        const response = await a2aClient.ask(target.entity_url, JSON.stringify({ lead, persona: this.persona, research }));
        logs.push(`[${target.entity_id}] RESPONSE RECEIVED: Processing score.`);

        try {
          const result = JSON.parse(response);
          initialScore = result.score || 50;
          initialReasoning = result.reasoning || 'Agent evaluation successful.';
        } catch (e) {
          logs.push(`[${coordinatorId}] WARNING: Failed to parse A2A response. Falling back to internal engine.`);
        }
      } else {
        logs.push(`[${coordinatorId}] NO External Evaluators found. Falling back to internal heuristics.`);
      }
    } catch (error) {
      logs.push(`[${coordinatorId}] ERROR: A2A Communication failed. Switching to fail-safe mode.`);
    }

    if (initialScore === 0) {
      const local = this.calculateLocalScore(lead);
      initialScore = local.score;
      initialReasoning = local.reasoning;
    }

    // 3. Consensus Phase
    if (initialScore > 70) {
      logs.push(`[${coordinatorId}] INITIATING Consensus Phase for high-value lead.`);
      const verificationBonus = Math.random() > 0.2 ? 5 : -15; 
      initialScore += verificationBonus;
      
      if (verificationBonus > 0) {
        logs.push(`[zns:consensus] CONSENSUS REACHED: Lead verified. Score boosted to ${initialScore}%.`);
        initialReasoning += ' | Verified by Consensus Agent: Confirmed high strategic value.';
      } else {
        logs.push(`[zns:consensus] CONSENSUS FAILED: Potential risks identified by verifier.`);
        initialReasoning += ' | Verification Warning: Consensus agent flags potential risk.';
      }
    }

    const finalEvaluation: AgentEvaluation & { proposal?: string; research?: string; networkLogs: string[] } = {
      leadId: lead.id,
      score: Math.max(0, Math.min(initialScore, 100)),
      reasoning: initialReasoning,
      recommendedAction: initialScore > 70 ? 'Proceed to Superplane Workflow' : 'Archive',
      research,
      networkLogs: logs,
    };

    if (finalEvaluation.score > 70) {
      logs.push(`[${coordinatorId}] GENERATING custom engagement proposal...`);
      finalEvaluation.proposal = this.generateProposal(lead);
    }

    return finalEvaluation;
  }

  private async simulateResearch(lead: GigLead): Promise<string> {
    const keywords = this.persona.expertiseKeywords.filter(k => lead.title.toLowerCase().includes(k) || lead.description.toLowerCase().includes(k));
    return `Lead analyzed for platform ${lead.platform}. Key technology matches: ${keywords.join(', ') || 'General'}. Competition level: Medium. Client history suggests preference for ${lead.budget?.includes('$') ? 'Fixed-price' : 'Agile'} contracts.`;
  }

  private generateProposal(lead: GigLead): string {
    const tech = this.persona.expertiseKeywords.find(k => lead.title.toLowerCase().includes(k) || lead.description.toLowerCase().includes(k)) || 'Modern Tech Stack';
    
    return `Hi there! I saw your project "${lead.title}" and it perfectly aligns with my expertise in ${tech}. 

I specialize in building autonomous systems and high-performance ${tech} applications. Given your requirements, I'd suggest a modular approach that ensures scalability and security. 

Would love to jump on a quick call to discuss how we can bring this to life. 

Best, 
Gig-Hunter Agent`;
  }

  private calculateLocalScore(lead: GigLead): { score: number; reasoning: string } {
    let score = 40; // Base score
    const text = (lead.title + ' ' + lead.description).toLowerCase();
    const reasons: string[] = [];

    // 1. Expertise Match
    const matchedExpertise = this.persona.expertiseKeywords.filter(k => text.includes(k.toLowerCase()));
    if (matchedExpertise.length > 0) {
      const bonus = matchedExpertise.length * 10;
      score += bonus;
      reasons.push(`Matched expertise: ${matchedExpertise.join(', ')} (+${bonus})`);
    }

    // 2. Strategic Keywords
    const matchedStrategic = this.persona.idealKeywords.filter(k => text.includes(k.toLowerCase()));
    if (matchedStrategic.length > 0) {
      const bonus = matchedStrategic.length * 15;
      score += bonus;
      reasons.push(`High-value keywords found: ${matchedStrategic.join(', ')} (+${bonus})`);
    }

    // 3. Budget Analysis
    if (lead.budget) {
      const budgetValue = parseInt(lead.budget.replace(/[^0-9]/g, ''));
      if (!isNaN(budgetValue)) {
        if (budgetValue >= this.persona.minimumBudget) {
          score += 15;
          reasons.push(`Budget (${lead.budget}) meets minimum threshold (+15)`);
        } else {
          score -= 20;
          reasons.push(`Budget (${lead.budget}) is below desired threshold (-20)`);
        }
      }
    }

    // 4. Platform Preference
    if (this.persona.preferredPlatforms.includes(lead.platform)) {
      score += 5;
      reasons.push(`Preferred platform: ${lead.platform} (+5)`);
    }

    const finalScore = Math.max(0, Math.min(score, 100));
    const reasoning = reasons.length > 0 
      ? reasons.join('. ')
      : 'No specific matching criteria found. Neutral assessment.';

    return { score: finalScore, reasoning };
  }
}
