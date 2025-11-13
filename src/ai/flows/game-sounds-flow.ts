'use server';
/**
 * @fileOverview A Genkit flow for generating game sound effects.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

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

    const bufs: any[] = [];
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

// Types for sound configuration
const GameSoundInputSchema = z.object({
  soundType: z.enum(['correct', 'incorrect', 'win', 'hint', 'click']),
});
export type GameSoundInput = z.infer<typeof GameSoundInputSchema>;

export const gameSoundsFlow = ai.defineFlow(
  {
    name: 'gameSoundsFlow',
    inputSchema: z.string(),
    outputSchema: z.any(),
  },
  async query => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: query,
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

export async function getSoundAction(input: GameSoundInput) {
    return gameSoundsFlow(input.soundType);
}
