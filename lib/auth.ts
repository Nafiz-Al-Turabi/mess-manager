import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from './mongodb';
import { UserModel, IUser, UserRole } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-mess-manager-secure-token';

export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  messId: string;
  name: string;
  memberId?: number;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  // Check cookie or Authorization header
  const authHeader = req.headers.get('authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = req.cookies.get('auth_token')?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Ensures default super admin exists in DB.
 * Email / Username: nafizalturabi@gmail.com / nafizalturabi
 * Default password: 12345678 (can be changed)
 */
export async function ensureDefaultSuperAdmin() {
  await connectToDatabase();
  const existingSuperAdmin = await UserModel.findOne({
    $or: [{ email: 'nafizalturabi@gmail.com' }, { username: 'nafizalturabi' }],
  });
  if (!existingSuperAdmin) {
    const passwordHash = await hashPassword('12345678');
    await UserModel.create({
      username: 'nafizalturabi',
      email: 'nafizalturabi@gmail.com',
      name: 'Nafiz Al Turabi',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      messId: '9D',
    });
    console.log('Default super admin created: nafizalturabi@gmail.com / 12345678');
  }
}

