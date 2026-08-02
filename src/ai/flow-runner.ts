'use server';

import { Prompt, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ModelReference } from 'genkit/ai';
import { ai } from '@/ai/genkit';

/**
 * Prioritized list of models for the failover cascade.
 * Gemini 1.5 Pro is the heavy-lifter, falling back to 1.5 Flash.
 */
const modelPreferences: ModelReference<any>[] = [
  googleAI.model('gemini-1.5-pro'),
  googleAI.model('gemini-1.5-flash'),
];

/**
 * Executes a Genkit prompt with a robust failover mechanism.
 * Fixes common 400 errors by ensuring correct model identification and safety config.
 */
export async function runFlowWithFailover<I, O, S extends z.ZodTypeAny>(
  prompt: Prompt<I, O, S>,
  input: I
): Promise<O> {
  let lastError: any;

  for (const model of modelPreferences) {
    try {
      console.log(`[FlowRunner] Attempting execution with model: ${model.name}`);
      
      // Call the prompt object directly (Genkit 1.x pattern)
      const { output } = await prompt(input, { 
        model,
        config: {
          // Relaxing safety settings to prevent unnecessary 400/blocked errors
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ],
        }
      });
      
      if (output === undefined) {
        throw new Error('Model returned an empty output.');
      }
      
      console.log(`[FlowRunner] Success with model: ${model.name}`);
      return output;
    } catch (error: any) {
      console.warn(`[FlowRunner] Model ${model.name} failed. Reason: ${error.message}`);
      lastError = error;
      // If it's a 400 or quota error, we definitely want to try the next model
    }
  }

  console.error('[FlowRunner] Fatal: All AI models in the cascade failed.', lastError);
  throw new Error(`AI processing failed. ${lastError?.message || 'Unknown error'}`);
}
