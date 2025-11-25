<<<<<<< HEAD
import { run } from '@genkit-ai/next';
import { ai } from '@/ai/genkit';
import '@/ai/flows/game-sounds-flow';
import '@/ai/flows/generate-word-flow';
import '@/ai/flows/generate-hints';
=======
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { NextRequest } from "next/server";
import { GENKIT_CLIENT_HEADER } from "genkit";
import run from "@genkit-ai/next";
>>>>>>> e182bddde71e154e477ff491b4ad0a30f2238d83

export const POST = run({
  // The AI instance is already configured in src/ai/genkit.ts
});
<<<<<<< HEAD
=======

export async function POST(req: NextRequest) {
  const isGenkitClient = req.headers.has(GENKIT_CLIENT_HEADER);
  const body = await req.json();
  const runAny: any = run;
  return await runAny(body, {
    isGenkitClient,
  });
}
>>>>>>> e182bddde71e154e477ff491b4ad0a30f2238d83
