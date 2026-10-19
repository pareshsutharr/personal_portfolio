---
title: "Finding a Node.js memory leak in production: PM2 restarts were hiding it, heap snapshots found it"
description: "The API restarted every eleven hours and nobody noticed because PM2 restarted it cleanly. The memory graph was a sawtooth. Finding the leak took an afternoon once I knew the method: confirm it is a leak, reproduce it under load, take two heap snapshots, compare, follow the retainers. It was an event listener added per request. The steps, the commands, and the four leaks I now check for first."
date: 2028-09-04T03:30:00Z
tags: [nodejs, performance, debugging, pm2, operations]
keywords: [node.js memory leak production, heap snapshot node compare, pm2 memory restart leak, node --inspect heap snapshot, event listener leak node]
project: growth-avenues
image: /blog/stock/backup-2.webp
imageAlt: "Hard disk drives opened side by side"
imageCredit: "Shams948"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Hard_drive_07.jpg"
imageLicense: "CC0"
---

PM2's `max_memory_restart` is a safety net and a blindfold. The API had been restarting every eleven hours for a month before the monitoring dashboard from an earlier post showed a sawtooth and I went looking. Nothing had failed. Memory just climbed until PM2 killed and restarted the process. That is a leak, and the method for finding one is the same every time.

## 1. Confirm it is a leak, not a plateau

Node's heap grows until the garbage collector decides to run; a process that climbs to 300 MB and stays there is not leaking. A leak climbs without bound. `pm2 monit` and the `process.memoryUsage()` values logged every minute by the health endpoint showed `heapUsed` rising 20 MB an hour with flat traffic and never falling. That is a leak.

## 2. Reproduce it locally under load

```bash
NODE_OPTIONS="--inspect=9229" node dist/server.js &
autocannon -c 20 -d 120 http://localhost:4000/api/clients?page=1
```

Twenty connections for two minutes against the busiest endpoint. `heapUsed` climbed the same way locally. If it had not, the next step would have been trying other endpoints and the jobs, one at a time, until one reproduced it.

## 3. Two snapshots, compared

Open `chrome://inspect`, attach to the process, Memory tab. Take a heap snapshot. Run the load for a minute. Force a garbage collection with the bin icon. Take a second snapshot. Select the second and set the view to "Comparison" against the first.

Sorted by size delta, the top row was `(closure)` with thousands of new instances, and under it, `Function` objects whose retainer chain led to `EventEmitter._events` on a single `MongoClient` connection pool object. Thousands of listeners on one emitter, growing with requests.

The code:

```js
// in a request-scoped helper
mongoose.connection.on("disconnected", () => log.warn("mongo disconnected"));
```

It was meant to run once at startup. A refactor had moved it into a function called per request. Each request added a listener; none were removed; the closures retained the request context. Node even warns about this with `MaxListenersExceededWarning`, which had been scrolling past in the logs under the normal noise.

## 4. Fix, and prove it

The listener moved to startup. Same load test, `heapUsed` rose during the run and fell back after GC. Deployed, the sawtooth became a flat line, and `max_memory_restart` has not fired since.

## Headless snapshots on a server

When the leak only appears in production, attach there without a browser:

```bash
kill -USR1 <pid>                    # enables the inspector on a running process
node -e "const i=require('inspector');..."   # or simpler:
node --heapsnapshot-signal=SIGUSR2 dist/server.js   # at startup; then:
kill -USR2 <pid>                    # writes Heap.<date>.heapsnapshot next to the process
```

Copy two snapshots to a laptop and load them into Chrome's Memory tab for the same comparison. Snapshots pause the process for a second or two and are the size of the heap on disk; take them off-peak.

## The four I check first now

1. **Listeners added per request** on long-lived emitters: connections, sockets, process. `emitter.listenerCount("x")` in the health endpoint catches it early.
2. **Module-level caches without bounds.** A `Map` used as a cache that is never pruned. Replace with an LRU with a max size.
3. **Closures captured by timers.** `setInterval` created per request and never cleared, holding the request's scope.
4. **Promise chains that never settle.** A `fetch` without a timeout to a dead host keeps its context alive forever. Every outbound call gets an `AbortSignal.timeout`.

## Clinic.js when snapshots are not enough

For leaks that only show after hours, `clinic heapprofiler` samples allocations over a long run and draws a flame graph of what allocated the memory that was never freed. It found the second leak, in the PDF worker, which was a Puppeteer page not closed on one error path.

## Keep the safety net, and alert on it

`max_memory_restart` stays. It turns a leak from an outage into a restart. The change is that a restart from it now sends a notification, because a safety net you cannot see firing is a blindfold.

## Sources

- Node.js memory diagnostics guide: [nodejs.org/en/learn/diagnostics/memory](https://nodejs.org/en/learn/diagnostics/memory)
- Chrome DevTools heap snapshot comparison: [developer.chrome.com/docs/devtools/memory-problems/heap-snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)
- `--heapsnapshot-signal`: [nodejs.org/api/cli.html#--heapsnapshot-signalsignal](https://nodejs.org/api/cli.html#--heapsnapshot-signalsignal)
- Clinic.js: [clinicjs.org/documentation](https://clinicjs.org/documentation/)
- autocannon: [github.com/mcollina/autocannon](https://github.com/mcollina/autocannon)
