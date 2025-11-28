import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateWordInput,
  GenerateWordOutput,
  GenerateWordInputSchema,
  GenerateWordOutputSchema,
} from '@/ai/schemas/word';

export async function generateWord(
  input: GenerateWordInput
): Promise<GenerateWordOutput> {
  return generateWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema, format: 'json' },
  model: googleAI.model('gemini-1.5-pro'),
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
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate word from AI.');
    }
    return output;
  }
);
