import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

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
    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const monthParam = url?.searchParams.get('month');
    const isSaved = url?.pathname.endsWith('/saved');
    if (isSaved) {
      // GET /api/monthly/saved?month=YYYY-MM
      const collection = mongoose.connection.collection('monthly_reports');
      const query = monthParam ? { month: monthParam } : {};
      const records = await collection.find(query).sort({ month: -1 }).toArray();
      return NextResponse.json({ success: true, records });
    } else {
      // GET /api/monthly?month=YYYY-MM (live calculation)
      if (!monthParam) {
        return NextResponse.json({ success: false, message: 'Month is required (YYYY-MM)' }, { status: 400 });
      }
      const [yearStr, monthStr] = monthParam.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (!year || !month) {
        return NextResponse.json({ success: false, message: 'Invalid month format' }, { status: 400 });
      }
      const collection = mongoose.connection.collection('daily_reports');
      const query = { date: { $regex: `^${monthParam}` } };
      const records = await collection.find(query).toArray();
      const totalDays = getDaysInMonth(year, month);
      const leaves = records.filter(r => r.attendance === 'Leave').length;
      const holiday = records.filter(r => r.attendance === 'Holiday').length;
      const weekend = getSundays(year, month);
      const workingDays = totalDays - (leaves + holiday + weekend);
      const workingHour = records.reduce((sum, r) => sum + (parseFloat(r.workingHour) || 0), 0);
      const targetHour = workingDays * 9;
      const perDayWorking = workingDays > 0 ? (workingHour / workingDays).toFixed(2) : 0;
      return NextResponse.json({
        success: true,
        summary: {
          month: monthParam,
          totalDays,
          leaves,
          holiday,
          weekend,
          workingDays,
          workingHour,
          targetHour,
          perDayWorking,
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
    const body = await req.json();
    if (!body.month) {
      return NextResponse.json({ success: false, message: 'Month is required' }, { status: 400 });
    }
    const collection = mongoose.connection.collection('monthly_reports');
    // Upsert by month
    await collection.updateOne(
      { month: body.month },
      { $set: body },
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