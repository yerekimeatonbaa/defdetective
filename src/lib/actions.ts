
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check if FIREBASE_CONFIG is available and parse it.
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  
  // Use the parsed config to initialize the app.
  // This is the standard way to initialize in App Hosting.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export async function useHintAction(data: { 
  userId?: string;
  word: string;
  incorrectGuesses: string;
  lettersToReveal: number;
  isFree?: boolean;
}): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    const ai = genkit({
      plugins: [
        googleAI({
          apiVersion: 'v1',
        }),
      ],
    });

    if (!data.isFree) {
        if (!data.userId) {
            throw new Error("User ID is required for a paid hint.");
        }
        initAdminApp();
        const firestore = getFirestore();
        const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

        const transactionResult = await firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userProfileRef);

        if (!userDoc.exists) {
            throw new Error('User profile not found.');
        }

        const currentHints = userDoc.data()?.hints ?? 0;

        if (currentHints <= 0) {
            return { success: false, message: "You don't have any hints left." };
        }

        transaction.update(userProfileRef, { hints: currentHints - 1 });
        
        return { success: true };
        });

        if (!transactionResult.success) {
            return { success: false, message: transactionResult.message };
        }
    }

    const hintSchema = z.object({
        hint: z.string(),
    });

    const hintResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        prompt: `
            You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
            The user gives you a secret word, a string of letters they have already guessed incorrectly, and a number of letters to reveal.

            Rules:
            1.  Your response MUST be a JSON object that adheres to this schema: { "hint": "string" }.
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
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });
    
    const hintOutput = hintResponse.output;

    if (hintOutput) {
        const parsed = hintSchema.safeParse(hintOutput);
        if (parsed.success) {
            return { success: true, hint: parsed.data.hint };
        }
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!!!!     HINT ACTION ERROR      !!!!!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Error in useHintAction:', JSON.stringify(error, null, 2));
    console.error('Full Error Object:', error);
    // Return a user-friendly error message to the client.
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
