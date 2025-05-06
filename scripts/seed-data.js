// seedDailyReports.js

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const collectionName = 'daily_reports'; 

const data = [
  { day: "Tuesday", date: "2025-04-15", inTime: "10:10 AM", outTime: "7:10 PM", workingHour: 9.0, attendance: "Present", remarks: "Joining Day", standup: "", report: "" },
  { day: "Wednesday", date: "2025-04-16", inTime: "9:30 AM", outTime: "6:30 PM", workingHour: 9.0, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Thursday", date: "2025-04-17", inTime: "9:13 AM", outTime: "7:30 PM", workingHour: 10.17, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Friday", date: "2025-04-18", inTime: "9:40 AM", outTime: "7:30 PM", workingHour: 9.5, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Saturday", date: "2025-04-19", inTime: "7:30 AM", outTime: "3:45 PM", workingHour: 8.15, attendance: "Work from home", remarks: "", standup: "", report: "" },
  { day: "Sunday", date: "2025-04-20", inTime: "", outTime: "", workingHour: 0.0, attendance: "Weekend", remarks: "", standup: "", report: "" },
  { day: "Monday", date: "2025-04-21", inTime: "10:25 AM", outTime: "8:20 PM", workingHour: 9.55, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Tuesday", date: "2025-04-22", inTime: "10:15 AM", outTime: "7:40 PM", workingHour: 9.3, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Wednesday", date: "2025-04-23", inTime: "10:15 AM", outTime: "8:10 PM", workingHour: 9.55, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Thursday", date: "2025-04-24", inTime: "9:30 AM", outTime: "7:20 PM", workingHour: 9.5, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Friday", date: "2025-04-25", inTime: "9:50 AM", outTime: "8:10 PM", workingHour: 10.2, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Saturday", date: "2025-04-26", inTime: "8:55 AM", outTime: "6:05 PM", workingHour: 9.1, attendance: "Work from home", remarks: "", standup: "", report: "" },
  { day: "Sunday", date: "2025-04-27", inTime: "", outTime: "", workingHour: 0.0, attendance: "Weekend", remarks: "", standup: "", report: "" },
  { day: "Monday", date: "2025-04-28", inTime: "9:55 AM", outTime: "7:35 PM", workingHour: 9.4, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Tuesday", date: "2025-04-29", inTime: "10:00 AM", outTime: "7:40 PM", workingHour: 9.4, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Wednesday", date: "2025-04-30", inTime: "9:35 AM", outTime: "7:45 PM", workingHour: 10.1, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Thursday", date: "2025-05-01", inTime: "8:40 AM", outTime: "8:50 PM", workingHour: 11.1, attendance: "Present", remarks: "", standup: "", report: "" },
  { day: "Friday", date: "2025-05-02", inTime: "10:15 AM", outTime: "8:05 PM", workingHour: 9.5, attendance: "Work from home", remarks: "", standup: "", report: "" }
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Optional: Clear existing data
    await collection.deleteMany({});

    const result = await collection.insertMany(data);
    console.log(`Inserted ${result.insertedCount} documents`);
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await client.close();
  }
}

seed();