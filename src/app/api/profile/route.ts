// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"
import { verifyJwt } from "@/lib/jwt";
import User from "@/models/User";

const defaultUserFields = {
  name: "",
  phone: "",
  department: "",
  designation: "",
  salaryHistory: [],
  salaryCreditedDay: 7,
  leaveAllowedPerMonth: 0,
  earnedLeave: 0,
  createdAt: "",
  updatedAt: "",
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const payload = verifyJwt(token as string);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    if ("password" in user) delete user.password;
    // Fill in only missing fields with defaults, do not overwrite existing fields
    const userObj = user.toObject();
    const fullUser = { ...userObj };
    for (const key in defaultUserFields) {
      if (!(key in fullUser)) {
        fullUser[key as keyof typeof defaultUserFields] = defaultUserFields[key as keyof typeof defaultUserFields];
      }
    }
    return NextResponse.json({ success: true, user: fullUser });
  } catch (error: unknown) {
    let message = 'Failed to fetch user.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const payload = verifyJwt(token as string);
    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = (payload as { userId: string }).userId;
    const updates = await req.json();
    if (updates.password) delete updates.password; // don't allow password change here
    const user = await User.findById(userId);
    if (user && !Array.isArray(user.salaryHistory)) {
      await User.updateOne(
        { _id: userId },
        { $set: { salaryHistory: [] } }
      );
    }
    if (updates.salaryHistory) {
      if (updates.salaryHistory.action === "add" && updates.salaryHistory.record) {
        await User.updateOne(
          { _id: userId },
          { $push: { salaryHistory: updates.salaryHistory.record }, $set: { updatedAt: new Date() } }
        );
      } else if (updates.salaryHistory.action === "edit" && typeof updates.salaryHistory.index === "number" && updates.salaryHistory.record) {
        // Edit salaryHistory at index
        const user = await User.findById(userId);
        if (user && Array.isArray(user.salaryHistory)) {
          const arr = [...user.salaryHistory];
          arr[updates.salaryHistory.index] = updates.salaryHistory.record;
          await User.updateOne(
            { _id: userId },
            { $set: { salaryHistory: arr, updatedAt: new Date() } }
          );
        }
      } else if (updates.salaryHistory.action === "delete" && typeof updates.salaryHistory.index === "number") {
        // Remove salaryHistory at index
        const user = await User.findById(userId);
        if (user && Array.isArray(user.salaryHistory)) {
          const arr = [...user.salaryHistory];
          arr.splice(updates.salaryHistory.index, 1);
          await User.updateOne(
            { _id: userId },
            { $set: { salaryHistory: arr, updatedAt: new Date() } }
          );
        }
      } else if (updates.salaryHistory.action === "replace" && Array.isArray(updates.salaryHistory.records)) {
        await User.updateOne(
          { _id: userId },
          { $set: { salaryHistory: updates.salaryHistory.records, updatedAt: new Date() } }
        );
      } else {
        // fallback: ignore salaryHistory if not in expected format, update other fields
        await User.updateOne(
          { _id: userId },
          { $set: updates }
        );
      }
    } else {
      await User.updateOne(
        { _id: userId },
        { $set: updates }
      );
    }
    const updatedUser = await User.findById(userId);
    if (updatedUser && 'password' in updatedUser) delete updatedUser.password;
    if (updatedUser && updatedUser.earnedLeave === undefined) updatedUser.earnedLeave = 0;
    const updatedUserObj = updatedUser.toObject();
    return NextResponse.json({ success: true, user: updatedUserObj });
  } catch (error: unknown) {
    let message = 'Failed to update user.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}