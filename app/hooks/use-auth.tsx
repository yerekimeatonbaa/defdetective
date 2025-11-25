
"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getRankForScore } from '@/lib/game-data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  updateUsername: (newName: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = useCallback(
    async (email: string, pass: string) => {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        router.push('/');
      } catch (error) {
        console.error('Login failed:', error);
        // Here you could use the toast to show an error to the user
      } finally {
        setLoading(false);
      }
    },
    [auth, router]
  );

  const signup = useCallback(
    async (email: string, pass: string, name: string) => {
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });
        
        const userRef = doc(firestore, 'userProfiles', newUser.uid);
        const userData = {
          id: newUser.uid,
          username: name,
          email: newUser.email,
          totalScore: 0,
          highestLevel: 1,
          rank: getRankForScore(0),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          hints: 5,
        };

        setDoc(userRef, userData)
            .catch(() => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'create',
              requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
            });
        
        router.push('/');
      } catch (error) {
        console.error('Signup failed:', error);
      } finally {
        setLoading(false);
      }
    },
    [auth, firestore, router]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);
  
  const updateUsername = useCallback(async (newName: string) => {
      if (!user) return;
      try {
        await updateProfile(user, { displayName: newName });
        const userRef = doc(firestore, 'userProfiles', user.uid);
        
        const updateData = { username: newName };
        
        updateDoc(userRef, updateData)
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });

        // This part is important to see the change reflected in the UI immediately
        setUser(auth.currentUser);

      } catch (error) {
        console.error("Error updating username:", error);
      }
  }, [user, auth, firestore]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const userRef = doc(firestore, 'userProfiles', user.uid);
        
        deleteDoc(userRef).catch(err => {
             const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
        });

        await deleteUser(user);
        
        router.push("/signup");

    } catch (error) {
        console.error("Error deleting account:", error);
        setLoading(false);
    }
  }, [user, firestore, auth, router]);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch(error) {
      console.error("Password reset failed:", error);
      // You could add a toast notification here to inform the user of the error
      throw error;
    }
  }, [auth]);

  const value = { user, loading, login, signup, logout, updateUsername, deleteAccount, sendPasswordReset };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
