
'use server';

/**
 * @fileOverview An AI agent that helps prepare for a first client meeting.
 *
 * - generateClientIntakeReport - A function that generates a report based on a client request.
 * - GenerateClientIntakeReportInput - The input type for the function.
 * - GenerateClientIntakeReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const GenerateClientIntakeReportInputSchema = z.object({
  clientRequest: z.string().describe('The initial request or problem description from the client.'),
});
export type GenerateClientIntakeReportInput = z.infer<typeof GenerateClientIntakeReportInputSchema>;

const GenerateClientIntakeReportOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the client\'s request and perceived goals.'),
  clarifyingQuestions: z.array(z.string()).describe('A list of important questions to ask the client to clarify scope, goals, and constraints.'),
  potentialScope: z.array(z.string()).describe('A high-level list of potential tasks or features for the project.'),
  suggestedStack: z.array(z.string()).describe('A list of suggested technologies, platforms, or tools that might be suitable for the project.'),
  highLevelTimeline: z.string().describe('A very rough, high-level estimated timeline (e.g., "2-3 weeks", "3-6 months").'),
});
export type GenerateClientIntakeReportOutput = z.infer<typeof GenerateClientIntakeReportOutputSchema>;


export async function generateClientIntakeReport(
  input: GenerateClientIntakeReportInput
): Promise<GenerateClientIntakeReportOutput> {
  return generateClientIntakeReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateClientIntakeReportPrompt',
  input: {schema: GenerateClientIntakeReportInputSchema},
  output: {schema: GenerateClientIntakeReportOutputSchema},
  prompt: `You are an expert business analyst and project manager. Your task is to analyze an initial client request and prepare a structured report to facilitate the first client meeting. Your goal is to demonstrate understanding, identify ambiguities, and set the stage for a productive discussion. All text must be in Bulgarian.

Based on the client request below, generate the following:

1.  **Summary:** A concise summary of your understanding of the client's project and goals.
2.  **Clarifying Questions:** A list of critical questions to ask the client. These should help clarify the project's scope, target audience, budget, success metrics, and any other ambiguities.
3.  **Potential Scope:** A bullet-point list of high-level features or tasks that seem to be part of the project based on the initial request.
4.  **Suggested Stack:** A list of potential technologies, platforms, or tools that would be appropriate for this kind of project.
5.  **High-Level Timeline:** A very rough, non-binding estimate of the project duration (e.g., "Малък (2-4 седмици)", "Среден (1-3 месеца)", "Голям (3-6+ месеца)").

Client Request:
{{{clientRequest}}}
`,
});

const generateClientIntakeReportFlow = ai.defineFlow(
  {
    name: 'generateClientIntakeReportFlow',
    inputSchema: GenerateClientIntakeReportInputSchema,
    outputSchema: GenerateClientIntakeReportOutputSchema,
  },
  async (input) => {
    return runFlowWithFailover(prompt, input);
  }
);
