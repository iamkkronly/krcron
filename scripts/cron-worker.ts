import axios from 'axios';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { connectDB } from '../lib/db';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runCron() {
  console.log('Starting cron worker...');

  try {
    const conns = await connectDB();

    if (conns.length === 0) {
        console.log('No DB connections. Ensure MONGODB_URIS is set in .env or .env.local');
        return;
    }

    for (const { CronJob } of conns) {
      const now = new Date();
      const jobs = await CronJob.find({});

      const jobPromises = jobs.map(async (job: any) => {
        const lastChecked = job.lastChecked ? new Date(job.lastChecked) : new Date(0);
        const intervalMs = (job.interval || 5) * 60 * 1000;

        if (now.getTime() - lastChecked.getTime() >= intervalMs) {
          console.log(`Pinging ${job.url}...`);
          const start = Date.now();
          try {
            await axios.get(job.url, { timeout: 10000 }); // 10s timeout
            const duration = Date.now() - start;

            job.status = 'UP';
            job.responseTime = duration;
            job.lastChecked = now;
            await job.save();
            console.log(`[UP] ${job.url} - ${duration}ms`);
          } catch (err: any) {
             const duration = Date.now() - start;
             job.status = 'DOWN';
             job.responseTime = duration;
             job.lastChecked = now;
             await job.save();
             console.log(`[DOWN] ${job.url} - ${err.message}`);
          }
        }
      });

      await Promise.all(jobPromises);
    }
  } catch (error) {
    console.error('Cron worker error:', error);
  }
}

// Run immediately and then every minute
runCron();
setInterval(runCron, 60 * 1000);
