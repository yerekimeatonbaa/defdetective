
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

/**
 * Input Schema
 */
const SmartHintInputSchema = z.object({
  word: z.string(),
  incorrectGuesses: z.string(),
  lettersToReveal: z.number(),
});

/**
 * Output Schema
 */
const SmartHintOutputSchema = z.object({
  hint: z.string(),
});

/**
 * Prompt
 */
export const smartHintPrompt = ai.definePrompt({
  name: 'smartHintPrompt',
  model: googleAI('gemini-1.5-flash'),
  input: { schema: SmartHintInputSchema },
  output: { schema: SmartHintOutputSchema },
  prompt: `
You are an AI assistant helping with smart word puzzle hints.

Word: "{{{word}}}"
Incorrect guesses: "{{{incorrectGuesses}}}"
Letters to reveal: "{{{lettersToReveal}}}"

Rules:
- Reveal ONLY the requested number of letters.
- Do NOT reveal letters in incorrect guesses.
- Other letters must remain "_".
- Return ONLY valid JSON:

{ "hint": "e_a__p_e" }

Produce the hint now.
  `,
});
