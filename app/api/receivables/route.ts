import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminReceivableModel } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';

// Helper to verify admin permissions
async function verifyAdminAccess(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return { authorized: false, error: 'Unauthorized: Please log in', status: 401 };
  }
  if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN') {
    return {
      authorized: false,
      error: 'Forbidden: Only Super Admin and Admin can access this ledger',
      status: 403,
    };
  }
  return { authorized: true, user: auth };
}

// GET: Fetch all receivables for the mess
export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const messId = (searchParams.get('messId') || authCheck.user!.messId || '9D').toUpperCase();

    const receivables = await AdminReceivableModel.find({ messId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      receivables: receivables || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/receivables:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Create or Update receivable or Record payment
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const body = await req.json();
    const { action = 'CREATE', messId = authCheck.user!.messId || '9D' } = body;
    const normalizedMessId = messId.toUpperCase();

    if (action === 'CREATE') {
      const {
        type = 'RECEIVABLE',
        debtorName,
        debtorPhone = '',
        debtorRoom = '',
        memberId,
        title,
        category = 'PERSONAL_LOAN',
        totalAmount = 0,
        paidAmount = 0,
        issueDate,
        dueDate = '',
        notes = '',
      } = body;

      if (!debtorName?.trim()) {
        return NextResponse.json(
          { error: type === 'PAYABLE' ? 'কে টাকা পাবে (ব্যক্তির নাম) দিতে হবে' : 'কার কাছে টাকা পাবেন (ব্যক্তির নাম) দিতে হবে' },
          { status: 400 }
        );
      }
      if (!title?.trim()) {
        return NextResponse.json({ error: 'কিসের টাকা (বিবরণ / কারণ) দিতে হবে' }, { status: 400 });
      }

      const numTotal = Number(totalAmount) || 0;
      const numPaid = Number(paidAmount) || 0;
      const remainingAmount = Math.max(0, numTotal - numPaid);
      const status = remainingAmount <= 0 ? 'PAID' : numPaid > 0 ? 'PARTIAL' : 'PENDING';

      const installments = [];
      if (numPaid > 0) {
        installments.push({
          amount: numPaid,
          date: issueDate || new Date().toISOString().split('T')[0],
          notes: type === 'PAYABLE' ? 'প্রাথমিক পরিশোধ (Initial payment to creditor)' : 'প্রাথমিক আদায় (Initial receipt)',
          receivedBy: authCheck.user!.name,
          createdAt: new Date(),
        });
      }

      const created = await AdminReceivableModel.create({
        messId: normalizedMessId,
        type: type === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE',
        debtorName: debtorName.trim(),
        debtorPhone: debtorPhone.trim(),
        debtorRoom: debtorRoom.trim(),
        memberId: memberId ? Number(memberId) : undefined,
        title: title.trim(),
        category,
        totalAmount: numTotal,
        paidAmount: numPaid,
        remainingAmount,
        status,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate.trim(),
        notes: notes.trim(),
        installments,
        createdBy: authCheck.user!.username,
      });

      return NextResponse.json({ success: true, item: created });
    }

    if (action === 'PAYMENT') {
      const { id, amount, date, notes = '' } = body;
      if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
      }
      const payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) {
        return NextResponse.json({ error: 'সঠিক পরিশোধের পরিমাণ (Positive amount) দিন' }, { status: 400 });
      }

      const record = await AdminReceivableModel.findOne({
        _id: id,
        messId: normalizedMessId,
      });

      if (!record) {
        return NextResponse.json({ error: 'রেকর্ডটি পাওয়া যায়নি' }, { status: 404 });
      }

      const newPaidTotal = (record.paidAmount || 0) + payAmount;
      const newRemaining = Math.max(0, (record.totalAmount || 0) - newPaidTotal);
      const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

      record.installments.push({
        amount: payAmount,
        date: date || new Date().toISOString().split('T')[0],
        notes: notes.trim() || 'আংশিক/সম্পূর্ণ পরিশোধ',
        receivedBy: authCheck.user!.name,
        createdAt: new Date(),
      });

      record.paidAmount = newPaidTotal;
      record.remainingAmount = newRemaining;
      record.status = newStatus;
      await record.save();

      return NextResponse.json({ success: true, item: record });
    }

    if (action === 'UPDATE') {
      const {
        id,
        type,
        debtorName,
        debtorPhone,
        debtorRoom,
        memberId,
        title,
        category,
        totalAmount,
        dueDate,
        issueDate,
        notes,
      } = body;

      if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
      }

      const record = await AdminReceivableModel.findOne({
        _id: id,
        messId: normalizedMessId,
      });

      if (!record) {
        return NextResponse.json({ error: 'রেকর্ডটি পাওয়া যায়নি' }, { status: 404 });
      }

      if (type !== undefined && (type === 'RECEIVABLE' || type === 'PAYABLE')) {
        record.type = type;
      }
      if (debtorName !== undefined) record.debtorName = debtorName.trim();
      if (debtorPhone !== undefined) record.debtorPhone = debtorPhone.trim();
      if (debtorRoom !== undefined) record.debtorRoom = debtorRoom.trim();
      if (memberId !== undefined) record.memberId = memberId ? Number(memberId) : undefined;
      if (title !== undefined) record.title = title.trim();
      if (category !== undefined) record.category = category;
      if (dueDate !== undefined) record.dueDate = dueDate.trim();
      if (issueDate !== undefined) record.issueDate = issueDate.trim();
      if (notes !== undefined) record.notes = notes.trim();

      if (totalAmount !== undefined) {
        record.totalAmount = Number(totalAmount) || 0;
        record.remainingAmount = Math.max(0, record.totalAmount - (record.paidAmount || 0));
        record.status =
          record.remainingAmount <= 0
            ? 'PAID'
            : record.paidAmount > 0
            ? 'PARTIAL'
            : 'PENDING';
      }

      await record.save();
      return NextResponse.json({ success: true, item: record });
    }

    if (action === 'DELETE') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
      }
      await AdminReceivableModel.findOneAndDelete({ _id: id, messId: normalizedMessId });
      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/receivables:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a receivable entry
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const messId = (searchParams.get('messId') || authCheck.user!.messId || '9D').toUpperCase();

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    await AdminReceivableModel.findOneAndDelete({ _id: id, messId });
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/receivables:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

