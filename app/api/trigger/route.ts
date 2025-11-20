import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import axios from 'axios';

// Vercel Cron Jobs will hit this endpoint
export async function GET() {
  console.log('Starting cron trigger...');
  try {
    const conns = await connectDB();

    if (conns.length === 0) {
      console.log('No DB connections. Ensure MONGODB_URIS is set in .env or .env.local');
      return NextResponse.json({ error: 'No DB connections' }, { status: 500 });
    }

    const results = [];

    for (const { CronJob } of conns) {
      const now = new Date();
      const jobs = await CronJob.find({});

      const jobPromises = jobs.map(async (job: any) => {
        const lastChecked = job.lastChecked ? new Date(job.lastChecked) : new Date(0);
        // Default to 3 if not set, but we will respect the job's interval
        const intervalMs = (job.interval || 3) * 60 * 1000;

        if (now.getTime() - lastChecked.getTime() >= intervalMs) {
          console.log(`Pinging ${job.url}...`);
          const start = Date.now();
          let status = 'PENDING';
          let duration = 0;
          let errorMsg = null;

          try {
            await axios.get(job.url, { timeout: 10000 }); // 10s timeout
            duration = Date.now() - start;
            status = 'UP';
          } catch (err: any) {
             duration = Date.now() - start;
             status = 'DOWN';
             errorMsg = err.message;
          }

          // Update job
          job.status = status;
          job.responseTime = duration;
          job.lastChecked = now;
          await job.save();

          return {
            url: job.url,
            status,
            duration,
            error: errorMsg
          };
        }
        return null;
      });

      const jobResults = await Promise.all(jobPromises);
      results.push(...jobResults.filter(r => r !== null));
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error: any) {
    console.error('Cron trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
