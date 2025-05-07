import mongoose, { Schema, Document } from 'mongoose';

// Interface for DailyLog document
export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  inTime: string;
  outTime: string;
  attendance: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Weekend' | 'Work from Home' | 'Halfday';
  standup: string;
  report: string;
  remarks?: string;
  workingHour?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // Add index for better query performance
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      validate: {
        validator: function(v: string) {
          // Validate date format (YYYY-MM-DD)
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date must be in YYYY-MM-DD format'
      }
    },
    inTime: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for special attendance types
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'In time must be in HH:mm format'
      }
    },
    outTime: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for special attendance types
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Out time must be in HH:mm format'
      }
    },
    attendance: {
      type: String,
      required: [true, 'Attendance is required'],
      enum: {
        values: ['Present', 'Absent', 'Leave', 'Holiday', 'Weekend', 'Work from Home', 'Halfday'],
        message: '{VALUE} is not a valid attendance status'
      }
    },
    standup: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for special attendance types
          return v.length > 0;
        },
        message: 'Standup is required for regular attendance'
      }
    },
    report: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for special attendance types
          return v.length > 0;
        },
        message: 'Report is required for regular attendance'
      }
    },
    remarks: {
      type: String,
      trim: true
    },
    workingHour: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for special attendance types
          return /^\d+\.\d{2}$/.test(v);
        },
        message: 'Working hour must be in H.mm format'
      }
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save middleware to set default values for special attendance types
DailyLogSchema.pre('save', function(next) {
  if (['Leave', 'Holiday', 'Weekend', 'Absent'].includes(this.attendance)) {
    this.inTime = this.inTime || '00:00';
    this.outTime = this.outTime || '00:00';
    this.standup = this.standup || 'N/A';
    this.report = this.report || 'N/A';
    this.workingHour = this.workingHour || '0.00';
  }
  next();
});

// Compound index for userId and date to prevent duplicate entries
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Static method to find logs by user ID
DailyLogSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) });
};

// Static method to find logs by user ID and date range
DailyLogSchema.statics.findByUserIdAndDateRange = function(userId: string, startDate: string, endDate: string) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate }
  });
};

// Instance method to check if user owns the log
DailyLogSchema.methods.isOwnedBy = function(userId: string) {
  return this.userId.toString() === userId;
};

// Create and export the model
const DailyLog = mongoose.models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

export default DailyLog; 