
'use server';

import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  // The FIREBASE_CONFIG env var is set automatically by App Hosting.
  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
  
  return initializeApp({
      projectId: firebaseConfig.projectId,
  });
}

export async function useHintAction(data: { userId: string }): Promise<{ success: boolean; message?: string; }> {
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(data.userId);
    
    const result = await firestore.runTransaction(async (transaction) => {
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
      
      return { success: true, message: 'Hint used successfully.' };
    });

    return result;

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while using a hint.' };
  }
}
