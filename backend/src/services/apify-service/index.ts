import { GigLead } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { ApifyClient } from 'apify-client';

export class ApifyService {
  private client: ApifyClient;

  constructor(token?: string) {
    const apifyToken = token || process.env.APIFY_TOKEN;
    if (!apifyToken) {
      console.warn('[ApifyService] Warning: APIFY_TOKEN is not set. Service will likely fail.');
    }
    this.client = new ApifyClient({
      token: apifyToken,
    });
  }

  /**
   * Ingests leads from a specific Apify Dataset or the most recent run of an Actor.
   * For this demo, we can pass a datasetId or it can be configured via env.
   */
  async ingestLeads(datasetId?: string): Promise<GigLead[]> {
    const targetDatasetId = datasetId || process.env.APIFY_DATASET_ID;
    
    if (!targetDatasetId || targetDatasetId.includes('your_')) {
      console.log('[ApifyService] No real datasetId provided, falling back to mock data.');
      return this.getMockLeads();
    }

    try {
      console.log(`[ApifyService] Fetching results from dataset: ${targetDatasetId}`);
      const datasetItems = await this.client.dataset(targetDatasetId).listItems();
      
      return datasetItems.items.map((item: any) => ({
        id: uuidv4(),
        title: item.title || item.jobTitle || 'Untitled Lead',
        description: item.description || item.jobDescription || item.text || 'No description provided.',
        budget: item.budget || item.price || item.hourlyRate || 'TBD',
        platform: item.platform || 'Apify Scraper',
        url: item.url || item.link || '',
        createdAt: item.createdAt || new Date().toISOString(),
        status: 'new',
      }));
    } catch (error) {
      console.error('[ApifyService] Error fetching from Apify:', error);
      return [];
    }
  }

  private getMockLeads(): GigLead[] {
    return [
      {
        id: uuidv4(),
        title: 'Senior React Developer Needed for FinTech Project',
        description: 'Looking for a senior developer to build a complex dashboard using Next.js and Tailwind.',
        budget: '$5000 - $8000',
        platform: 'Upwork',
        url: 'https://upwork.com/jobs/123',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'AI Agent Specialist for Automation Workflow',
        description: 'Need help building an AI-powered automation system using LangChain and Apify.',
        budget: '$2000',
        platform: 'Freelancer',
        url: 'https://freelancer.com/projects/456',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Fullstack Engineer (TypeScript/Node)',
        description: 'Join our growing team to build decentralized agentic commerce platforms.',
        budget: '$120k - $160k / year',
        platform: 'LinkedIn',
        url: 'https://linkedin.com/jobs/789',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Looking for someone to build a custom Apify Scraper',
        description: 'Need a dev to scrape job boards and send them to a Discord webhook.',
        budget: '$500',
        platform: 'Twitter',
        url: 'https://twitter.com/jobs/101',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Next.js 15 Performance Optimization Expert',
        description: 'Our SaaS is slow. Need someone to audit and fix Core Web Vitals.',
        budget: '$3500',
        platform: 'Upwork',
        url: 'https://upwork.com/jobs/optimization',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Solana Smart Contract Auditor',
        description: 'Audit our new token launch contracts for security vulnerabilities.',
        budget: '$10,000',
        platform: 'Freelancer',
        url: 'https://freelancer.com/projects/solana-audit',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Technical Writer for AI SDK Documentation',
        description: 'Write clear, concise docs for our new agentic framework.',
        budget: '$50 / hour',
        platform: 'LinkedIn',
        url: 'https://linkedin.com/jobs/writer',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Python Developer for LLM Fine-tuning',
        description: 'Fine-tune Llama 3 on our proprietary dataset for customer support.',
        budget: '$7000',
        platform: 'Upwork',
        url: 'https://upwork.com/jobs/llm',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Three.js / WebGL Visual Artist',
        description: 'Create a 3D landing page for a new metaverse project.',
        budget: '$4000',
        platform: 'Twitter',
        url: 'https://twitter.com/jobs/threejs',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'DevOps Engineer (Kubernetes/AWS)',
        description: 'Scale our multi-agent infra to handle 1M requests per second.',
        budget: '$180k / year',
        platform: 'LinkedIn',
        url: 'https://linkedin.com/jobs/devops',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'Mobile Dev for React Native App',
        description: 'Build a cross-platform app for our autonomous hunter service.',
        budget: '$6000',
        platform: 'Upwork',
        url: 'https://upwork.com/jobs/mobile',
        createdAt: new Date().toISOString(),
        status: 'new',
      },
      {
        id: uuidv4(),
        title: 'UI/UX Designer for Agent Dashboard',
        description: 'Design a high-end, cyberpunk inspired dashboard for AI agents.',
        budget: '$3000',
        platform: 'Freelancer',
        url: 'https://freelancer.com/projects/design',
        createdAt: new Date().toISOString(),
        status: 'new',
      }
    ];
  }
}
