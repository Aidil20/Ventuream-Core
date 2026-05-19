import React, { useEffect, useState } from 'react';
import { Users, Shield, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllUsers, updateUserRole } from '../services/userService';
import { UserProfile, UserRole } from '../types';
import { motion } from 'motion/react';

const ROLES: UserRole[] = ['Public', 'Analyst', 'Trader', 'Manager', 'President_Director'];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setIsUpdating(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] overflow-hidden">
      <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Users className="w-6 h-6 text-[#DFFF00]" />
            Organization Governance
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Institutional Access Control List (ACL)</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-[#DFFF00]/30 transition-all text-zinc-400 hover:text-[#DFFF00]"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <th className="px-8 py-6">Identity</th>
              <th className="px-8 py-6">Account Email</th>
              <th className="px-8 py-6">Current Designation</th>
              <th className="px-8 py-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {users.map((user) => (
              <motion.tr 
                key={user.uid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#DFFF00] font-black">
                      {user.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{user.displayName}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">UID: {user.uid.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[11px] font-bold text-zinc-400">{user.email}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user.role === 'President_Director' ? 'bg-[#DFFF00]' :
                      user.role === 'Manager' ? 'bg-purple-500' :
                      user.role === 'Trader' ? 'bg-emerald-500' :
                      user.role === 'Analyst' ? 'bg-blue-500' : 'bg-zinc-500'
                    }`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'President_Director' ? 'text-[#DFFF00]' : 'text-zinc-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                      disabled={isUpdating === user.uid}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-white outline-none hover:border-zinc-700 transition-all focus:border-[#DFFF00]/50"
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {isUpdating === user.uid && <RefreshCw className="w-3 h-3 text-zinc-500 animate-spin" />}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !isLoading && (
        <div className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">No institutional records found</p>
        </div>
      )}
    </div>
  );
};
