
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Initialize a local AI instance specifically for this server action.
// This ensures the googleAI plugin is configured in the server action's context.
const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  // The FIREBASE_CONFIG env var is set automatically by App Hosting.
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  return initializeApp({
    projectId: firebaseConfig.projectId
  });
}

export async function useHintAction(data: { 
  userId: string;
  word: string;
  incorrectGuesses: string;
  lettersToReveal: number;
}): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

    // First, run a transaction to securely decrement the hint count.
    const transactionResult = await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);

      if (!userDoc.exists) {
        throw new Error('User profile not found.');
      }

      const currentHints = userDoc.data()?.hints ?? 0;

      if (currentHints <= 0) {
        return { success: false, message: "You don't have any hints left." };
      }

      // Decrement the hints count by 1.
      transaction.update(userProfileRef, { hints: currentHints - 1 });
      
      return { success: true };
    });

    // If the transaction failed (e.g., not enough hints), return the error.
    if (!transactionResult.success) {
        return { success: false, message: transactionResult.message };
    }

    // If the transaction was successful, proceed to generate the AI hint.
    const hintResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        prompt: `
            You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
            The user gives you a secret word, a string of letters they have already guessed incorrectly, and a number of letters to reveal.

            Rules:
            1.  Your response MUST be a JSON object with a single key: "hint".
            2.  The value of "hint" should be a string representing the secret word.
            3.  In this string, exactly ${data.lettersToReveal} letters of the secret word should be revealed.
            4.  All other letters MUST be represented by an underscore "_".
            5.  You MUST NOT reveal any letters that the user has already guessed incorrectly. Choose other letters to reveal.
            
            Here is the data for this request:
            - Secret Word: "${data.word}"
            - Incorrect Guesses: "${data.incorrectGuesses}"
            - Letters to Reveal: ${data.lettersToReveal}

            Produce the JSON response now.
        `,
        output: {
            schema: z.object({
                hint: z.string(),
            }),
        },
        config: {
            responseMIMEType: 'application/json',
        }
    });
    
    const hintOutput = hintResponse.output;

    if (hintOutput?.hint) {
      return { success: true, hint: hintOutput.hint };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    // Return a user-friendly error message to the client.
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
