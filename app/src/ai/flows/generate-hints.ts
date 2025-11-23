'use server';
/**
 * @fileOverview A flow to generate a smart hint for the word puzzle game.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// 1. Update Import: Import the specific model object (gemini15Pro)
import { gemini15Pro } from '@genkit-ai/googleai';

export const GenerateHintInputSchema = z.object({
  word: z.string().describe('The secret word for the puzzle.'),
  incorrectGuesses: z.string().describe('A string of letters the user has already guessed incorrectly.'),
  lettersToReveal: z.number().describe('The number of letters to reveal in the hint.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

export const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('The partially revealed word, using underscores for unrevealed letters.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

// 2. Move this to the bottom or keep here, but ensure the flow is defined before calling it 
// (Function hoisting usually handles this, but defining the flow first is safer in some contexts).
export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema },
  
  // 3. FIX: Use the imported model object directly. 
  // Do not use `googleAI.model(...)`
  model: gemini15Pro, 

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

// 4. FIX: Variable names cannot have hyphens (-).
// Changed 'generate-hintFlow' to 'generateHintFlow'
const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate hint from AI.');
    }
    return output;
  }
);