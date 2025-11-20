'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

interface CronJob {
  _id: string;
  url: string;
  status: string;
  lastChecked?: string;
  interval: number;
  responseTime?: number;
}

export default function Home() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Cron job added successfully!');
        setNewUrl('');
        fetchJobs();
      } else {
        setError(data.error || 'Failed to add cron job');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">KrCron Monitor</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add New Monitor */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8 p-6">
          <h2 className="text-lg font-medium leading-6 mb-4">Add New Monitor (3min interval)</h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL (http/https)
              </label>
              <input
                type="text"
                name="url"
                id="url"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 sm:text-sm p-2 border"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Monitor'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
        </div>

        {/* Dashboard */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6">Top 10 Cron Jobs</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No monitors found. Add one above!</li>
            ) : (
                jobs.map((job) => (
                <li key={job._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 gap-4">
                        <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${job.status === 'UP' ? 'bg-green-400' : job.status === 'DOWN' ? 'bg-red-400' : 'bg-gray-400'}`} aria-hidden="true" />
                        <p className="truncate text-sm font-medium text-green-600 dark:text-green-400">{job.url}</p>
                    </div>
                    <div className="ml-4 flex flex-shrink-0">
                        <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${job.status === 'UP' ? 'bg-green-100 text-green-800' : job.status === 'DOWN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                        </p>
                    </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        Last checked: {job.lastChecked ? new Date(job.lastChecked).toLocaleString() : 'Never'}
                        </p>
                        {job.responseTime !== undefined && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                                Response: {job.responseTime}ms
                            </p>
                        )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>Interval: {job.interval}m</p>
                    </div>
                    </div>
                </li>
                ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
