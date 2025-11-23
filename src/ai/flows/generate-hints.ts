'use server';
/**
 * @fileOverview A flow to generate a smart hint for the word puzzle game.
 *
 * - generateHint - A function that generates a hint.
 */

import { ai } from '@/ai/genkit';
import { geminiPro } from '@genkit-ai/google-genai';
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
  model: geminiPro,
  prompt: `You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
The user gives you a secret word, a string of letters they have already guessed incorrectly, and a number of letters to reveal.

Rules:
1. Your response MUST adhere to the provided JSON schema.
2. The value of "hint" should be a string representing the secret word.
3. In this string, exactly {{lettersToReveal}} letters of the secret word should be revealed.
4. All other letters MUST be represented by an underscore "_".
5. You MUST NOT reveal any letters that the user has already guessed incorrectly ("{{incorrectGuesses}}"). Choose other letters to reveal.

Here is the data for this request:
- Secret Word: "{{word}}"
- Incorrect Guesses: "{{incorrectGuesses}}"
- Letters to Reveal: {{lettersToReveal}}

Produce the JSON response now.`,
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('Failed to generate hint from AI.');
    }
    return output;
  }
);
