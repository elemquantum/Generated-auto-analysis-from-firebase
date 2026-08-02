import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization with the Google AI plugin.
 * Configured for Genkit 1.x compatibility.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  ],
  logLevel: 'debug',
});
