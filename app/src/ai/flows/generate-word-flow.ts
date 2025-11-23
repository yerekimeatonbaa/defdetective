'use server';
/**
 * @fileOverview A flow to generate a word and its definition for the game.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// 1. IMPORT THE MODEL OBJECT
import { gemini15Pro } from '@genkit-ai/googleai';

const GenerateWordInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word to be generated.'),
});
export type GenerateWordInput = z.infer<typeof GenerateWordInputSchema>;

const GenerateWordOutputSchema = z.object({
  word: z.string().describe('The generated word.'),
  definition: z.string().describe('The definition of the generated word.'),
});
export type GenerateWordOutput = z.infer<typeof GenerateWordOutputSchema>;

export async function generateWord(
  input: GenerateWordInput
): Promise<GenerateWordOutput> {
  return generateWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema },
  
  // 2. USE THE OBJECT DIRECTLY
  model: gemini15Pro,
  
  generationConfig: {
    responseMimeType: 'application/json',
  },
  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level. The word should be challenging but fair for the given level.

Difficulty: {{{difficulty}}}

The definition should be clear, concise, and in a dictionary style. Avoid overly obscure words unless the difficulty is 'hard'.

Produce the JSON response now.`,
});

const generateWordFlow = ai.defineFlow(
  {
    name: 'generateWordFlow',
    inputSchema: GenerateWordInputSchema,
    outputSchema: GenerateWordOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate word from AI.');
    }
    return output;
  }
);