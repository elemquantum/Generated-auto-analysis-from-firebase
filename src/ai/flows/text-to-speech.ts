'use server';

/**
 * @fileOverview High-fidelity Text-to-Speech conversion.
 * Uses Gemini 2.5 Flash Preview TTS with PCM-to-WAV conversion.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('Text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('Generated WAV audio as data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  const { media } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    config: {
      // REQUIRED: Must specify AUDIO modality to avoid 400 errors
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: input.text,
  });

  if (!media) throw new Error('TTS generation failed.');

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );
  
  const wavBase64 = await toWav(audioBuffer);
  return { audioDataUri: 'data:audio/wav;base64,' + wavBase64 };
}
