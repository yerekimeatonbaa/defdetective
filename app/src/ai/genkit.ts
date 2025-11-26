
import { genkit, gemini15Flash } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1', // Force stable v1 API
    }),
  ],
  models: [
    gemini15Flash
  ]
});
