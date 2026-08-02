'use server';

/**
 * @fileOverview A comprehensive AI agent that identifies products and generates market analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const IdentifiedProductSchema = z.object({
  brand: z.string().optional().describe('The brand of the product.'),
  model: z.string().optional().describe('The model of the product.'),
  type: z.string().optional().describe('The type of the product.'),
  category: z.string().optional().describe('A general category (e.g., "Electronics").'),
});

const ConditionAssessmentSchema = z.object({
  condition: z.enum(['new', 'used', 'for repair', 'for parts', 'scrap']).describe('The assessed condition.'),
  justification: z.string().describe('Detailed explanation for the condition assessment.'),
});

const PricePointsSchema = z.object({
  min: z.number().describe('Minimum verifiable market price.'),
  max: z.number().describe('Maximum verifiable market price.'),
  realisticFast: z.number().describe('Price for sale within 1 month.'),
  realisticOptimal: z.number().describe('Balanced price for sale within 3 months.'),
  realisticSlow: z.number().describe('Maximum profit price for sale within 6 months.'),
});

const MarketAnalysisSchema = z.object({
  currency: z.string().describe('Currency (e.g., BGN).'),
  newPrice: PricePointsSchema,
  usedPrice: PricePointsSchema,
  forRepairPrice: PricePointsSchema,
  forPartsPrice: PricePointsSchema,
  forScrapPrice: PricePointsSchema,
  analysisJustification: z.string().describe('Deep-dive justification in Bulgarian.'),
});

const SalesStrategySchema = z.object({
  executiveSummary: z.string().describe('Concise analysis summary.'),
  marketingPlan: z.object({
    targetAudience: z.string().describe('Ideal customer group.'),
    salesDescription: z.string().describe('Compelling listing description.'),
  }),
});

const AnalyzeProductComprehensiveInputSchema = z.object({
  photoDataUri: z.string().describe("Photo/Video as Base64 data URI."),
});
export type AnalyzeProductComprehensiveInput = z.infer<typeof AnalyzeProductComprehensiveInputSchema>;

const AnalyzedProductSchema = z.object({
  identification: IdentifiedProductSchema,
  conditionAssessment: ConditionAssessmentSchema,
  marketAnalysis: MarketAnalysisSchema,
  salesStrategy: SalesStrategySchema,
});

const AnalyzeProductComprehensiveOutputSchema = z.object({
  products: z.array(AnalyzedProductSchema).describe('List of analyzed products.'),
});
export type AnalyzeProductComprehensiveOutput = z.infer<typeof AnalyzeProductComprehensiveOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeProductComprehensivePrompt',
  input: { schema: AnalyzeProductComprehensiveInputSchema },
  output: { schema: AnalyzeProductComprehensiveOutputSchema },
  prompt: `You are an expert product valuer. Analyze the provided image/video.
For EACH product, identify brand/model, assess condition, and perform a deep market analysis for Bulgaria/Europe.
All text justifications and marketing copy MUST be in Bulgarian.

Photo/Video: {{media url=photoDataUri}}`,
});

export async function analyzeProductComprehensive(
  input: AnalyzeProductComprehensiveInput
): Promise<AnalyzeProductComprehensiveOutput> {
  return runFlowWithFailover(prompt, input);
}
