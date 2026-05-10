import axios, { AxiosInstance } from 'axios';
import { GigLead, AgentEvaluation } from '../../shared/types';

export class SuperplaneService {
  private client: AxiosInstance;
  private canvasId: string;

  constructor(apiKey: string) {
    this.canvasId = process.env.SUPERPLANE_CANVAS_ID || 'gig-hunter-main';
    this.client = axios.create({
      baseURL: process.env.SUPERPLANE_BASE_URL || 'https://api.superplane.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Triggers a Superplane workflow for a qualified lead.
   */
  async triggerLeadWorkflow(lead: GigLead, evaluation: AgentEvaluation): Promise<string> {
    console.log(`[SuperplaneService] Triggering workflow for lead: ${lead.title}`);

    try {
      // Per Superplane API docs, we trigger an execution for a specific canvas
      const response = await this.client.post(`/canvases/${this.canvasId}/executions`, {
        input: {
          lead,
          evaluation,
          triggeredAt: new Date().toISOString(),
          metadata: {
            source: 'autonomous-gig-hunter',
            priority: evaluation.score > 90 ? 'high' : 'normal'
          }
        }
      });

      const executionId = response.data.id || response.data.executionId;
      console.log(`[SuperplaneService] Workflow triggered successfully. Execution ID: ${executionId}`);
      return executionId;
    } catch (error: any) {
      console.error('[SuperplaneService] Error triggering workflow:', error.response?.data || error.message);
      
      // Fallback for demonstration if API fails or is not configured
      if (!process.env.SUPERPLANE_API_KEY || process.env.SUPERPLANE_API_KEY.includes('your_')) {
        const mockExecutionId = `exec_mock_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[SuperplaneService] Falling back to mock execution ID: ${mockExecutionId}`);
        return mockExecutionId;
      }
      
      throw new Error('Failed to trigger Superplane workflow');
    }
  }

  /**
   * Optional: Poll for execution status or wait for human-in-the-loop approval.
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    try {
      const response = await this.client.get(`/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error(`[SuperplaneService] Error fetching execution status: ${executionId}`, error);
      return null;
    }
  }
}
