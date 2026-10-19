# Blog calendar

Posts publish on Mondays at 09:00 IST. A file in this folder with a `date` in the future
is invisible on the site until that date passes, then it appears on its own (pages
refresh hourly). Files starting with `_` are ignored by the site.

To publish a post: write `content/blog/<slug>.md` with the frontmatter used by the
existing posts, set `date` to a Monday at `03:30:00Z`, commit and push. Nothing else.

To check the schedule: the admin at `/admin/blog` lists every post as Scheduled or
Published with its date, each with its photo. Cover images are generated at `/blog/<slug>/cover`.

Every post has a stock photo (`image`, `imageAlt`, `imageCredit`, `imageCreditUrl`, `imageLicense`
in its frontmatter). The photos are CC0, public domain or CC BY/BY-SA from Wikimedia Commons,
cropped to 1280x720 WebP in `public/blog/stock/` with a 1200x630 JPEG twin used by the cover
renderer; `public/blog/stock/credits.json` lists every photo's source and licence.

Every post also has `summary` (a two-sentence direct answer shown as "In short" and used as the
schema abstract) and `faq` (three question/answer pairs rendered at the end with FAQPage schema).
Posts are also served as plain Markdown at `/blog/<slug>.md`, listed in `/llms.txt` and
`/llms-full.txt`, grouped on `/blog/tag/<tag>` hub pages, and submitted to IndexNow by the Monday
cron. New posts need all of these fields: image*, summary, faq.

## Schedule (all written, 104 posts, 2026-10-19 to 2028-10-09)

