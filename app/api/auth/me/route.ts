import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { getAuthUser, ensureDefaultSuperAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultSuperAdmin();

    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await UserModel.findById(auth.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        messId: user.messId,
        memberId: user.memberId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

