
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // ❌ Do NOT set a "default model" here.
  // All flows should specify their own model.
});
