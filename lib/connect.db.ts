/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from "node:dns";
import mongoose from "mongoose";
import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(cwd());

// Some Windows setups hand Node only a loopback resolver that refuses the SRV
// lookup behind mongodb+srv:// URLs (querySrv ECONNREFUSED). Fall back to public DNS.
// The promise API can hold its own resolver (it does under Next), so set both.
const PUBLIC_DNS = ["1.1.1.1", "8.8.8.8"];
const isLoopback = (servers: string[]) => servers.every((s) => s.startsWith("127.") || s === "::1");
if (isLoopback(dns.getServers())) dns.setServers(PUBLIC_DNS);
if (isLoopback(dns.promises.getServers())) dns.promises.setServers(PUBLIC_DNS);

const MongoDB = process.env.DB_URL || "";

if (!MongoDB) {
  throw new Error("MongoDB is not defined please check your integration db");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  // 1 = connected. A cached handle whose connection has since dropped is useless.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  cached.conn = null;

  // Concurrent callers share one in-flight connect instead of each opening their own.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MongoDB).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  } finally {
    if (cached.conn) cached.promise = null;
  }
}

export default connectToDatabase;