| #   | Date       | Slug                                                    | Title                                                                                                                                 |
| --- | ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-10-19 | deploy-nodejs-app-linux-vps-nginx-pm2-ssl               | Deploying a Node.js app on a Linux VPS with Nginx, PM2 and SSL                                                                        |
| 2   | 2026-10-26 | jwt-role-based-access-control-express                   | JWT and role-based access in Express, done the boring way                                                                             |
| 3   | 2026-11-02 | fix-slow-mongodb-queries-nodejs-api                     | Fixing slow MongoDB queries in a Node.js API                                                                                          |
| 4   | 2026-11-09 | react-hydration-error-prefers-reduced-motion            | The React hydration error that only hit phones with Reduce Motion on                                                                  |
| 5   | 2026-11-16 | react-web-app-to-android-ios-capacitor                  | Turning a React web app into an Android and iOS app with Capacitor                                                                    |
| 6   | 2026-11-23 | realtime-chat-mern-socketio                             | Real-time chat in a MERN app with Socket.IO: rooms, auth and reconnects                                                               |
| 7   | 2026-11-30 | nextjs-supabase-small-business-site-rls-server-actions  | Next.js and Supabase for a small business site: RLS, server actions and image uploads                                                 |
| 8   | 2026-12-07 | sebi-broker-website-compliance-disclosures-admin        | What a stock broker's website has to keep publishing, and how I built it into the admin                                               |
| 9   | 2026-12-14 | technical-seo-nextjs-vercel-subdomain                   | Technical SEO for a Next.js site on a Vercel subdomain: what actually moved the needle                                                |
| 10  | 2026-12-21 | lenis-motion-smooth-scroll-performance                  | Smooth scrolling with Lenis and Motion without wrecking performance                                                                   |
| 11  | 2026-12-28 | nextjs-splash-screen-handoff-nav-logo                   | A splash screen in Next.js that hands off to the nav logo                                                                             |
| 12  | 2027-01-04 | nginx-multiple-apps-one-server                          | One Nginx, four apps: public site, client portal, back office and API on separate hosts                                               |
| 13  | 2027-01-11 | pm2-reload-zero-downtime-health-check                   | Zero-downtime deploys on one VPS with PM2 reload and a health check                                                                   |
| 14  | 2027-01-18 | react-attendance-calendar-timezone-bugs                 | Building an HRMS attendance calendar in React, and the timezone bugs that came with it                                                |
| 15  | 2027-01-25 | node-generate-pdf-salary-slip                           | Salary slip PDFs from Node.js: templates, fonts and Indian number formatting                                                          |
| 16  | 2027-02-01 | express-rate-limiting-behind-nginx                      | Rate limiting an Express API behind Nginx: trust proxy, buckets and honest 429s                                                       |
| 17  | 2027-02-08 | google-oauth-express-jwt-session                        | Google sign-in plus JWT in a MERN app without losing the session                                                                      |
| 18  | 2027-02-15 | mongodb-geospatial-location-search                      | Location search in MongoDB with 2dsphere indexes: listings near you                                                                   |
| 19  | 2027-02-22 | nextjs-image-upload-resize-webp                         | Image uploads in Next.js: resizing, WebP, and not trusting the client                                                                 |
| 20  | 2027-03-01 | crm-lead-desk-not-losing-enquiries                      | A lead desk in a back office: statuses, assignment, and not losing enquiries                                                          |
| 21  | 2027-03-08 | ipo-dashboard-data-caching-stale                        | Building an IPO dashboard: data sources, caching, and showing stale honestly                                                          |
| 22  | 2027-03-15 | nextjs-isr-cms-driven-site                              | Next.js ISR for a CMS-driven site: revalidate, tags, and what to cache                                                                |
| 23  | 2027-03-22 | accessibility-audit-finance-site-fixes                  | Accessibility audit of a finance site: the twelve fixes that mattered                                                                 |
| 24  | 2027-03-29 | firebase-push-notifications-nodejs                      | Firebase push notifications from Node.js: tokens, topics, and dead devices                                                            |
| 25  | 2027-04-05 | threejs-3d-product-hero-under-300kb                     | A 3D product hero with Three.js on a corporate site, kept under 300 KB                                                                |
| 26  | 2027-04-12 | whatsapp-click-to-chat-buttons-that-convert             | WhatsApp enquiry buttons that actually convert: wa.me, prefilled text, and knowing where they came from                               |
| 27  | 2027-04-19 | structured-data-person-service-faq-testing              | Structured data that shows up: Person, Service, FAQ, and how to test them                                                             |
| 28  | 2027-04-26 | taking-over-php-codebase-first-week                     | Taking over a PHP codebase: the first-week checklist                                                                                  |
| 29  | 2027-05-03 | secrets-out-of-git-solo-project                         | Keeping secrets out of git on a one-person project                                                                                    |
| 30  | 2027-05-10 | nodemailer-gmail-app-password-honestly                  | Email from a side project: Gmail SMTP with an app password, honestly                                                                  |
| 31  | 2027-05-17 | contact-form-spam-protection-honeypot                   | A contact form that bots ignore: honeypot, fill time, and rate limits                                                                 |
| 32  | 2027-05-24 | mongodb-backups-vps-cron-restore                        | MongoDB backups on a VPS: mongodump, cron, off-site copies, and restoring once a month                                                |
| 33  | 2027-05-31 | node-logging-pm2-request-ids                            | Logging that helps at 2 am: PM2 logs, request ids, and one grep                                                                       |
| 34  | 2027-06-07 | javascript-indian-number-date-formatting                | Indian number and date formatting in JavaScript: lakhs, crores, and IST                                                               |
| 35  | 2027-06-14 | cursor-pagination-mongodb-react-infinite-list           | Cursor pagination in MongoDB and React: infinite lists that stay fast                                                                 |
| 36  | 2027-06-21 | jwt-revoke-role-change-deny-list                        | Role changes that take effect now: short tokens, a deny list, and a version number                                                    |
| 37  | 2027-06-28 | capacitor-app-update-without-store-release              | Updating a Capacitor app without a store release                                                                                      |
| 38  | 2027-07-05 | supabase-rls-mistakes-advisor                           | Supabase RLS mistakes I made, and how the advisor caught them                                                                         |
| 39  | 2027-07-12 | vercel-subdomain-to-custom-domain-seo                   | From a Vercel subdomain to a custom domain: DNS, redirects, Search Console, and not losing what you had                               |
| 40  | 2027-07-19 | core-web-vitals-motion-heavy-site                       | Core Web Vitals on a motion-heavy site: what Lighthouse flagged and what I did                                                        |
| 41  | 2027-07-26 | react-org-chart-tree-svg-export                         | An org chart in React: tree data, SVG connectors, and export to PDF                                                                   |
| 42  | 2027-08-02 | approval-workflow-states-audit-trail                    | Expense claims and leave requests: states, approvals, and an audit trail that holds up                                                |
| 43  | 2027-08-09 | biometric-attendance-device-integration                 | Biometric attendance integration: polling a device API without losing punches                                                         |
| 44  | 2027-08-16 | multi-tenant-or-not-hrms-decision                       | Multi-tenant or not: how I decided for an HRMS, and what it cost                                                                      |
| 45  | 2027-08-23 | testing-node-api-in-memory-mongodb                      | Testing a Node API without a test database: fixtures and in-memory MongoDB                                                            |
| 46  | 2027-08-30 | feedback-widget-small-feature-end-to-end                | The feedback widget: shipping a small feature end to end in an afternoon                                                              |
| 47  | 2027-09-06 | nextjs-dynamic-sitemap-cms-scheduled                    | Sitemaps for CMS content: dynamic routes, lastmod, and posts that are not live yet                                                    |
| 48  | 2027-09-13 | markdown-blog-nextjs-scheduled-publishing               | A Markdown blog in Next.js with scheduled publishing and no database                                                                  |
| 49  | 2027-09-20 | capacitor-cors-origins-cookies-preflight                | CORS for a Capacitor app: origins, cookies, and the preflight that failed                                                             |
| 50  | 2027-09-27 | vps-monitoring-free-uptime-disk-pm2                     | Monitoring a VPS for free: uptime checks, disk alerts, and PM2 restarts you hear about                                                |
| 51  | 2027-10-04 | express-error-handling-no-stack-traces                  | Express error handling that does not leak stack traces                                                                                |
| 52  | 2027-10-11 | zod-validation-express-nextjs                           | Input validation with Zod in Express and Next.js: one schema, both sides                                                              |
| 53  | 2027-10-18 | presigned-uploads-s3-compatible-storage-node            | File uploads that skip your server: presigned URLs to S3-compatible storage from Node                                                 |
| 54  | 2027-10-25 | cron-jobs-vps-node-cron-vs-systemd-timers               | Scheduled jobs on a VPS: node-cron inside the app, or systemd timers outside it                                                       |
| 55  | 2027-11-01 | transactional-email-deliverability-spf-dkim-dmarc       | Transactional email that reaches the inbox: SPF, DKIM, DMARC, and what to do with bounces                                             |
| 56  | 2027-11-08 | mongodb-schema-design-hrms-embed-vs-reference           | MongoDB schema design for an HRMS: what to embed, what to reference, and what I changed later                                         |
| 57  | 2027-11-15 | audit-logs-who-changed-what-mongodb                     | Audit logs in a MongoDB app: who changed what, when, and from where                                                                   |
| 58  | 2027-11-22 | nextjs-protected-routes-proxy-layout-server-checks      | Protecting routes in the Next.js App Router: the edge check, the layout check, and the one that actually matters                      |
| 59  | 2027-11-29 | tailwind-v4-design-tokens-theme-dark-mode               | Tailwind v4 design tokens: one @theme block, dark mode, and no config file                                                            |
| 60  | 2027-12-06 | accessible-forms-labels-errors-focus-react              | Accessible forms in React: labels, errors, focus and the keyboard, tested with a screen reader                                        |
| 61  | 2027-12-13 | dockerize-node-api-small-image-healthcheck              | Docker for a Node.js API: a small image, a non-root user, and a health check that means something                                     |
| 62  | 2027-12-20 | github-actions-ci-node-typecheck-lint-test-deploy       | A GitHub Actions pipeline for a Node project: typecheck, lint, test, build, then deploy to the VPS                                    |
| 63  | 2027-12-27 | staging-environment-on-one-vps                          | A staging environment on the same VPS: separate ports, databases and domains, one server                                              |
| 64  | 2028-01-03 | mongodb-index-builds-without-downtime                   | Adding an index to a busy MongoDB collection without taking the app down                                                              |
| 65  | 2028-01-10 | webhooks-idempotency-retries-node                       | Receiving webhooks correctly: verify, respond fast, process once                                                                      |
| 66  | 2028-01-17 | payment-gateway-integration-node-razorpay-pattern       | Integrating a payment gateway in a Node app: the order-first pattern that survives refreshes, retries and refunds                     |
| 67  | 2028-01-24 | react-query-vs-server-components-when-each              | Server components or React Query? Where each one earns its place in a Next.js app                                                     |
| 68  | 2028-01-31 | optimistic-ui-rollback-react-server-actions             | Optimistic UI that rolls back honestly: useOptimistic, server actions, and the cases where you should not                             |
| 69  | 2028-02-07 | excel-export-node-exceljs-streaming                     | Excel exports from Node that do not hang the server: ExcelJS, streaming, and the Indian number format                                 |
| 70  | 2028-02-14 | pdf-generation-node-puppeteer-vs-pdfkit                 | Generating PDFs in Node: Puppeteer for documents that look like web pages, pdfkit for everything else                                 |
| 71  | 2028-02-21 | intl-formatting-dates-numbers-currency-india            | Formatting dates, numbers and rupees with Intl: no libraries, no hydration mismatches                                                 |
| 72  | 2028-02-28 | redis-caching-node-what-to-cache-invalidate             | Redis caching in a Node API: what to cache, for how long, and how to invalidate without lying                                         |
| 73  | 2028-03-06 | nginx-caching-static-assets-api-responses               | Nginx caching in front of a Node app: static assets forever, API responses for seconds, HTML never                                    |
| 74  | 2028-03-13 | security-headers-csp-hsts-node-nextjs                   | Security headers for a Node or Next.js app: the six that matter, with the CSP that did not break the site                             |
| 75  | 2028-03-20 | owasp-top-10-mern-app-checklist                         | The OWASP Top 10, applied to a MERN app: where each one actually shows up and the fix I ship                                          |
| 76  | 2028-03-27 | password-reset-flow-node-done-right                     | A password reset flow that is actually safe: tokens, hashing, expiry and the message that gives nothing away                          |
| 77  | 2028-04-03 | two-factor-otp-totp-node-admin-accounts                 | Two-factor authentication for admin accounts: TOTP with an authenticator app, and SMS OTP for the people who need it                  |
| 78  | 2028-04-10 | sessions-vs-jwt-node-what-i-use-now                     | Sessions or JWTs? What I use now for web apps, for mobile apps, and for the one case where both are wrong                             |
| 79  | 2028-04-17 | mongodb-migrations-node-versioned-scripts               | Schema migrations for MongoDB: versioned scripts, a migrations collection, and how to change a field on a million documents           |
| 80  | 2028-04-24 | soft-deletes-mongodb-mongoose-restore-purge             | Soft deletes in MongoDB: a deletedAt field, a query filter that is impossible to forget, and a purge job                              |
| 81  | 2028-05-01 | search-in-a-crm-mongodb-text-vs-atlas-vs-meilisearch    | Search in a CRM: MongoDB text index, Atlas Search, or a separate search engine? What each one cost and found                          |
| 82  | 2028-05-08 | supabase-postgres-full-text-search-nextjs               | Full-text search in Supabase: a tsvector column, a GIN index, and a search box that ranks properly                                    |
| 83  | 2028-05-15 | supabase-realtime-admin-inbox-live-updates              | A live admin inbox with Supabase Realtime: new messages appear without refreshing, and the badge stays right                          |
| 84  | 2028-05-22 | nextjs-app-router-caching-explained-with-this-site      | Next.js App Router caching, explained with this site: what is static, what revalidates, and what is always fresh                      |
| 85  | 2028-05-29 | image-pipeline-sharp-webp-avif-responsive               | An image pipeline with sharp: WebP and AVIF, responsive sizes, blur placeholders, and 90% smaller pages                               |
| 86  | 2028-06-05 | lighthouse-100-nextjs-what-actually-moved-the-score     | Getting this site to a Lighthouse 100 on mobile: the eight changes that moved the score, and the two that did nothing                 |
| 87  | 2028-06-12 | analytics-without-cookies-privacy-friendly-nextjs       | Analytics without cookies: what this site measures, how, and why there is no consent banner                                           |
| 88  | 2028-06-19 | writing-a-case-study-that-gets-you-hired                | Writing a project case study that gets you hired: the structure I use for every project on this site                                  |
| 89  | 2028-06-26 | estimating-freelance-projects-without-losing-money      | Estimating freelance development work without losing money: the method I settled on after getting it wrong three times                |
| 90  | 2028-07-03 | freelance-contracts-scope-payments-india                | The contract I use for freelance development work in India: the clauses that have mattered and the ones that never came up            |
| 91  | 2028-07-10 | handing-over-a-project-documentation-access-runbook     | Handing over a project so it survives without you: the runbook, the access checklist, and the two-hour walkthrough                    |
| 92  | 2028-07-17 | error-tracking-sentry-node-nextjs-what-to-alert-on      | Error tracking with Sentry in Node and Next.js: setup, the noise filter, and the three alerts that are worth a notification           |
| 93  | 2028-07-24 | feature-flags-without-a-service-node-nextjs             | Feature flags without a flag service: a table, a cached read, and a rollout you can undo in ten seconds                               |
| 94  | 2028-07-31 | login-brute-force-protection-lockout-vs-delay           | Stopping login brute force without locking out your own users: progressive delays, per-account counters and a notification            |
| 95  | 2028-08-07 | kanban-board-react-dnd-kit-ordering-persistence         | Building the CRM's lead board: drag and drop with dnd-kit, fractional ordering, and persistence that survives two people moving cards |
| 96  | 2028-08-14 | command-palette-admin-cmdk-search-actions               | A command palette for the admin: Ctrl+K to find any record or run any action, built with cmdk                                         |
| 97  | 2028-08-21 | testing-animated-react-components-motion-reduced-motion | Testing animated React components: what to assert, what to skip, and how the splash screen got a test                                 |
| 98  | 2028-08-28 | playwright-e2e-critical-flows-small-team                | Playwright end-to-end tests for the five flows that must never break, and nothing else                                                |
| 99  | 2028-09-04 | node-memory-leak-pm2-heap-snapshots                     | Finding a Node.js memory leak in production: PM2 restarts were hiding it, heap snapshots found it                                     |
| 100 | 2028-09-11 | disaster-recovery-drill-rebuild-vps-from-backups        | The disaster recovery drill: rebuilding the whole platform on a fresh VPS from backups, timed                                         |
| 101 | 2028-09-18 | supabase-pg-cron-scheduled-jobs-portfolio               | Scheduled jobs inside Supabase with pg_cron: the analytics purge, the weekly digest, and no server to run them on                     |
| 102 | 2028-09-25 | openapi-docs-from-zod-schemas-express                   | API documentation that cannot go stale: OpenAPI generated from the Zod schemas the routes already use                                 |
| 103 | 2028-10-02 | two-years-of-weekly-posts-what-ranked-what-did-not      | Two years of a weekly post: what ranked, what brought work, and what I would not write again                                          |
| 104 | 2028-10-09 | growth-avenues-platform-next-two-years-plan             | The Growth Avenues platform after two years: what runs, what it costs, and the plan for the next two                                  |
