
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const SmartHintInputSchema = z.object({
  word: z.string(),
  incorrectGuesses: z.string(),
  lettersToReveal: z.number(),
});

const SmartHintOutputSchema = z.object({
  hint: z.string(),
});

export const smartHintFlow = ai.defineFlow(
  {
    name: 'smartHintFlow',
    inputSchema: SmartHintInputSchema,
    outputSchema: SmartHintOutputSchema,
  },
  async ({ word, incorrectGuesses, lettersToReveal }) => {
    const { output } = await ai.generate({
      model: googleAI('gemini-1.5-flash'),
      prompt: `
        You are an AI assistant helping with smart word puzzle hints.

        Word: "${word}"
        Incorrect guesses: "${incorrectGuesses}"
        Letters to reveal: ${lettersToReveal}

        Rules:
        - Reveal ONLY the requested number of letters.
        - Do NOT reveal letters in incorrect guesses.
        - Other letters must remain "_".
        - Return ONLY valid JSON in the format: { "hint": "e_a__p_e" }

        Produce the hint now.
      `,
      output: {
        schema: SmartHintOutputSchema,
      },
    });

    return output ?? { hint: '' };
  }
);
