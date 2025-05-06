// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password: inputPassword } = await req.json();
    if (!email || !inputPassword) {
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });
    }
    const emailLower = email.toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 });
    }
    const hash = await bcrypt.hash(inputPassword, 10);
    const user = await User.create({
      email: emailLower,
      password: hash,
      salaryHistory: [{ from: new Date(), salary: 10000 }],
      salaryCreditedDay: 7,
      leaveAllowedPerMonth: 0,
      earnedLeave: 0,
      name: "",
      phone: "",
      department: "",
      designation: ""
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User creation failed" }, { status: 500 });
    }
    // Remove password from user object before returning
    const userObj = user.toObject();
    delete userObj.password;
    return NextResponse.json({ success: true, user: userObj });
  } catch (error: unknown) {
    let message = 'Failed to register user.';
    if (error instanceof Error && typeof error.message === 'string') {
      message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}