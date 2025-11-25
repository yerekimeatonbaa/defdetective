import { z } from 'zod';

const GenerateHintInputSchema = z.object({
  word: z.string().describe('The secret word for the puzzle.'),
  incorrectGuesses: z.string().describe('A string of letters the user has already guessed incorrectly.'),
  lettersToReveal: z.number().describe('The number of letters to reveal in the hint.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('The partially revealed word, using underscores for unrevealed letters.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export { GenerateHintInputSchema, GenerateHintOutputSchema };
