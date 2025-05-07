import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveLog extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // 'YYYY-MM'
  earnedLeave: number;
  leaveAllowed: number;
  leaveTaken: number;
  balanceLeave: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveLogSchema = new Schema<ILeaveLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true }, // 'YYYY-MM'
  earnedLeave: { type: Number, default: 0 },
  leaveAllowed: { type: Number, default: 0 },
  leaveTaken: { type: Number, default: 0 },
  balanceLeave: { type: Number, default: 0 },
}, { timestamps: true });

LeaveLogSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.models.LeaveLog || mongoose.model<ILeaveLog>('LeaveLog', LeaveLogSchema); 