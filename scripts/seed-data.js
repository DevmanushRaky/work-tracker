// seedDailyReports.js

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const collectionName = 'daily_reports'; 

const data = [
  // { day: "Tuesday", date: "2025-04-15", inTime: "10:10 AM", outTime: "7:10 PM", workingHour: 9.0, attendance: "Present", remarks: "Joining Day", standup: "", report: "" },
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