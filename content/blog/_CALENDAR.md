# Blog calendar

Posts publish on Mondays at 09:00 IST. A file in this folder with a `date` in the future
is invisible on the site until that date passes, then it appears on its own (pages
refresh hourly). Files starting with `_` are ignored by the site.

To publish a post: write `content/blog/<slug>.md` with the frontmatter used by the
existing posts, set `date` to a Monday at `03:30:00Z`, commit and push. Nothing else.

## Scheduled (written)

| Date       | Slug                                                     |
| ---------- | -------------------------------------------------------- |
| 2026-10-19 | deploy-nodejs-app-linux-vps-nginx-pm2-ssl                |
| 2026-10-26 | jwt-role-based-access-control-express                    |
| 2026-11-02 | fix-slow-mongodb-queries-nodejs-api                      |
| 2026-11-09 | react-hydration-error-prefers-reduced-motion             |
| 2026-11-16 | react-web-app-to-android-ios-capacitor                   |
| 2026-11-23 | realtime-chat-mern-socketio                              |
| 2026-11-30 | nextjs-supabase-small-business-site-rls-server-actions   |
| 2026-12-07 | sebi-broker-website-compliance-disclosures-admin         |

## Planned (to write, in batches)

Each should come from something actually built or fixed, with code and primary sources.

| Date       | Working title                                                                 | Keyword target                          |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| 2026-12-14 | Technical SEO for a Next.js site on a Vercel subdomain (what moved the needle)| next.js seo vercel                      |
| 2026-12-21 | Smooth scrolling with Lenis and Motion without wrecking performance            | lenis react smooth scroll               |
| 2026-12-28 | A splash screen in Next.js that hands off to the nav logo                      | next.js splash screen animation         |
| 2027-01-04 | Nginx multi-server setup: public site, client portal, back office, API         | nginx multiple apps one server          |
| 2027-01-11 | Zero-downtime deploys on one VPS with PM2 reload and a health check            | pm2 reload zero downtime                |
| 2027-01-18 | Building an HRMS attendance calendar in React (and the timezone bugs)          | react attendance calendar               |
| 2027-01-25 | Salary slip PDFs from Node.js: templates, fonts and Indian number formatting   | node generate pdf salary slip           |
| 2027-02-01 | Rate limiting an Express API behind Nginx: trust proxy, buckets, 429s          | express rate limit nginx                |
| 2027-02-08 | Google OAuth plus JWT in a MERN app without losing the session                 | google oauth express jwt                |
| 2027-02-15 | Location search in MongoDB with 2dsphere indexes (Just Rent It)                | mongodb geospatial query near           |
| 2027-02-22 | Image uploads in Next.js: resizing, WebP, and not trusting the client          | next.js image upload resize             |
| 2027-03-01 | A lead desk in a back office: statuses, assignment, and not losing enquiries   | crm lead management build               |
| 2027-03-08 | Building an IPO dashboard: data sources, caching, and showing stale honestly   | ipo dashboard react                     |
| 2027-03-15 | Next.js ISR for a CMS-driven site: revalidate, tags, and what to cache         | next.js isr revalidate cms              |
| 2027-03-22 | Accessibility audit of a finance site: the twelve fixes that mattered          | website accessibility audit india       |
| 2027-03-29 | Firebase push notifications from Node.js: tokens, topics, and dead devices     | firebase admin push notifications node  |
| 2027-04-05 | A 3D product hero with Three.js in a corporate site, kept under 300 KB         | three.js next.js hero                   |
| 2027-04-12 | WhatsApp enquiry buttons that actually convert (wa.me, prefilled text, UTMs)   | whatsapp click to chat website          |
| 2027-04-19 | Structured data that shows up: Person, Service, FAQ and testing them           | schema.org faq json-ld next.js          |
| 2027-04-26 | Taking over a PHP codebase: the first week checklist                           | legacy php project takeover             |
| 2027-05-03 | Keeping secrets out of git on a one-person project                             | env secrets management small project    |
| 2027-05-10 | Email from a side project: Gmail SMTP with an app password, honestly           | nodemailer gmail app password           |
| 2027-05-17 | A contact form that bots ignore: honeypot, fill time, rate limits              | contact form spam protection            |
| 2027-05-24 | MongoDB backups on a VPS: mongodump, cron, and restoring once a month          | mongodb backup cron vps                 |
| 2027-05-31 | Logging that helps at 2 am: PM2 logs, request ids, and one grep               | node logging pm2                        |
| 2027-06-07 | Indian number and date formatting in JavaScript (lakhs, crores, IST)           | javascript indian number format         |
| 2027-06-14 | Cursor pagination in MongoDB and React: infinite lists that stay fast          | mongodb cursor pagination react         |
| 2027-06-21 | Role changes that take effect now: short tokens and a deny list                | jwt revoke token                        |
| 2027-06-28 | Deploying a React Native or Capacitor app update without a store release       | capacitor live update                   |
| 2027-07-05 | Supabase RLS mistakes I made and how the advisor caught them                   | supabase rls best practices             |
| 2027-07-12 | From Vercel subdomain to custom domain: DNS, redirects, Search Console         | vercel custom domain seo                |
| 2027-07-19 | Core Web Vitals on a motion-heavy site: what Lighthouse flagged and the fixes  | core web vitals animation               |
| 2027-07-26 | Org chart in React: tree data, SVG lines, export to PDF                        | react org chart component               |
| 2027-08-02 | Expense claims workflow: states, approvals, and audit trails                   | approval workflow design                |
| 2027-08-09 | Biometric attendance integration: polling a device API without losing punches  | biometric device api integration        |
| 2027-08-16 | Multi-tenant or not: how I decided for an HRMS                                 | multi tenant saas architecture          |
| 2027-08-23 | Testing a Node API without a test database: fixtures and in-memory Mongo       | mongodb memory server jest              |
| 2027-08-30 | The feedback widget: shipping a small feature end to end in an afternoon       | website feedback widget react           |
| 2027-09-06 | Sitemaps for CMS content: dynamic routes, lastmod, and scheduled posts         | next.js dynamic sitemap                 |
| 2027-09-13 | Markdown blog in Next.js with scheduled publishing and no database             | next.js markdown blog scheduled posts   |
| 2027-09-20 | CORS for a Capacitor app: origins, cookies, and the preflight that failed      | capacitor cors                          |
| 2027-09-27 | Monitoring a VPS for free: uptime checks, disk alerts, and PM2 restarts        | vps monitoring free                     |
| 2027-10-04 | One year of a portfolio blog: what ranked, what didn't, in numbers             | developer blog seo results              |
| 2027-10-11 | Year two plan                                                                  |                                         |
