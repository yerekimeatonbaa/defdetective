
import run from '@genkit-ai/next';
import { ai } from '@/ai/genkit';
import '@/ai/flows/game-sounds-flow';
import '@/ai/flows/generate-word-flow';
import '@/ai/flows/generate-hints';

export const POST = run(ai as any);
