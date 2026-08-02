
'use server';

/**
 * @fileOverview An AI agent that analyzes the profitability of repairing and reselling a product.
 *
 * - generateRepairAndInvestmentAnalysis - A function that generates the analysis.
 * - GenerateRepairAndInvestmentAnalysisInput - The input type for the function.
 * - GenerateRepairAndInvestmentAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const GenerateRepairAndInvestmentAnalysisInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productType: z.string().optional().describe('The type or model of the product.'),
  category: z.string().describe('The category of the product.'),
  purchasePrice: z.number().describe('The price at which the product was purchased or the initial investment cost.'),
  marketPriceAfterRepair: z.number().describe('The realistic optimal selling price for the product in "used" (repaired) condition.'),
  currency: z.string().describe('The currency for the prices (e.g., "BGN").'),
});
export type GenerateRepairAndInvestmentAnalysisInput = z.infer<typeof GenerateRepairAndInvestmentAnalysisInputSchema>;

const ProfitabilityAnalysisSchema = z.object({
    totalCost: z.number().describe('The total cost, including purchase price, repair costs, labor, and other expenses.'),
    potentialProfit: z.number().describe('The potential net profit after selling the repaired product.'),
    roi: z.number().describe('The return on investment (ROI) as a percentage.'),
    recommendation: z.string().describe('A detailed recommendation on whether the investment is financially sound, including the reasoning.'),
    recommendationAction: z.enum(['buy', 'hold', 'sell']).describe('A simple action keyword based on the recommendation.')
});

const OtherCostSchema = z.object({
    name: z.string().describe('The name of the additional cost (e.g., "Такса за куриер", "Държавна такса", "Разход за ток").'),
    cost: z.number().describe('The estimated amount for this cost.'),
});

const GenerateRepairAndInvestmentAnalysisOutputSchema = z.object({
  repairComplexity: z.enum(['Ниска', 'Средна', 'Висока']).describe('The assessed complexity of the repair.'),
  estimatedRepairTime: z.string().describe('A realistic, estimated time to complete the repair (e.g., "2-4 часа", "1-2 дни").'),
  requiredMaterials: z.array(z.string()).describe('A list of necessary materials, parts, or consumables for the repair, including potential sources or distributors.'),
  requiredSkills: z.array(z.string()).describe('A list of necessary skills (e.g., "Запояване на електроника", "Работа с мултицет") to perform the repair.'),
  stepByStepGuide: z.string().describe('A detailed, step-by-step guide on how to perform the repair. This should be practical and clear and may include suggestions for design improvements.'),
  estimatedRepairCost: z.number().describe('The estimated cost of all materials and parts needed for the repair.'),
  estimatedLaborCost: z.number().describe('The estimated cost of labor for the repair, calculated based on the complexity and time.'),
  otherCosts: z.array(OtherCostSchema).describe('A list of other potential costs, such as operational expenses (electricity), government fees, or logistics.'),
  profitabilityAnalysis: ProfitabilityAnalysisSchema,
});
export type GenerateRepairAndInvestmentAnalysisOutput = z.infer<typeof GenerateRepairAndInvestmentAnalysisOutputSchema>;

export async function generateRepairAndInvestmentAnalysis(
  input: GenerateRepairAndInvestmentAnalysisInput
): Promise<GenerateRepairAndInvestmentAnalysisOutput> {
  return generateRepairAndInvestmentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRepairAndInvestmentAnalysisPrompt',
  input: {schema: GenerateRepairAndInvestmentAnalysisInputSchema},
  output: {schema: GenerateRepairAndInvestmentAnalysisOutputSchema},
  prompt: `You are an expert repair technician and a sharp financial analyst. Your task is to analyze a product that needs repair and create a detailed plan for its restoration and assess the financial viability of this venture. All text must be in Bulgarian.

**Product Information:**
- Product Name: {{{productName}}}
- Product Type: {{{productType}}}
- Category: {{{category}}}
- Purchase Price / Investment: {{{purchasePrice}}} {{{currency}}}
- Potential Selling Price (Repaired): {{{marketPriceAfterRepair}}} {{{currency}}}

**Your Analysis Must Include:**

1.  **Repair Assessment:**
    *   **Repair Complexity:** Assess the difficulty of the repair as "Ниска", "Средна", or "Висока".
    *   **Estimated Repair Time:** Provide a realistic time estimate for the repair.
    *   **Required Materials:** List all specific parts, tools, and consumables needed. Include potential sources or distributors for these parts.
    *   **Required Skills:** List the technical skills needed to complete the repair successfully.

2.  **Step-by-Step Repair Guide:**
    *   Provide a clear, detailed, and practical step-by-step guide to diagnose and fix the most common issues for this type of product. The guide should be easy to follow.
    *   Where applicable, suggest opportunities for **design improvements or upgrades** that could increase the final value of the product.

3.  **Comprehensive Cost Analysis:**
    *   **Estimated Repair Cost:** Calculate the total cost of the required materials and parts in {{{currency}}}.
    *   **Estimated Labor Cost:** Estimate the cost of labor based on the repair time and complexity. Consider this as the cost if you were to hire someone.
    *   **Other Costs:** Identify and list any other potential costs. This could include operational costs (e.g., electricity), logistics (e.g., travel, shipping), or administrative fees (e.g., government taxes).

4.  **Financial & Profitability Analysis:**
    *   **Total Cost:** Calculate the total investment: Purchase Price + Estimated Repair Cost + Estimated Labor Cost + Sum of Other Costs.
    *   **Potential Profit:** Calculate the net profit: Potential Selling Price - Total Cost.
    *   **Return on Investment (ROI):** Calculate the ROI percentage: (Potential Profit / Total Cost) * 100.
    *   **Recommendation:** Based on the ROI, complexity, and all associated costs, provide a detailed recommendation. Explain if this is a good investment. Should the user proceed ('buy'), wait for a better opportunity ('hold'), or avoid it ('sell')? Set the \`recommendationAction\` field accordingly.

Generate a complete report based on this structure.`,
});

const generateRepairAndInvestmentAnalysisFlow = ai.defineFlow(
  {
    name: 'generateRepairAndInvestmentAnalysisFlow',
    inputSchema: GenerateRepairAndInvestmentAnalysisInputSchema,
    outputSchema: GenerateRepairAndInvestmentAnalysisOutputSchema,
  },
  async (input) => {
    return runFlowWithFailover(prompt, input);
  }
);
