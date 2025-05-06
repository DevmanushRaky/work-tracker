// src/lib/dbConnect.ts
import mongoose from "mongoose";

// IMPORTANT: Ensure your MONGODB_URI and MONGODB_DB are set in your .env file
// If MONGODB_DB is set, ensure the connection uses that database
const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string | undefined;

function buildUriWithDb(uri: string, db: string | undefined): string {
  if (!db) return uri;
  // If URI already ends with /db or /db?..., do not append
  const regex = new RegExp(`/(${db})([/?]|$)`);
  if (regex.test(uri)) return uri;
  // Insert db name before query string if present
  const [base, query] = uri.split("?");
  return query ? `${base.replace(/\/?$/, "/")}${db}?${query}` : `${base.replace(/\/?$/, "/")}${db}`;
}

export default async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  const uri = buildUriWithDb(MONGODB_URI, MONGODB_DB);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log("Connected to DB:", mongoose.connection.name); // Should print your intended DB
  }
}