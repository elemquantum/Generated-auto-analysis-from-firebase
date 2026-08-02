'use server';
/**
 * @fileOverview A flow to convert text with multiple speakers to speech.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const MultiSpeakerTextToSpeechInputSchema = z.object({
  script: z.string().describe('The script with speaker tags (e.g., Speaker1: ... Speaker2: ...) to be converted to speech.'),
});
export type MultiSpeakerTextToSpeechInput = z.infer<typeof MultiSpeakerTextToSpeechInputSchema>;

const MultiSpeakerTextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a data URI in WAV format.'),
});
export type MultiSpeakerTextToSpeechOutput = z.infer<typeof MultiSpeakerTextToSpeechOutputSchema>;

export async function multiSpeakerTextToSpeech(input: MultiSpeakerTextToSpeechInput): Promise<MultiSpeakerTextToSpeechOutput> {
  return multiSpeakerTextToSpeechFlow(input);
}

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
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const multiSpeakerTextToSpeechFlow = ai.defineFlow(
  {
    name: 'multiSpeakerTextToSpeechFlow',
    inputSchema: MultiSpeakerTextToSpeechInputSchema,
    outputSchema: MultiSpeakerTextToSpeechOutputSchema,
  },
  async ({script}) => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Algenib' },
                },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Fornax' },
                },
              },
            ],
          },
        },
      },
      prompt: script,
    });
    if (!media) {
      throw new Error('No audio media was returned from the TTS model.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
