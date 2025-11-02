
import { createApiHandler } from '@genkit-ai/next';
import '@/ai/flows/smart-word-hints';
import '@/ai/flows/game-sounds-flow';

export const { GET, POST } = createApiHandler();
