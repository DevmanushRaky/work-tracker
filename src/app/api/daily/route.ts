import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { z } from 'zod';
import { verifyJwt } from "@/lib/jwt";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

const DailyReportSchema = z.object({
  date: z.string(),
  inTime: z.string(),
  outTime: z.string(),
  attendance: z.string(),
  standup: z.string(),
  report: z.string(),
  remarks: z.string().optional(),
  workingHour: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!uri) {
    return NextResponse.json({ success: false, message: 'MongoDB URI not set.' }, { status: 500 });
  }
  let client: MongoClient | undefined;
  try {
    // Get userId from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const payload = verifyJwt(token as string);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;

    const body = await req.json();
    const parseResult = DailyReportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: parseResult.error.errors }, { status: 400 });
    }
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('daily_reports');
    // Attach userId to the report
    const reportWithUser = { ...parseResult.data, userId };
    const result = await collection.insertOne(reportWithUser);

    // If attendance is 'Leave', recalculate earnedLeave
    if (parseResult.data.attendance === 'Leave') {
      const users = db.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (user) {
        // Get current month in YYYY-MM
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // Count leaves for this user in this month
        const leavesThisMonth = await collection.countDocuments({ userId, attendance: 'Leave', date: { $regex: `^${monthStr}` } });
        const allowed = user.leaveAllowedPerMonth || 0;
        const earned = user.earnedLeave || 0;
        // Calculate how many leaves should be deducted from earnedLeave
        const excess = Math.max(0, leavesThisMonth - allowed);
        const newEarnedLeave = Math.max(0, earned - excess);
        await users.updateOne({ _id: new ObjectId(userId) }, { $set: { earnedLeave: newEarnedLeave } });
      }
    }
    return NextResponse.json({ success: true, message: 'Report saved successfully', id: result.insertedId });
  } catch (error: unknown) {
    let message = 'Failed to save report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function GET(req: NextRequest) {
  if (!uri) {
    return NextResponse.json({ success: false, message: 'MongoDB URI not set.' }, { status: 500 });
  }
  let client: MongoClient | undefined;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('daily_reports');
    // Month filter
    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const month = url?.searchParams.get('month'); // format: YYYY-MM
    let query = {};
    if (month) {
      // date: 'YYYY-MM-DD' so filter by regex
      query = { date: { $regex: `^${month}` } };
    }
    const records = await collection.find(query).sort({ date: -1 }).toArray();
    return NextResponse.json({ success: true, records });
  } catch (error: unknown) {
    let message = 'Failed to fetch reports.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

// PATCH: Update a report by id
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    // Get userId from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const payload = verifyJwt(token as string);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;

    const body = await req.json();
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    }
    delete updateFields._id;
    const collection = mongoose.connection.collection('daily_reports');
    // Only update if the report belongs to the user
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id), userId },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Report not found or unauthorized.' }, { status: 404 });
    }
    // Recalculate earnedLeave if attendance is changed to or from 'Leave'
    if (updateFields.attendance === 'Leave' || updateFields.attendance === undefined) {
      const users = mongoose.connection.collection('users');
      const user = await users.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      if (user) {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const leavesThisMonth = await collection.countDocuments({ userId, attendance: 'Leave', date: { $regex: `^${monthStr}` } });
        const allowed = user.leaveAllowedPerMonth || 0;
        const earned = user.earnedLeave || 0;
        const excess = Math.max(0, leavesThisMonth - allowed);
        const newEarnedLeave = Math.max(0, earned - excess);
        await users.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { earnedLeave: newEarnedLeave } });
      }
    }
    return NextResponse.json({ success: true, message: 'Report updated successfully.' });
  } catch (error: unknown) {
    let message = 'Failed to update report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE: Delete a report by id
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    // Get userId from JWT
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const payload = verifyJwt(token as string);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    }
    const collection = mongoose.connection.collection('daily_reports');
    // Only delete if the report belongs to the user
    const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(id), userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Report not found or unauthorized.' }, { status: 404 });
    }
    // Recalculate earnedLeave after deletion
    const users = mongoose.connection.collection('users');
    const user = await users.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (user) {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const leavesThisMonth = await collection.countDocuments({ userId, attendance: 'Leave', date: { $regex: `^${monthStr}` } });
      const allowed = user.leaveAllowedPerMonth || 0;
      const earned = user.earnedLeave || 0;
      const excess = Math.max(0, leavesThisMonth - allowed);
      const newEarnedLeave = Math.max(0, earned - excess);
      await users.updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { earnedLeave: newEarnedLeave } });
    }
    return NextResponse.json({ success: true, message: 'Report deleted successfully.' });
  } catch (error: unknown) {
    let message = 'Failed to delete report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}