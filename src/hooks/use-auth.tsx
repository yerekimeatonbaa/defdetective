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
  getAuth,
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
        // Handle error, e.g., show a toast message
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
        
        // Create user profile in Firestore
        const userRef = doc(firestore, 'userProfiles', newUser.uid);
        const userData = {
          id: newUser.uid,
          username: name,
          email: newUser.email,
          totalScore: 0,
          highestLevel: 1,
          rank: getRankForScore(0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setDoc(userRef, userData)
          .catch((serverError) => {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
