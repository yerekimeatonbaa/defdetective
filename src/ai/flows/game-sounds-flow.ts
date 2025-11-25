import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';  // ✅ CORRECT import

const GameSoundInputSchema = z
  .string()
  .describe('The text to convert into a sound effect');
export type GameSoundInput = z.infer<typeof GameSoundInputSchema>;

const GameSoundOutputSchema = z.object({
  soundDataUri: z.string(),
});
export type GameSoundOutput = z.infer<typeof GameSoundOutputSchema>;

export async function getGameSound(input: GameSoundInput) {
  return gameSoundFlow(input);
}

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const buffers: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', d => buffers.push(d));
    writer.on('end', () =>
      resolve(Buffer.concat(buffers).toString('base64'))
    );

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
  async query => {
    const { media } = await ai.generate({
      // ✅ Correct TTS model name for YOUR plugin version
      model: googleAI.model('googleai/gemini-2.0-flash-tts'),

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

    if (!media) throw new Error('No audio returned');

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      soundDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
