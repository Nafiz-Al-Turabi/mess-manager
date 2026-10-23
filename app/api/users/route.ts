import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { getAuthUser, hashPassword } from '@/lib/auth';

// GET: List all users (Only Super Admin and Admin)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await UserModel.find({ messId: auth.messId || '9D' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new user (Only Super Admin and Admin)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can create users' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, name, phone, roomNumber, role, memberId } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password and name are required' }, { status: 400 });
    }

    // Role check: Only Super Admin can create another Admin or Super Admin
    let assignedRole = role || 'MEMBER';
    if (auth.role !== 'SUPER_ADMIN' && (assignedRole === 'ADMIN' || assignedRole === 'SUPER_ADMIN')) {
      assignedRole = 'MEMBER';
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await UserModel.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await UserModel.create({
      username: cleanUsername,
      passwordHash,
      name: name.trim(),
      phone: phone || '',
      roomNumber: roomNumber || '',
      role: assignedRole,
      isActive: true,
      messId: auth.messId || '9D',
      memberId: memberId ? Number(memberId) : undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        memberId: newUser.memberId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update user role, status or password (Super Admin can do all, Admin can do limited)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, isActive, password, name, phone, roomNumber, memberId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protection: Normal Admin cannot modify a SUPER_ADMIN or promote someone to SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can modify Super Admin accounts' }, { status: 403 });
    }

    if (role && auth.role === 'SUPER_ADMIN') {
      targetUser.role = role;
    }

    if (typeof isActive === 'boolean') {
      // Don't allow deactivating self if super admin
      if (auth.userId === targetUser._id.toString() && !isActive) {
        return NextResponse.json({ error: 'You cannot deactivate your own Super Admin account' }, { status: 400 });
      }
      targetUser.isActive = isActive;
    }

    if (password && password.trim().length >= 4) {
      targetUser.passwordHash = await hashPassword(password);
    }

    if (name) targetUser.name = name.trim();
    if (phone !== undefined) targetUser.phone = phone;
    if (roomNumber !== undefined) targetUser.roomNumber = roomNumber;
    if (memberId !== undefined) targetUser.memberId = Number(memberId);

    await targetUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        name: targetUser.name,
        role: targetUser.role,
        isActive: targetUser.isActive,
        memberId: targetUser.memberId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a user (Only Super Admin)
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can delete users' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (auth.userId === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await UserModel.findByIdAndDelete(userId);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

