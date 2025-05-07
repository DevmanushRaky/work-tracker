import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import LeaveLog from '@/models/LeaveLog';
import { verifyJwt } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || typeof payload === "string" || !("userId" in payload)) {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }
  const userId = (payload as { userId: string }).userId;
  const logs = await LeaveLog.find({ userId }).sort({ month: -1 });
  return NextResponse.json({ success: true, logs });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || typeof payload === "string" || !("userId" in payload)) {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }
  const userId = (payload as { userId: string }).userId;
  const { month, earnedLeave, leaveAllowed } = await req.json();
  if (!month) return NextResponse.json({ success: false, message: 'Month is required' }, { status: 400 });
  try {
    const existing = await LeaveLog.findOne({ userId, month });
    if (existing) return NextResponse.json({ success: false, message: 'Leave log for this month already exists' }, { status: 400 });
    const log = await LeaveLog.create({
      userId,
      month,
      earnedLeave: earnedLeave ?? 0,
      leaveAllowed: leaveAllowed ?? 0,
      leaveTaken: 0,
      balanceLeave: (earnedLeave ?? 0) + (leaveAllowed ?? 0),
    });
    return NextResponse.json({ success: true, log });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to add leave log' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || typeof payload === "string" || !("userId" in payload)) {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }
  const userId = (payload as { userId: string }).userId;
  const { id, earnedLeave, leaveAllowed } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
  try {
    const log = await LeaveLog.findOne({ _id: id, userId });
    if (!log) return NextResponse.json({ success: false, message: 'Leave log not found' }, { status: 404 });
    log.earnedLeave = earnedLeave ?? log.earnedLeave;
    log.leaveAllowed = leaveAllowed ?? log.leaveAllowed;
    log.balanceLeave = (log.earnedLeave ?? 0) + (log.leaveAllowed ?? 0) - (log.leaveTaken ?? 0);
    await log.save();
    return NextResponse.json({ success: true, log });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update leave log' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || typeof payload === "string" || !("userId" in payload)) {
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }
  const userId = (payload as { userId: string }).userId;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
  try {
    const log = await LeaveLog.findOneAndDelete({ _id: id, userId });
    if (!log) return NextResponse.json({ success: false, message: 'Leave log not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete leave log' }, { status: 500 });
  }
} 