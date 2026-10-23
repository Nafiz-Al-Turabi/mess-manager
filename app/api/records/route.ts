import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MessRecordModel, MessSettingModel } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch all mess data (realtime poll or fetch)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const messId = (searchParams.get('messId') || '9D').toUpperCase();

    const [records, settings, users] = await Promise.all([
      MessRecordModel.find({ messId }).sort({ createdAt: 1 }).lean(),
      MessSettingModel.findOne({ messId }).lean(),
      (await import('@/lib/models')).UserModel.find({ messId, isActive: true }).sort({ createdAt: 1 }).lean(),
    ]);

    // Check existing MEMBER records
    const memberRecordIds = new Set(
      (records || [])
        .filter((r: any) => r.recordType === 'MEMBER')
        .map((r: any) => String(r.entityLocalId || r.targetMemberId))
    );

    const memberUsernames = new Set(
      (records || [])
        .filter((r: any) => r.recordType === 'MEMBER')
        .map((r: any) => r.linkedUid?.toLowerCase())
    );

    // Auto-generate virtual MEMBER records for registered users who don't have one yet
    const autoMemberRecords: any[] = [];
    let nextLocalId = 1;

    // Find highest local id currently in records
    (records || []).forEach((r: any) => {
      if (r.entityLocalId && r.entityLocalId >= nextLocalId) {
        nextLocalId = r.entityLocalId + 1;
      }
    });

    for (const u of users) {
      const uName = u.username.toLowerCase();
      if (!memberUsernames.has(uName) && (!u.memberId || !memberRecordIds.has(String(u.memberId)))) {
        const assignedId = u.memberId || nextLocalId++;
        const recordId = `MEMBER_${assignedId}`;
        autoMemberRecords.push({
          recordId,
          messId,
          recordType: 'MEMBER',
          monthKey: 'ALL',
          title: u.name,
          subtitle: `${u.phone || ''}|${u.roomNumber || ''}|${u.email || ''}|2026-10-01`,
          role: u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'Manager' : 'Member',
          linkedUid: u.username,
          entityLocalId: assignedId,
          targetMemberId: assignedId,
          amount: 0,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          guestMeal: 0,
          active: u.isActive,
          createdBy: 'system',
        });
      }
    }

    const allRecords = [...(records || []), ...autoMemberRecords];

    return NextResponse.json({
      success: true,
      records: allRecords,
      settings: settings || { messId, messName: 'My Mess', managerPin: '16247', lockedDates: [] },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Batch save / Upsert records
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthUser(req);
    const body = await req.json();
    const { messId = '9D', records, settings } = body;

    const normalizedMessId = (messId || '9D').toUpperCase();

    if (settings) {
      await MessSettingModel.findOneAndUpdate(
        { messId: normalizedMessId },
        {
          $set: {
            messName: settings.messName || 'My Mess',
            managerPin: settings.managerPin || '16247',
            lockedDates: settings.lockedDates || [],
          },
        },
        { upsert: true, new: true }
      );
    }

    if (Array.isArray(records) && records.length > 0) {
      const ops = records.map((rec: any) => ({
        updateOne: {
          filter: { recordId: rec.recordId },
          update: {
            $set: {
              ...rec,
              messId: normalizedMessId,
              createdBy: rec.createdBy || (auth ? auth.username : 'system'),
            },
          },
          upsert: true,
        },
      }));

      await MessRecordModel.bulkWrite(ops);
    }

    return NextResponse.json({ success: true, count: records ? records.length : 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a specific record
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
    }

    await MessRecordModel.findOneAndDelete({ recordId });

    return NextResponse.json({ success: true, message: 'Record deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

