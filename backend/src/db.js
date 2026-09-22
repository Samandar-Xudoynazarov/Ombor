const mongoose = require('mongoose');

// Serverless muhitda ulanishni qayta ishlatish uchun global kesh
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI muhit o\'zgaruvchisi berilmagan');
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

module.exports = connectDB;
