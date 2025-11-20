import { NextResponse } from 'next/server';
import { getWriteConnection, connectDB } from '@/lib/db';

export async function GET() {
  try {
    const conns = await connectDB();
    let allJobs: any[] = [];

    // We need to fetch from all DBs to find the top 10.
    // This is inefficient for large datasets but required by the architecture of "multiple uris" without a central index.
    for (const { CronJob } of conns) {
      // We fetch more than 10 just in case, or all?
      // If we have 2 DBs, top 10 could be all in DB1 or split.
      // To be safe, we fetch top 10 from EACH, then merge and take top 10.
      const jobs = await CronJob.find({}).sort({ createdAt: -1 }).limit(10);
      allJobs = allJobs.concat(jobs);
    }

    // Sort merged list and take top 10
    allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const top10 = allJobs.slice(0, 10);

    return NextResponse.json({ jobs: top10 });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL: must start with http:// or https://
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      return NextResponse.json({ error: 'Invalid URL. Must start with http:// or https://' }, { status: 400 });
    }

    const { CronJob } = await getWriteConnection();

    const newJob = await CronJob.create({
      url,
      interval: 5 // default 5 min as per request
    });

    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch (error) {
    console.error('Error creating cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
