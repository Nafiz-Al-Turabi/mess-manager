import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { comparePassword, signToken, ensureDefaultSuperAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultSuperAdmin();

    const body = await req.json();
    const { identifier, password } = body; // identifier can be username or email

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ username: cleanIdentifier }, { email: cleanIdentifier }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account is deactivated. Contact Super Admin.' }, { status: 403 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      messId: user.messId || '9D',
      name: user.name,
      memberId: user.memberId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        messId: user.messId,
        memberId: user.memberId,
      },
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

