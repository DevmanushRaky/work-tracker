import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { verifyJwt } from "@/lib/jwt";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getSundays(year: number, month: number) {
  // month: 1-based (1=Jan)
  let sundays = 0;
  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === 0) sundays++;
  }
  return sundays;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get userId from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;

    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const monthParam = url?.searchParams.get('month');
    const isSaved = url?.pathname.endsWith('/saved');

    if (!monthParam) {
      return NextResponse.json({ success: false, message: 'Month is required (YYYY-MM)' }, { status: 400 });
    }

    const [yearStr, monthStr] = monthParam.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (!year || !month) {
      return NextResponse.json({ success: false, message: 'Invalid month format' }, { status: 400 });
    }

    if (isSaved) {
      // GET /api/monthly/saved?month=YYYY-MM
      const collection = mongoose.connection.collection('monthly_reports');
      const record = await collection.findOne({ 
        month: monthParam,
        userId: new mongoose.Types.ObjectId(userId)
      });
      return NextResponse.json({ success: true, record });
    } else {
      // GET /api/monthly?month=YYYY-MM (live calculation)
      const collection = mongoose.connection.collection('dailylogs');
      const records = await collection.find({ 
        userId: new mongoose.Types.ObjectId(userId),
        date: { $regex: `^${monthParam}` } 
      }).sort({ date: 1 }).toArray();

      const totalDays = getDaysInMonth(year, month);
      const leaves = records.filter(r => r.attendance === 'Leave').length;
      const holiday = records.filter(r => r.attendance === 'Holiday').length;
      const weekend = getSundays(year, month);
      const absent = records.filter(r => r.attendance === 'Absent').length;
      const present = records.filter(r => r.attendance === 'Present' || r.attendance === 'Work from Home').length;
      const workingDays = totalDays - (leaves + holiday + weekend);
      const workingHour = records.reduce((sum, r) => sum + (parseFloat(r.workingHour) || 0), 0);
      const targetHour = workingDays * 9;
      const perDayWorking = workingDays > 0 ? (workingHour / workingDays).toFixed(2) : 0;

      // Fetch user info
      const User = mongoose.connection.collection('users');
      const userDoc = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      const leaveAllowedPerMonth = userDoc?.leaveAllowedPerMonth ?? 0;
      let earnedLeave = userDoc?.earnedLeave ?? 0;
      let balanceLeave = 0;

      if (leaves === 0) {
        // No leave taken, carry forward
        earnedLeave += leaveAllowedPerMonth;
        balanceLeave = earnedLeave;
      } else {
        // Leave taken, subtract from earned first, then allowed
        const totalAvailable = earnedLeave + leaveAllowedPerMonth;
        if (leaves >= totalAvailable) {
          earnedLeave = 0;
          balanceLeave = 0;
        } else if (leaves <= earnedLeave) {
          earnedLeave -= leaves;
          balanceLeave = earnedLeave + leaveAllowedPerMonth;
        } else {
          // Use up earned, then allowed
          const usedFromAllowed = leaves - earnedLeave;
          earnedLeave = 0;
          balanceLeave = leaveAllowedPerMonth - usedFromAllowed;
        }
      }
      // Optionally update userDoc.earnedLeave in DB (uncomment to persist)
      // await User.updateOne({ _id: userDoc._id }, { $set: { earnedLeave } });

      return NextResponse.json({
        success: true,
        summary: {
          month: monthParam,
          totalDays,
          leaves,
          holiday,
          weekend,
          absent,
          present,
          workingDays,
          workingHour,
          targetHour,
          perDayWorking,
          leaveAllowedPerMonth,
          earnedLeave,
          balanceLeave,
        },
        records,
      });
    }
  } catch (error: unknown) {
    let message = 'Failed to fetch monthly report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get userId from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;

    const body = await req.json();
    if (!body.month) {
      return NextResponse.json({ success: false, message: 'Month is required' }, { status: 400 });
    }

    const collection = mongoose.connection.collection('monthly_reports');
    // Upsert by month and userId
    await collection.updateOne(
      { month: body.month, userId: new mongoose.Types.ObjectId(userId) },
      { $set: { ...body, userId: new mongoose.Types.ObjectId(userId) } },
      { upsert: true }
    );
    return NextResponse.json({ success: true, message: 'Monthly summary saved.' });
  } catch (error: unknown) {
    let message = 'Failed to save monthly summary.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
} 