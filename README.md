# KrCron Monitor

A Next.js based Cron Job monitoring website (similar to UptimeRobot).

## Features

- **Monitor URLs:** Add HTTP/HTTPS URLs to be monitored every 3 minutes.
- **Top 10 Dashboard:** View the top 10 most recently added/active monitors on the homepage.
- **Multi-DB Support:** Distribute data across multiple MongoDB instances.
- **No Deletion:** By design, monitors cannot be deleted by users.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Database:**
    Open `.env.local` and add your MongoDB connection strings, separated by commas.
    ```env
    MONGODB_URIS=mongodb://localhost:27017/db1,mongodb://localhost:27017/db2
    ```

3.  **Run the Web App:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

4.  **Run the Cron Worker:**
    The worker script is responsible for checking the status of the URLs. Run it in a separate terminal.
    ```bash
    npx ts-node scripts/cron-worker.ts
    ```

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `lib/`: Shared logic (Database connection, Models).
- `scripts/`: Background worker scripts.
