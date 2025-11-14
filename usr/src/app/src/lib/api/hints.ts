
'use server';

import { run, type Flow } from '@genkit-ai/flow';
import { smartHintFlow } from '@/ai/flows/smart-word-hints';
import type { z } from 'genkit';

type SmartHintInput = z.infer<typeof smartHintFlow.inputSchema>;
type SmartHintOutput = z.infer<typeof smartHintFlow.outputSchema>;

export async function getSmartHint(
  input: SmartHintInput
): Promise<SmartHintOutput> {
  const flow: Flow<SmartHintInput, SmartHintOutput, any> = smartHintFlow;
  return await run(flow, input);
}
