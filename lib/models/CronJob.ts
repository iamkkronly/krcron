import mongoose, { Schema, Document } from 'mongoose';

export interface ICronJob extends Document {
  url: string;
  createdAt: Date;
  lastChecked?: Date;
  status: string;
  responseTime?: number;
  interval: number; // in minutes
}

export const CronJobSchema: Schema = new Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastChecked: { type: Date },
  status: { type: String, default: 'PENDING' },
  responseTime: { type: Number, default: 0 },
  interval: { type: Number, default: 3 }
});
