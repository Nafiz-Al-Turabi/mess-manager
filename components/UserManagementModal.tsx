'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Key,
  X,
  CheckCircle,
  RefreshCw,
  UserX,
} from 'lucide-react';
import {
  fetchUsersList,
  createNewUser,
  updateUserRoleOrStatus,
  deleteUserAccount,
  AppUser,
} from '@/lib/mongo-client';
import { Member } from '@/lib/types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  members: Member[];
  lang: 'bn' | 'en';
}

export function UserManagementModal({
  isOpen,
  onClose,
  currentUser,
  members,
  lang,
}: UserManagementModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newRole, setNewRole] = useState<'MEMBER' | 'ADMIN' | 'SUPER_ADMIN'>('MEMBER');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Password reset state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [changePassword, setChangePassword] = useState('');

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsersList();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      setError(lang === 'bn' ? 'ইউজারনেম, পাসওয়ার্ড এবং নাম আবশ্যক' : 'Username, password and name are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createNewUser({
        username: newUsername,
        password: newPassword,
        name: newName,
        phone: newPhone,
        roomNumber: newRoom,
        role: newRole,
        memberId: selectedMemberId ? Number(selectedMemberId) : undefined,
      });

      setSuccess(
        lang === 'bn'
          ? `ইউজার "${newUsername}" সফলভাবে তৈরি হয়েছে!`
          : `User "${newUsername}" created successfully!`
      );
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewPhone('');
      setNewRoom('');
      setSelectedMemberId('');
      setShowAddForm(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    if (!isSuperAdmin) return;
    const targetRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      setLoading(true);
      await updateUserRoleOrStatus({ userId, role: targetRole });
      await loadUsers();
      setSuccess(lang === 'bn' ? 'ইউজার রোল আপডেট হয়েছে' : 'Role updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    try {
      setLoading(true);
      await updateUserRoleOrStatus({ userId, isActive: !currentActive });
      await loadUsers();
      setSuccess(lang === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস পরিবর্তিত হয়েছে' : 'Account status changed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!isSuperAdmin) return;
    const conf = window.confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${username}" ইউজারটি ডিলিট করতে চান?`
        : `Are you sure you want to delete user "${username}"?`
    );
    if (!conf) return;

    try {
      setLoading(true);
      await deleteUserAccount(userId);
      await loadUsers();
      setSuccess(lang === 'bn' ? 'ইউজার মুছে ফেলা হয়েছে' : 'User deleted successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (userId: string) => {
    if (!changePassword || changePassword.length < 4) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' : 'Password must be at least 4 chars');
      return;
    }
    try {
      setLoading(true);
      await updateUserRoleOrStatus({ userId, password: changePassword });
      setEditingUserId(null);
      setChangePassword('');
      setSuccess(lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করা হয়েছে' : 'Password changed successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === 'bn' ? 'ইউজার ও রোল ম্যানেজমেন্ট' : 'User & Role Management'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'সুপার এডমিন প্যানেল: মেম্বারদের ইউজার অ্যাকাউন্ট তৈরি ও নিয়ন্ত্রণ করুন'
                  : 'Super Admin Control: Create & manage user credentials and permissions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-emerald-900/30"
          >
            <UserPlus className="w-4 h-4" />
            {showAddForm
              ? (lang === 'bn' ? 'ফর্ম বন্ধ করুন' : 'Close Form')
              : (lang === 'bn' ? 'নতুন ইউজার তৈরি করুন' : 'Create New User')}
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateUser}
            className="mt-4 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3"
          >
            <h3 className="text-sm font-semibold text-emerald-400">
              {lang === 'bn' ? 'নতুন ইউজার ক্রেডেনশিয়াল দিন' : 'Enter New User Credentials'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'ইউজারনেম (Login ID)' : 'Username (Login ID)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahim, mess_01"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pass1234"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'ইউজারের পুরো নাম' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdur Rahim"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'মেস মেম্বারের সাথে লিংক করুন (ঐচ্ছিক)' : 'Link to Mess Member (Optional)'}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    const selected = members.find((m) => m.id === Number(e.target.value));
                    if (selected && !newName) setNewName(selected.name);
                    if (selected && !newPhone) setNewPhone(selected.phone);
                    if (selected && !newRoom) setNewRoom(selected.roomNumber);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{lang === 'bn' ? '-- মেম্বার সিলেক্ট করুন --' : '-- Select Member --'}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      #{m.id} - {m.name} ({m.roomNumber || 'Room ?'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                </label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'bn' ? 'রোল / পারমিশন' : 'Role / Permission'}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MEMBER">{lang === 'bn' ? 'মেম্বার (General Member)' : 'General Member'}</option>
                  {isSuperAdmin && (
                    <option value="ADMIN">{lang === 'bn' ? 'এডমিন (Admin / Manager)' : 'Admin / Manager'}</option>
                  )}
                  {isSuperAdmin && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition"
              >
                {loading ? 'Creating...' : (lang === 'bn' ? 'তৈরি সম্পন্ন করুন' : 'Confirm Create')}
              </button>
            </div>
          </form>
        )}

        {/* User Table List */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 uppercase text-[11px] text-slate-400">
              <tr>
                <th className="px-3 py-3 rounded-l-lg">{lang === 'bn' ? 'ইউজার' : 'User'}</th>
                <th className="px-3 py-3">{lang === 'bn' ? 'রোল' : 'Role'}</th>
                <th className="px-3 py-3">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-3 py-3 text-right rounded-r-lg">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u._id;
                const isSuper = u.role === 'SUPER_ADMIN';
                const isAdmin = u.role === 'ADMIN';

                return (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-emerald-400">
                            {lang === 'bn' ? 'আপনি' : 'You'}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        @{u.username} {u.phone ? `• ${u.phone}` : ''}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        {isSuper ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : isAdmin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Member
                          </span>
                        )}

                        {isSuperAdmin && !isSuper && (
                          <button
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            title={lang === 'bn' ? 'রোল পরিবর্তন করুন' : 'Toggle Admin Role'}
                            className="text-[10px] text-emerald-400 hover:underline ml-1"
                          >
                            [{isAdmin ? 'Make Member' : 'Make Admin'}]
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {u.isActive ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'স্থগিত' : 'Disabled')}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Change Password */}
                        <button
                          onClick={() => {
                            setEditingUserId(editingUserId === u._id ? null : u._id);
                            setChangePassword('');
                          }}
                          title={lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Deactivate / Activate */}
                        {!isSuper && (
                          <button
                            onClick={() => handleStatusToggle(u._id, u.isActive)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition ${
                              u.isActive
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                                : 'text-emerald-400 hover:bg-slate-800'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete User */}
                        {isSuperAdmin && !isSuper && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            title={lang === 'bn' ? 'ইউজার মুছে ফেলুন' : 'Delete User'}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Reset password inline form */}
                      {editingUserId === u._id && (
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          <input
                            type="text"
                            placeholder="New password"
                            value={changePassword}
                            onChange={(e) => setChangePassword(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-xs px-2 py-1 rounded text-white w-28"
                          />
                          <button
                            onClick={() => handlePasswordUpdate(u._id)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px]"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

