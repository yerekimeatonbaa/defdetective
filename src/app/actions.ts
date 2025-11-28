'use server';

import { generateWord as generateWordFlow } from '@/ai/flows/generate-word-flow';
import type { GenerateWordInput, GenerateWordOutput } from '@/ai/schemas/word';

export async function generateWord(input: GenerateWordInput): Promise<GenerateWordOutput> {
  return generateWordFlow(input);
}
