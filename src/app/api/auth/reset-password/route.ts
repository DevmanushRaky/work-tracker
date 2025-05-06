import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and new password are required." }, { status: 400 });
    }
    const emailNormalized = email.trim().toLowerCase();
    if (typeof password !== 'string' || password.trim().length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters and not just whitespace." }, { status: 400 });
    }
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.updatedAt = new Date();
    await user.save();
    return NextResponse.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    let message = "Failed to reset password.";
    if (error instanceof Error && typeof error.message === "string") {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
} 