'use server';
/**
 * @fileOverview Generates game sound effects using Text-to-Speech.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
// googleAI import is not needed if we use the string ID for the model

const GameSoundInputSchema = z
  .string()
  .describe(
    'The text to convert to a sound effect (e.g., "ding", "buzz", "level up").'
  );
export type GameSoundInput = z.infer<typeof GameSoundInputSchema>;

const GameSoundOutputSchema = z.object({
  soundDataUri: z.string().describe('The generated sound as a base64 data URI.'),
});
export type GameSoundOutput = z.infer<typeof GameSoundOutputSchema>;

export async function getGameSound(
  input: GameSoundInput
): Promise<GameSoundOutput> {
  return gameSoundFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const gameSoundFlow = ai.defineFlow(
  {
    name: 'gameSoundFlow',
    inputSchema: GameSoundInputSchema,
    outputSchema: GameSoundOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      // FIX: Use the full string identifier for preview models
      // Note: Ensure your API key has access to this specific preview model
      model: 'googleai/gemini-2.5-flash-preview-tts',
      
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });
    
    if (!media) {
      throw new Error('no media returned');
    }
    
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);
    
    return {
      soundDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);