import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    let { email } = await req.json();
    console.log('Input email:', email);
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
    }
    email = email.trim().toLowerCase();
    console.log('Normalized email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', !!user, user ? user.email : null);
    if (user) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
