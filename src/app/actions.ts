'use server';

import type { GenerateWordInput, GenerateWordOutput } from '@/ai/schemas/word';

export async function generateWord(input: GenerateWordInput): Promise<GenerateWordOutput> {
  try {
    // Call the genkit API endpoint instead of using the flow directly
    const response = await fetch('/api/genkit/generateWordFlow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.result) {
      throw new Error('Invalid response from AI API');
    }

    return {
      word: String(data.result.word),
      definition: String(data.result.definition),
    };
  } catch (error) {
    console.error('Error in generateWord server action:', error);
    throw new Error(`Failed to generate word: ${error instanceof Error ? error.message : String(error)}`);
  }
}
