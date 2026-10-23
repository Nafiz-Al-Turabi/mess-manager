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

    const [records, settings] = await Promise.all([
      MessRecordModel.find({ messId }).sort({ createdAt: 1 }).lean(),
      MessSettingModel.findOne({ messId }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      records: records || [],
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

