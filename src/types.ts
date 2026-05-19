
export type UserRole = 'Public' | 'Analyst' | 'Trader' | 'Manager' | 'President_Director';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  updatedAt: number;
}
