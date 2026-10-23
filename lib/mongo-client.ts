import {
  CloudMessRecordPayload,
  JoinRequestItem,
  MessDirectoryDoc,
} from './types';

export interface AppUser {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';
  messId: string;
  memberId?: number;
}

// 1. Auth API calls
export async function fetchCurrentUser(): Promise<AppUser | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    if (data.authenticated && data.user) {
      return data.user;
    }
    return null;
  } catch (e) {
    console.error('Error fetching current user:', e);
    return null;
  }
}

export async function loginUser(identifier: string, password: string): Promise<AppUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data.user;
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

// 2. User Management APIs (Super Admin / Admin)
export async function fetchUsersList(): Promise<any[]> {
  const res = await fetch('/api/users', { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data.users || [];
}

export async function createNewUser(payload: {
  username: string;
  password: string;
  name: string;
  phone?: string;
  roomNumber?: string;
  role?: string;
  memberId?: number;
}): Promise<any> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user');
  return data.user;
}

export async function updateUserRoleOrStatus(payload: {
  userId: string;
  role?: string;
  isActive?: boolean;
  password?: string;
  name?: string;
  phone?: string;
  roomNumber?: string;
  memberId?: number;
}): Promise<any> {
  const res = await fetch('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user');
  return data.user;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const res = await fetch(`/api/users?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete user');
}

// 3. Realtime Data Sync with MongoDB
export async function fetchMessDataFromMongo(messId: string = '9D'): Promise<{
  records: CloudMessRecordPayload[];
  settings: MessDirectoryDoc;
}> {
  const res = await fetch(`/api/records?messId=${encodeURIComponent(messId)}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch mess data');

  return {
    records: data.records || [],
    settings: data.settings || {
      messId,
      messName: 'My Mess',
      managerPin: '16247',
      managerUids: [],
      memberUids: [],
      lockedDates: [],
    },
  };
}

export async function upsertMongoMessRecord(record: CloudMessRecordPayload): Promise<void> {
  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messId: record.messId,
        records: [record],
      }),
    });
  } catch (err) {
    console.error('Failed to sync record to MongoDB:', err);
  }
}

export async function deleteMongoMessRecord(recordId: string): Promise<void> {
  try {
    await fetch(`/api/records?recordId=${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete record from MongoDB:', err);
  }
}

export async function upsertMongoSettings(settings: Partial<MessDirectoryDoc>): Promise<void> {
  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messId: settings.messId || '9D',
        settings,
      }),
    });
  } catch (err) {
    console.error('Failed to update mess settings in MongoDB:', err);
  }
}

