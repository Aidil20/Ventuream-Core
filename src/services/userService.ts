import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/auth';
import { UserProfile, UserRole } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const ensureUserProfile = async (uid: string, email: string, displayName: string): Promise<UserProfile> => {
  const existing = await getUserProfile(uid);
  if (existing) return existing;

  const newUser: any = {
    uid,
    email,
    displayName: displayName || 'Anonymous User',
    role: 'Public', // Default role
    updatedAt: serverTimestamp()
  };

  // Bootstrap President_Director if it's the specific admin email
  if (email === 'aidilsyahdan2000@gmail.com') {
    newUser.role = 'President_Director';
  }

  await setDoc(doc(db, 'users', uid), newUser);
  return newUser as UserProfile;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp()
  });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};
