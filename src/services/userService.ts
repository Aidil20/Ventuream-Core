import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/auth';
import { UserProfile, UserRole } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as UserProfile;
    if (data && (data.email === 'aidilsyahdan2000@gmail.com' || data.email === 'pt.ventuream@gmail.com')) {
      data.role = 'President_Director';
    }
    return data;
  }
  return null;
};

export const ensureUserProfile = async (uid: string, email: string, displayName: string): Promise<UserProfile> => {
  const existing = await getUserProfile(uid);
  const isAdminEmail = email === 'aidilsyahdan2000@gmail.com' || email === 'pt.ventuream@gmail.com';

  if (existing) {
    if (isAdminEmail) {
      existing.role = 'President_Director';
      try {
        await updateUserRole(uid, 'President_Director');
      } catch (err) {
        console.warn('Silent validation warning: local profile upgraded to President_Director without firebase write sync:', err);
      }
    }
    return existing;
  }

  const newUser: any = {
    uid,
    email,
    displayName: displayName || 'Anonymous User',
    role: 'Public', // Default role
    updatedAt: serverTimestamp()
  };

  // Bootstrap President_Director if it's the specific admin email
  console.log('ensureUserProfile isAdminEmail:', isAdminEmail, 'email:', email);
  if (isAdminEmail) {
    newUser.role = 'President_Director';
  }

  try {
    await setDoc(doc(db, 'users', uid), newUser);
  } catch (err) {
    console.warn('Silent validation warning: could not write initial profile structure, fallback to in-memory template:', err);
  }
  console.log('ensureUserProfile final newUser:', newUser);

  if (isAdminEmail) {
    newUser.role = 'President_Director';
  }
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
