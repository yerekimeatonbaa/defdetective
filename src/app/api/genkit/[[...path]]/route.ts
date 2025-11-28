
import run from '@genkit-ai/next';
import '@/ai/flows/game-sounds-flow';
import '@/ai/flows/generate-word-flow';
import '@/ai/flows/generate-hints';

export const POST = run({
  // The AI instance is already configured in src/ai/genkit.ts
});
