import mongoose from 'mongoose';
import { CronJobSchema } from './models/CronJob';

interface ConnectionPayload {
    conn: mongoose.Connection;
    CronJob: mongoose.Model<any>;
}

let connections: ConnectionPayload[] = [];

/**
 * Connects to all configured MongoDB URIs.
 * Returns an array of connection objects, each containing a Mongoose Connection and the CronJob model bound to it.
 */
export const connectDB = async (): Promise<ConnectionPayload[]> => {
  const MONGODB_URIS = process.env.MONGODB_URIS?.split(',').filter(Boolean) || [];

  if (connections.length > 0) return connections;

  if (MONGODB_URIS.length === 0) {
    console.warn('No MONGODB_URIS provided in environment variables.');
    return [];
  }

  const newConnections: ConnectionPayload[] = [];

  for (const uri of MONGODB_URIS) {
    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        const CronJob = conn.model('CronJob', CronJobSchema);
        newConnections.push({ conn, CronJob });
        console.log(`Connected to MongoDB at ${uri}`);
    } catch (err) {
        console.error(`Failed to connect to MongoDB at ${uri}`, err);
    }
  }

  connections = newConnections;
  return connections;
};

export const getWriteConnection = async () => {
    const conns = await connectDB();
    if (conns.length === 0) throw new Error("No database connections available.");
    return conns[Math.floor(Math.random() * conns.length)];
}
