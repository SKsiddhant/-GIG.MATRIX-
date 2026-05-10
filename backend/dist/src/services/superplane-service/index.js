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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperplaneService = void 0;
class SuperplaneService {
    constructor(apiKey) {
        this.baseUrl = 'https://api.superplane.ai/v1';
        this.apiKey = apiKey;
    }
    /**
     * Triggers a Superplane workflow for a qualified lead.
     * This workflow typically includes:
     * 1. Data Enrichment: Gathering more details about the client.
     * 2. Human Approval: Notifying the user for a manual sign-off.
     * 3. Engagement: Sending the initial proposal if approved.
     */
    triggerLeadWorkflow(lead, evaluation) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[SuperplaneService] Triggering workflow for lead: ${lead.title}`);
            // In a real implementation, we would call Superplane's workflow trigger API.
            // const response = await axios.post(`${this.baseUrl}/workflows/trigger`, {
            //   workflowId: 'gig-hunter-main',
            //   input: { lead, evaluation }
            // }, {
            //   headers: { Authorization: `Bearer ${this.apiKey}` }
            // });
            // return response.data.runId;
            const mockRunId = `run_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`[SuperplaneService] Workflow triggered. Run ID: ${mockRunId}`);
            return mockRunId;
        });
    }
}
exports.SuperplaneService = SuperplaneService;
