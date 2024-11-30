import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  async function signup(email: string, password: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    
    const displayName = email.split('@')[0];
    await updateFirebaseProfile(user, { displayName });
    
    // Try to get Google profile picture if it's a Gmail account
    let photoURL = null;
    if (email.toLowerCase().endsWith('@gmail.com')) {
      try {
        const response = await fetch(`https://picasaweb.google.com/data/entry/api/user/${email}?alt=json`);
        if (response.ok) {
          const data = await response.json();
          photoURL = data.entry.gphoto$thumbnail.$t;
        }
      } catch (error) {
        console.log('Could not fetch Gmail profile picture');
      }
    }
    
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName,
      photoURL,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      online: true
    });
  }

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before signing in.');
      }

      // Update or create user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastSeen: new Date().toISOString(),
          online: true,
          photoURL: user.photoURL,
          displayName: user.displayName
        });
      } else {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          online: true
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async function signin(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('Please verify your email before signing in.');
    }

    await updateDoc(doc(db, 'users', user.uid), {
      lastSeen: new Date().toISOString(),
      online: true
    });
  }

  async function signout() {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastSeen: new Date().toISOString(),
        online: false
      });
    }
    return signOut(auth);
  }

  async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
    if (!currentUser) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile
      await updateFirebaseProfile(currentUser, data);

      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      // Force refresh the user object
      await currentUser.reload();
      
      // Update local state with the new user data
      const updatedUser = auth.currentUser;
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            await updateDoc(doc(db, 'users', user.uid), {
              online: true,
              lastSeen: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      if (currentUser) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          online: false,
          lastSeen: new Date().toISOString()
        }).catch(console.error);
      }
      unsubscribe();
    };
  }, [currentUser]);

  const value = {
    currentUser,
    signup,
    signin,
    signout,
    resetPassword,
    loading,
    updateUserProfile,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}