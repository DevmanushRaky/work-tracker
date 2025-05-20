import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from "@/lib/jwt";
import dbConnect from "@/lib/dbConnect";
import DailyLog from "@/models/DailyLog";
import { z } from 'zod';

// Define attendance types to match the model
const AttendanceType = z.enum([
  'Present',
  'Absent',
  'Leave',
  'Holiday',
  'Weekend',
  'Work from Home',
  'Halfday'
]);

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
    
    // Flexible schema: only require standup/report for non-special attendance
    const baseSchema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      attendance: AttendanceType,
      inTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'In time must be in HH:mm format').optional().nullable(),
      outTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Out time must be in HH:mm format').optional().nullable(),
      standup: z.string().optional().nullable(),
      report: z.string().optional().nullable(),
      remarks: z.string().optional().nullable(),
      workingHour: z.string().regex(/^\d+\.\d{2}$/, 'Working hour must be in H.mm format').optional().nullable(),
    });
    const bodyData = baseSchema.safeParse(body);
    if (!bodyData.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid data", 
        errors: bodyData.error.errors 
      }, { status: 400 });
    }
    const specialAttendance = ["Leave", "Holiday", "Weekend", "Absent"];
    const isSpecial = specialAttendance.includes(bodyData.data.attendance);
    if (!isSpecial) {
      // For regular attendance, require at least one of standup or report
      if (!bodyData.data.standup && !bodyData.data.report) {
        return NextResponse.json({
          success: false,
          message: "Either standup or report is required"
        }, { status: 400 });
      }
    }
    // Use bodyData.data as the validated data

    // Upsert logic: update if exists, else insert
    const log = await DailyLog.findOne({ userId, date: bodyData.data.date });
    if (log) {
      // Only update provided fields
      const validatedData = bodyData.data as Record<string, unknown>;
      Object.keys(validatedData).forEach((key) => {
        if ((validatedData as Record<string, unknown>)[key] !== undefined) {
          (log as Record<string, unknown>)[key] = (validatedData as Record<string, unknown>)[key];
        }
      });
      // Set default values for special attendance types
      if (specialAttendance.includes(log.attendance)) {
        log.inTime = log.inTime || "00:00";
        log.outTime = log.outTime || "00:00";
        log.standup = log.standup || " ";
        log.report = log.report || " ";
        log.workingHour = log.workingHour || "0.00";
      }
      const savedLog = await log.save();
      return NextResponse.json({ 
        success: true, 
        message: 'Report updated successfully', 
        data: savedLog 
      });
    } else {
      // Prepare data for saving
      const logData = {
        ...bodyData.data,
        userId,
      };
      // Set default values for special attendance types
      if (specialAttendance.includes(logData.attendance)) {
        logData.inTime = logData.inTime || "00:00";
        logData.outTime = logData.outTime || "00:00";
        logData.standup = logData.standup || "N/A";
        logData.report = logData.report || "N/A";
        logData.workingHour = logData.workingHour || "0.00";
      }
      // Create new daily log
      const dailyLog = new DailyLog(logData);
      const savedLog = await dailyLog.save();
      return NextResponse.json({ 
        success: true, 
        message: 'Report saved successfully', 
        data: savedLog 
      });
    }
  } catch (error: unknown) {
    console.error('POST /api/daily error:', error);
    let message = 'Failed to save report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
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

    // Parse query parameters
    const url = req.url ? new URL(req.url, 'http://localhost') : null;
    const month = url?.searchParams.get('month'); // format: YYYY-MM
    const startDate = url?.searchParams.get('startDate');
    const endDate = url?.searchParams.get('endDate');

    // Define query type
    type QueryType = {
      userId: string;
      date?: { $regex?: string; $gte?: string; $lte?: string };
    };

    let query: QueryType = { userId };
    
    // Apply date filters
    if (month) {
      query = { ...query, date: { $regex: `^${month}` } };
    } else if (startDate && endDate) {
      query = { ...query, date: { $gte: startDate, $lte: endDate } };
    }

    // Fetch records with proper sorting
    const records = await DailyLog.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      records,
      count: records.length
    });
  } catch (error: unknown) {
    console.error('GET /api/daily error:', error);
    let message = 'Failed to fetch reports.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

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

    // Validate update fields
    const parseResult = z.object({
      date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
      attendance: AttendanceType.optional(),
      inTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'In time must be in HH:mm format').optional().nullable(),
      outTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Out time must be in HH:mm format').optional().nullable(),
      standup: z.string().optional().nullable(),
      report: z.string().optional().nullable(),
      remarks: z.string().optional().nullable(),
      workingHour: z.string().regex(/^\d+\.\d{2}$/, 'Working hour must be in H.mm format').optional().nullable(),
    }).safeParse(updateFields);

    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid data", 
        errors: parseResult.error.errors 
      }, { status: 400 });
    }

    // Find and update the log
    const dailyLog = await DailyLog.findOne({ _id: id, userId });
    if (!dailyLog) {
      return NextResponse.json({ 
        success: false, 
        message: 'Report not found or unauthorized.' 
      }, { status: 404 });
    }

    // Only update provided fields
    const updatedFields = parseResult.data;
    Object.keys(updatedFields).forEach((key) => {
      if ((updatedFields as Record<string, unknown>)[key] !== undefined) {
        (dailyLog as Record<string, unknown>)[key] = (updatedFields as Record<string, unknown>)[key];
      }
    });

    // Set default values for special attendance types
    if (updatedFields.attendance && ['Leave', 'Holiday', 'Weekend',"Absent"].includes(updatedFields.attendance)) {
      dailyLog.inTime = dailyLog.inTime || '00:00';
      dailyLog.outTime = dailyLog.outTime || '00:00';
      dailyLog.standup = dailyLog.standup || ' ';
      dailyLog.report = dailyLog.report || ' ';
      dailyLog.workingHour = dailyLog.workingHour || '0.00';
    }

    const updatedLog = await dailyLog.save();

    // Handle leave calculation if attendance is changed
    if (updatedFields.attendance === 'Leave' || dailyLog.attendance === 'Leave') {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(userId);
      if (user) {
        // Get the month from the log's date
        const monthStr = (updatedFields.date || dailyLog.date).slice(0, 7); // 'YYYY-MM'
        const leavesThisMonth = await DailyLog.countDocuments({ 
          userId, 
          attendance: 'Leave', 
          date: { $regex: `^${monthStr}` } 
        });
        const allowed = user.leaveAllowedPerMonth || 0;
        let earned = user.earnedLeave || 0;
        if (leavesThisMonth === 0) {
          earned += allowed;
        } else {
          const totalAvailable = earned + allowed;
          if (leavesThisMonth >= totalAvailable) {
            earned = 0;
          } else if (leavesThisMonth <= earned) {
            earned -= leavesThisMonth;
          } else {
            // Use up earned, then allowed
            earned = 0;
          }
        }
        user.earnedLeave = earned;
        await user.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report updated successfully.',
      data: updatedLog
    });
  } catch (error: unknown) {
    let message = 'Failed to update report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

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

    // Find and delete the log
    const dailyLog = await DailyLog.findOneAndDelete({ _id: id, userId });
    if (!dailyLog) {
      return NextResponse.json({ 
        success: false, 
        message: 'Report not found or unauthorized.' 
      }, { status: 404 });
    }

    // Recalculate earnedLeave if the deleted log was a leave
    if (dailyLog.attendance === 'Leave') {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(userId);
      if (user) {
        // Get the month from the log's date
        const monthStr = dailyLog.date.slice(0, 7); // 'YYYY-MM'
        const leavesThisMonth = await DailyLog.countDocuments({ 
          userId, 
          attendance: 'Leave', 
          date: { $regex: `^${monthStr}` } 
        });
        const allowed = user.leaveAllowedPerMonth || 0;
        let earned = user.earnedLeave || 0;
        if (leavesThisMonth === 0) {
          earned += allowed;
        } else {
          const totalAvailable = earned + allowed;
          if (leavesThisMonth >= totalAvailable) {
            earned = 0;
          } else if (leavesThisMonth <= earned) {
            earned -= leavesThisMonth;
          } else {
            // Use up earned, then allowed
            earned = 0;
          }
        }
        user.earnedLeave = earned;
        await user.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully.',
      data: dailyLog
    });
  } catch (error: unknown) {
    let message = 'Failed to delete report.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}