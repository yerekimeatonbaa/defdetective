
'use server';

import { getSmartHint as getSmartHintFlow, SmartHintInput } from '@/ai/flows/smart-word-hints';
import { getGameSound as getGameSoundFlow, GameSoundInput } from '@/ai/flows/game-sounds-flow';
import { initFirestore } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function getHintAction(data: {
  word: string;
  incorrectGuesses: string;
  lettersToReveal: number;
}) {
  try {
    const input: SmartHintInput = {
      word: data.word,
      incorrectGuesses: data.incorrectGuesses,
      lettersToReveal: data.lettersToReveal, 
    };
    const result = await getSmartHintFlow(input);
    if (!result || !result.hint) {
        throw new Error("Invalid hint response from AI.");
    }
    return { hint: result.hint, error: null };
  } catch (error) {
    console.error("Error getting hint:", error);
    return { hint: null, error: 'Failed to get a hint. Please try again.' };
  }
}

export async function getSoundAction(sound: string) {
    try {
        const input: GameSoundInput = sound;
        const result = await getGameSoundFlow(input);
        if (!result || !result.soundDataUri) {
            throw new Error('Invalid sound response from AI.');
        }
        return { soundDataUri: result.soundDataUri, error: null };
    } catch (error) {
        console.error(`Error getting sound for "${sound}":`, error);
        return { soundDataUri: null, error: `Failed to get sound: ${sound}` };
    }
}

export async function useHintAction(data: { userId: string }) {
  try {
    initFirestore();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(data.userId);
    
    const result = await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);

      if (!userDoc.exists) {
        return { success: false, message: 'User profile not found.' };
      }

      const currentHints = userDoc.data()?.hints ?? 0;

      if (currentHints <= 0) {
        return { success: false, message: "You don't have any hints left." };
      }

      transaction.update(userProfileRef, { hints: currentHints - 1 });
      return { success: true, message: 'Hint used successfully.' };
    });

    return { ...result, error: null };

  } catch (error: any) {
    console.error('Error using hint:', error);
    return { success: false, message: error.message || 'Failed to use a hint.', error: 'Failed to use a hint. Please try again.' };
  }
}
