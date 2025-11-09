import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1', // ✅ Force Genkit to use the stable v1 API
    }),
  ],
  model: 'googleai/gemini-1.5-flash', // ✅ Modern, supported model
});
