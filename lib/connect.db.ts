/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(cwd());

const MongoDB = process.env.DB_URL || "";

if (!MongoDB) {
  throw new Error("MongoDB is not defined please check your integration db");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  cached.promise = mongoose.connect(MongoDB).then((mongoose) => {
    return mongoose;
  });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

export default connectToDatabase;
