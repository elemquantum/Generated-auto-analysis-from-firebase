
'use server';
/**
 * @fileOverview A flow to answer user questions about a market analysis and identified product.
 *
 * - answerQuestionsAboutMarketAnalysis - A function that handles answering questions about market analysis.
 * - AnswerQuestionsAboutMarketAnalysisInput - The input type for the answerQuestionsAboutMarketAnalysis function.
 * - AnswerQuestionsAboutMarketAnalysisOutput - The return type for the answerQuestionsAboutMarketAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const AnswerQuestionsAboutMarketAnalysisInputSchema = z.object({
  question: z.string().describe('The user question about the market analysis or identified product.'),
  marketAnalysis: z.string().describe('The complete market analysis of the identified product.'),
});
export type AnswerQuestionsAboutMarketAnalysisInput = z.infer<typeof AnswerQuestionsAboutMarketAnalysisInputSchema>;

const AnswerQuestionsAboutMarketAnalysisOutputSchema = z.object({
  answer: z.string().describe('The AI assistant answer to the user question.'),
});
export type AnswerQuestionsAboutMarketAnalysisOutput = z.infer<typeof AnswerQuestionsAboutMarketAnalysisOutputSchema>;

export async function answerQuestionsAboutMarketAnalysis(input: AnswerQuestionsAboutMarketAnalysisInput): Promise<AnswerQuestionsAboutMarketAnalysisOutput> {
  return answerQuestionsAboutMarketAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsAboutMarketAnalysisPrompt',
  input: {schema: AnswerQuestionsAboutMarketAnalysisInputSchema},
  output: {schema: AnswerQuestionsAboutMarketAnalysisOutputSchema},
  prompt: `Вие сте AI асистент, който отговаря на въпроси на потребители относно предоставен пазарен анализ на продукт за българския и европейския пазар. Използвайте пазарния анализ, за да формулирате отговор на въпроса. Когато отговаряте, вземете предвид контекста на продажбите в България (по-специално Русе) и по-широка Европа. Цените са в български лева (BGN). Отговорете на български език.

Пазарен анализ:
{{{marketAnalysis}}}

Въпрос:
{{question}}

Отговор:
`,
});

const answerQuestionsAboutMarketAnalysisFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutMarketAnalysisFlow',
    inputSchema: AnswerQuestionsAboutMarketAnalysisInputSchema,
    outputSchema: AnswerQuestionsAboutMarketAnalysisOutputSchema,
  },
  async (input) => {
    return runFlowWithFailover(prompt, input);
  }
);
