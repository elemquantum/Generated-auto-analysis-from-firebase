'use server';

/**
 * @fileOverview Generates studio-quality images using Gemini 2.5 Flash Image.
 * Strictly follows Genkit 1.x multimodal modality requirements.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateProductPresentationInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productImageDataUri: z.string().describe("Original photo as Base64 data URI."),
});
export type GenerateProductPresentationInput = z.infer<typeof GenerateProductPresentationInputSchema>;

const GenerateProductPresentationOutputSchema = z.object({
  presentationImages: z.array(z.string()).describe('Array of Base64 data URIs for studio-quality images.'),
});
export type GenerateProductPresentationOutput = z.infer<typeof GenerateProductPresentationOutputSchema>;

export async function generateProductPresentation(
  input: GenerateProductPresentationInput
): Promise<GenerateProductPresentationOutput> {
  const { productName, productImageDataUri } = input;
  
  const prompts = [
    `Edit to place the '${productName}' on a clean, minimal white studio background.`,
    `Create a high-quality studio photograph of the '${productName}' on a light gray background.`,
  ];

  const imagePromises = prompts.map(promptText => 
    ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      prompt: [
        { media: { url: productImageDataUri } },
        { text: promptText },
      ],
      config: {
        // REQUIRED: Gemini Image models must specify both TEXT and IMAGE to avoid 400 errors
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })
  );

  const results = await Promise.all(imagePromises);
  const successfulImages = results
    .flatMap(res => res.media.map(m => m.url))
    .filter((url): url is string => !!url);

  return { presentationImages: successfulImages };
}
