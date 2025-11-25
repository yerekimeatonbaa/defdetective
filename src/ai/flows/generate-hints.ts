
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateHintInput,
  GenerateHintOutput,
  GenerateHintInputSchema,
  GenerateHintOutputSchema,
} from '@/ai/schemas/hint';

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema },
  model: googleAI.model('gemini-1.5-pro-002'),
  prompt: `You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
The user gives you a secret word, a string of letters they have already guessed incorrectly, and a number of letters to reveal.

  // ✅ Updated model
  model: googleAI.model('gemini-1.5-pro-002'),

  prompt: 'You are an AI assistant for a word puzzle game...'
(unchanged prompt text)
`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate hint from AI.');
    }
    return output;
  }
);
