// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salaryHistory?: { from: Date; salary: number; position?: string }[];
  salaryCreditedDay?: number;
  leaveAllowedPerMonth?: number;
  createdAt?: Date;
  earnedLeave?: number;
}

const SalaryHistorySchema = new Schema(
  {
    from: { type: Date, required: true },
    salary: { type: Number, required: true },
    position: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  phone: String,
  department: String,
  designation: String,
  salaryHistory: [SalaryHistorySchema],
  salaryCreditedDay: { type: Number, default: 7 },
  leaveAllowedPerMonth: { type: Number, default: 0 },
  earnedLeave: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);