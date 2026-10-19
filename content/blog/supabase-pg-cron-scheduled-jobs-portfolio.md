---
title: "Scheduled jobs inside Supabase with pg_cron: the analytics purge, the weekly digest, and no server to run them on"
description: "This site runs on Vercel and Supabase and has no always-on server, so where does a nightly cleanup run? Inside Postgres. pg_cron schedules SQL; pg_net lets that SQL call an HTTP endpoint. How the analytics purge, the daily summary rollup and the Monday digest email are scheduled with no cron server at all, and the limits of doing it this way."
date: 2028-09-18T03:30:00Z
tags: [supabase, postgres, pg_cron, nextjs, operations]
keywords: [supabase pg_cron scheduled job, supabase cron without server, pg_net call edge function schedule, postgres scheduled task supabase, serverless cron next.js vercel]
project: portfolio
image: /blog/stock/alarm-2.webp
imageAlt: "Old alarm clock on a bookshelf"
imageCredit: "Nenad Stojkovic"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Old_alarm_clock_on_the_bookshelf_-_50233824038.jpg"
imageLicense: "CC BY 2.0"
---

The VPS projects have systemd timers and a worker process. This site has neither: Vercel runs the pages on request and Supabase holds the data. Three things still need to happen on a schedule, and the answer that needed no new infrastructure was to let the database schedule them.

## Enable the extensions

In the Supabase dashboard under Database › Extensions, or by SQL:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

`pg_cron` runs SQL on a cron schedule inside Postgres. `pg_net` makes HTTP requests from SQL, asynchronously, which is how a job can reach code that lives outside the database.

## Job 1: the analytics rollup and purge

Pure SQL, so it runs entirely inside the database:

```sql
select cron.schedule(
  'rollup-and-purge-hits',
  '30 20 * * *',                                  -- 02:00 IST, in UTC
  $$
    insert into daily_summary (day, path, views, visitors)
    select day, path, count(*), count(distinct visitor)
    from hits where day = (current_date - 1)
    group by day, path
    on conflict (day, path) do update set views = excluded.views, visitors = excluded.visitors;

    delete from hits where day < current_date - 90;
  $$
);
```

Yesterday's views are aggregated into the summary table, and raw rows older than ninety days are removed, as the analytics post promised. `pg_cron` schedules are in UTC; the comment carries the IST time so nobody has to convert twice.

## Job 2: the Monday digest, via an HTTP call

The digest email needs the mail helper, which is TypeScript in the Next.js app. A route handler sends it, and the database calls the route:

```sql
select cron.schedule(
  'monday-digest',
  '0 3 * * 1',                                    -- 08:30 IST Monday
  $$
    select net.http_post(
      url := 'https://pareshsuthar.vercel.app/api/jobs/digest',
      headers := jsonb_build_object('Authorization', 'Bearer ' || (select value from private.secrets where key = 'JOBS_TOKEN'), 'Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
```

The token lives in a table in a `private` schema that only the `postgres` role can read; the route compares it with a constant-time check and does nothing without it. The route itself gathers the week's messages, feedback and top posts, sends one email, and records in a `job_runs` table that it ran, with counts, which the admin shows.

```ts
// app/api/jobs/digest/route.ts
export async function POST(req: Request) {
  if (!timingSafeEqual(req.headers.get("authorization") ?? "", `Bearer ${process.env.JOBS_TOKEN}`)) return new Response(null, { status: 401 });
  const summary = await buildWeeklySummary();
  await sendOwnerEmail({ subject: `Portfolio week: ${summary.messages} messages, ${summary.views} views`, html: render(summary) });
  await db.from("job_runs").insert({ job: "digest", ok: true, meta: summary });
  return Response.json({ ok: true });
}
```

## Job 3: the scheduled-post nudge

Blog posts publish themselves by date, as described in the scheduling post, but Vercel's ISR only re-renders when a request arrives after the revalidate window. A Monday 09:05 IST job fetches the blog index and the sitemap, which forces the regeneration and means the new post is live and indexed before anyone looks:

```sql
select cron.schedule('warm-blog', '35 3 * * 1', $$ select net.http_get('https://pareshsuthar.vercel.app/blog'), net.http_get('https://pareshsuthar.vercel.app/sitemap.xml'); $$);
```

## Seeing what ran

```sql
select jobid, jobname, schedule, active from cron.job;
select jobname, status, return_message, start_time from cron.job_run_details order by start_time desc limit 20;
select id, status_code, error_msg from net._http_response order by id desc limit 10;
```

`cron.job_run_details` is the log; `net._http_response` holds the HTTP results. A failed call shows up there with the status code. The job runs table in the app is the friendlier view, and the admin's jobs page reads it.

## Limits

`pg_cron` runs jobs on the database's own compute; a heavy job slows queries. Keep SQL jobs to seconds. `pg_net` is fire-and-forget: it does not wait for the response, so a job that must know whether the call succeeded should check `net._http_response` on its next run, or the called route should record its own result, which is what `job_runs` is for. The minimum interval is one minute. For anything heavier or more frequent, Vercel's own cron, which calls a route on a schedule, is the alternative on this stack; it was not needed here.

## Sources

- Supabase cron: [supabase.com/docs/guides/cron](https://supabase.com/docs/guides/cron)
- pg_cron: [github.com/citusdata/pg_cron](https://github.com/citusdata/pg_cron)
- pg_net: [supabase.com/docs/guides/database/extensions/pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
- Vercel cron jobs, the alternative: [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)
- Storing secrets for database functions, Supabase Vault: [supabase.com/docs/guides/database/vault](https://supabase.com/docs/guides/database/vault)
