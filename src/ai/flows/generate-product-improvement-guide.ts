
'use server';

/**
 * @fileOverview An AI agent that generates a guide on how to create an improved version of a given product.
 *
 * - generateProductImprovementGuide - A function that generates the guide.
 * - GenerateProductImprovementGuideInput - The input type for the function.
 * - GenerateProductImprovementGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const GenerateProductImprovementGuideInputSchema = z.object({
  productName: z.string().describe('The name of the original product.'),
  productType: z.string().optional().describe('The type or model of the original product.'),
  category: z.string().describe('The category of the original product.'),
  marketAnalysisSummary: z.string().describe('A summary of the market analysis for the original product, including pricing and demand insights.'),
});
export type GenerateProductImprovementGuideInput = z.infer<typeof GenerateProductImprovementGuideInputSchema>;

const StepSchema = z.object({
    title: z.string().describe('The title of the step.'),
    description: z.string().describe('A detailed description of the step, including what to do and what to watch out for.'),
});

const GenerateProductImprovementGuideOutputSchema = z.object({
  improvementSuggestions: z.array(z.string()).describe('A list of specific, actionable suggestions on how to improve the original product.'),
  estimatedTimeline: z.string().describe('A realistic, high-level estimated timeline for creating the improved product (e.g., "1-2 weeks for a prototype", "3-4 months for a small production run").'),
  requiredSkillsAndResources: z.array(z.string()).describe('A list of necessary skills (e.g., "3D modeling", "Electronics soldering") and resources (eg., "3D printer", "Access to wholesale suppliers") needed.'),
  stepByStepGuide: z.array(StepSchema).describe('A detailed, step-by-step guide to developing and launching the improved product.'),
  marketOpportunityAnalysis: z.string().describe('An analysis of the market opportunity for this new, improved product, explaining why it has the potential to be a "hit".'),
});
export type GenerateProductImprovementGuideOutput = z.infer<typeof GenerateProductImprovementGuideOutputSchema>;


export async function generateProductImprovementGuide(
  input: GenerateProductImprovementGuideInput
): Promise<GenerateProductImprovementGuideOutput> {
  return generateProductImprovementGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductImprovementGuidePrompt',
  input: {schema: GenerateProductImprovementGuideInputSchema},
  output: {schema: GenerateProductImprovementGuideOutputSchema},
  prompt: `You are a world-class product development consultant and business strategist. Your task is to analyze an existing product and create a detailed guide on how to develop and launch a new, improved, "hit" version of it. Your analysis and guide must be in Bulgarian.

Based on the provided product information, generate a comprehensive guide with the following sections:

1.  **Improvement Suggestions:** Provide a list of concrete, innovative ideas to make the product better. Think about features, materials, design, branding, and user experience.
2.  **Market Opportunity Analysis:** Explain why an improved version of this product would be successful. Analyze the market gap it could fill and its potential to be a "hit".
3.  **Required Skills and Resources:** List the key skills (e.g., "3D-моделиране", "Програмиране на микроконтролери") and resources (e.g., "Достъп до доставчици на едро", "Работилница с инструменти") required to create the improved product.
4.  **Estimated Timeline:** Give a realistic, high-level timeline for the project, from concept to launch.
5.  **Step-by-Step Guide:** Provide a detailed, step-by-step plan for development. Each step should have a clear title and a description of the actions to be taken.

**Original Product Information:**
- Product Name: {{{productName}}}
- Product Type: {{{productType}}}
- Category: {{{category}}}
- Market Analysis Summary:
{{{marketAnalysisSummary}}}
`,
});

const generateProductImprovementGuideFlow = ai.defineFlow(
  {
    name: 'generateProductImprovementGuideFlow',
    inputSchema: GenerateProductImprovementGuideInputSchema,
    outputSchema: GenerateProductImprovementGuideOutputSchema,
  },
  async (input) => {
    return runFlowWithFailover(prompt, input);
  }
);
