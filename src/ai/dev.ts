'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-product-comprehensive.ts';
import '@/ai/flows/answer-questions-about-market-analysis.ts';
import '@/ai/flows/generate-client-intake-report.ts';
import '@/ai/flows/generate-inventory-report.ts';
import '@/ai/flows/generate-product-improvement-guide.ts';
import '@/ai/flows/generate-product-page.ts';
import '@/ai/flows/generate-product-presentation.ts';
import '@/ai/flows/generate-repair-and-investment-analysis.ts';
import '@/ai/flows/multi-speaker-tts.ts';
import '@/ai/flows/text-to-speech.ts';
