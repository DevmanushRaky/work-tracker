// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import { signJwt } from "@/lib/jwt"; // implement JWT sign/verify helpers
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password: inputPassword } = await req.json();
    const emailNormalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
    if (!user) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    const valid = await bcrypt.compare(inputPassword, user.password);
    if (!valid) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    const token = signJwt({ userId: user._id });
    const userObj = user.toObject();
    delete userObj.password;
    return NextResponse.json({ success: true, token, user: userObj });
  } catch (error: unknown) {
    let message = 'Failed to login.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}