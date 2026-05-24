import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/auth';
import { UserProfile, UserRole } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const emailLower = (data && data.email) ? data.email.toLowerCase() : '';
      if (data && (emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com')) {
        data.role = 'President_Director';
      }
      try {
        localStorage.setItem(`vam_profile_${uid}`, JSON.stringify(data));
      } catch (e) {}
      return data;
    }
  } catch (error) {
    console.warn('Silent Firestore Read Warning (offline fallback engaged):', error);
  }

  // Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(`vam_profile_${uid}`);
    if (cached) {
      const data = JSON.parse(cached) as UserProfile;
      const emailLower = (data && data.email) ? data.email.toLowerCase() : '';
      if (data && (emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com')) {
        data.role = 'President_Director';
      }
      return data;
    }
  } catch (err) {
    console.error('Failed to parse cached profile:', err);
  }
  return null;
};

export const ensureUserProfile = async (uid: string, email: string, displayName: string): Promise<UserProfile> => {
  let existing: UserProfile | null = null;
  try {
    existing = await getUserProfile(uid);
  } catch (err) {
    console.warn('Silent Firestore error checking profile, continuing via cache/creation:', err);
  }

  const emailLower = (email || '').toLowerCase();
  const isAdminEmail = emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com';

  if (existing) {
    if (isAdminEmail) {
      existing.role = 'President_Director';
      try {
        await updateUserRole(uid, 'President_Director');
      } catch (err) {
        console.warn('Silent validation warning: local profile upgraded to President_Director without firebase write sync:', err);
      }
    }
    try {
      localStorage.setItem(`vam_profile_${uid}`, JSON.stringify(existing));
    } catch (e) {}
    return existing;
  }

  const newUser: any = {
    uid,
    email,
    displayName: displayName || 'Anonymous User',
    role: isAdminEmail ? 'President_Director' : 'Public', // Default role
    updatedAt: new Date().toISOString()
  };

  // Bootstrap President_Director if it's the specific admin email
  console.log('ensureUserProfile isAdminEmail:', isAdminEmail, 'email:', email);

  try {
    await setDoc(doc(db, 'users', uid), newUser);
  } catch (err) {
    console.warn('Silent validation warning: could not write initial profile structure, fallback to in-memory template:', err);
  }

  try {
    localStorage.setItem(`vam_profile_${uid}`, JSON.stringify(newUser));
  } catch (e) {}

  console.log('ensureUserProfile final newUser:', newUser);
  return newUser as UserProfile;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Silent validation warning: could not update firebase user role, falling back locally', error);
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.warn('Could not list users from Firestore, returning empty list:', error);
    return [];
  }
};
