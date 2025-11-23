
import { genkit, Plugin } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins: Plugin<any>[] = [];
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  // All flows should specify their own model.
});
