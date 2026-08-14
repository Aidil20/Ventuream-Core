import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/auth';
import { UserProfile, UserRole } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  // Check local cache first or if local institutional user / unauthenticated
  if (!uid || uid === 'user_institutional_gateway_01' || !auth.currentUser) {
    const cached = localStorage.getItem(`vam_profile_${uid || 'user_institutional_gateway_01'}`);
    if (cached) {
      try {
        const data = JSON.parse(cached) as UserProfile;
        const emailLower = (data && data.email) ? data.email.toLowerCase() : '';
        if (data && (emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com')) {
          data.role = 'President_Director';
        }
        return data;
      } catch (e) {}
    }
    // Return default institutional profile if it's the admin or default user
    return {
      uid: uid || 'user_institutional_gateway_01',
      email: 'aidilsyahdan2000@gmail.com',
      displayName: 'President Director (VAM Institutional)',
      role: 'President_Director',
      updatedAt: Date.now()
    };
  }

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
    console.warn('Failed to parse cached profile:', err);
  }
  return null;
};

export const ensureUserProfile = async (uid: string, email: string, displayName: string): Promise<UserProfile> => {
  const emailLower = (email || '').toLowerCase();
  const isAdminEmail = emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com';
  const defaultRole: UserRole = isAdminEmail ? 'President_Director' : 'Public';

  if (!uid || uid === 'user_institutional_gateway_01' || !auth.currentUser) {
    const cached = localStorage.getItem(`vam_profile_${uid || 'user_institutional_gateway_01'}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserProfile;
        if (isAdminEmail) parsed.role = 'President_Director';
        return parsed;
      } catch (e) {}
    }
    const localUser: UserProfile = {
      uid: uid || 'user_institutional_gateway_01',
      email: email || 'aidilsyahdan2000@gmail.com',
      displayName: displayName || 'President Director (VAM Institutional)',
      role: defaultRole,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(`vam_profile_${localUser.uid}`, JSON.stringify(localUser));
    } catch (e) {}
    return localUser;
  }

  let existing: UserProfile | null = null;
  try {
    existing = await getUserProfile(uid);
  } catch (err) {
    console.warn('Silent Firestore error checking profile, continuing via cache/creation:', err);
  }

  if (existing) {
    if (isAdminEmail && existing.role !== 'President_Director') {
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
    role: defaultRole,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'users', uid), newUser);
  } catch (err) {
    console.warn('Silent validation warning: could not write initial profile structure, fallback to in-memory template:', err);
  }

  const returnUser: UserProfile = {
    uid,
    email,
    displayName: displayName || 'Anonymous User',
    role: defaultRole,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(`vam_profile_${uid}`, JSON.stringify(returnUser));
  } catch (e) {}

  return returnUser;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  try {
    const cached = localStorage.getItem(`vam_profile_${uid}`);
    if (cached) {
      const data = JSON.parse(cached);
      data.role = role;
      data.updatedAt = Date.now();
      localStorage.setItem(`vam_profile_${uid}`, JSON.stringify(data));
    }
  } catch (e) {}

  if (!uid || uid === 'user_institutional_gateway_01' || !auth.currentUser) {
    return;
  }

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
  if (!auth.currentUser) {
    const cached = localStorage.getItem('vam_profile_user_institutional_gateway_01');
    if (cached) {
      try {
        return [JSON.parse(cached)];
      } catch (e) {}
    }
    return [{
      uid: 'user_institutional_gateway_01',
      email: 'aidilsyahdan2000@gmail.com',
      displayName: 'President Director (VAM Institutional)',
      role: 'President_Director',
      updatedAt: Date.now()
    }];
  }

  try {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.warn('Could not list users from Firestore, returning empty list:', error);
    return [];
  }
};
