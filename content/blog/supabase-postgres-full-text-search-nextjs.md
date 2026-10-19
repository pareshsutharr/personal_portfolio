---
title: "Full-text search in Supabase: a tsvector column, a GIN index, and a search box that ranks properly"
description: "Postgres has had real full-text search for twenty years, and Supabase exposes it directly. How this site's project and blog search works: a generated tsvector column weighted by field, a GIN index, websearch_to_tsquery for Google-style input, ranking with ts_rank, and prefix matching for search-as-you-type."
date: 2028-05-08T03:30:00Z
tags: [supabase, postgres, search, nextjs, sql]
keywords: [supabase full text search, postgres tsvector generated column, websearch_to_tsquery, postgres gin index search, next.js search supabase]
project: portfolio
image: /blog/stock/camera-1.webp
imageAlt: "Close-up of a camera with a long lens"
imageCredit: "Matthew Hamilton thatsmrbio"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Long-lens_camera_in_close-up_(Unsplash).jpg"
imageLicense: "CC0"
summary: "A generated tsvector column weighted by field, a GIN index, websearch_to_tsquery for natural input and ts_rank for ordering give Postgres search inside Supabase with no extra service; a prefix query powers search-as-you-type and pg_trgm catches typos."
faq:
  - q: "Why use a generated column for the tsvector?"
    a: "Postgres maintains it on every write, so there are no triggers or application code to keep in sync and it can never be stale."
  - q: "What is the difference between to_tsquery and websearch_to_tsquery?"
    a: "websearch_to_tsquery accepts what people type, including quotes and minus signs, and never throws on odd input; to_tsquery rejects stray operators."
  - q: "How do I get prefix matching for suggestions?"
    a: "Append :* to the last term with to_tsquery so attend matches attendance, after sanitising the input to letters, digits and spaces."
---

The last post looked at search for MongoDB apps, where the good options live outside the database. On Postgres the good option is inside it. This site's search across projects and posts is a few lines of SQL and a function the Next.js app calls through Supabase.

## The column

A generated column that Postgres maintains on every write, weighted so that a match in the title counts more than one in the body:

```sql
alter table projects add column fts tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'C')
) stored;

create index projects_fts_idx on projects using gin (fts);
```

`generated always ... stored` means no triggers and no application code keep it in sync; it cannot be stale. The `english` configuration stems words, so "deploying" matches "deploy". The GIN index makes lookups fast at any size this table will reach.

## The query

```sql
create or replace function search_projects(q text, max int default 10)
returns table (id uuid, slug text, title text, summary text, rank real)
language sql stable as $$
  select p.id, p.slug, p.title, p.summary, ts_rank(p.fts, query) as rank
  from projects p, websearch_to_tsquery('english', q) query
  where p.fts @@ query and p.status = 'published'
  order by rank desc, p.published_at desc
  limit max;
$$;
```

`websearch_to_tsquery` accepts what people actually type: `nginx pm2`, `"salary slip"`, `attendance -biometric`. It never throws on odd input, which `to_tsquery` does. `ts_rank` scores by weighted term frequency; the title weight makes a project named "Attendance" outrank one that mentions attendance in paragraph four.

A `stable` SQL function is inlined by the planner and callable through PostgREST as an RPC.

## From Next.js

```ts
const { data } = await supabase.rpc("search_projects", { q, max: 10 });
```

The search page is a server component reading `?q=` from the URL, so results are linkable and indexable, and the search box submits a plain form that works without JavaScript. The same function is exposed through row-level security: the `status = 'published'` check in the function matches the public read policy, so an anonymous caller cannot see drafts through search either.

## Search as you type

Full-text search matches whole lexemes, so "attend" does not find "attendance". For a live suggestions box, append a prefix marker to the last word:

```sql
create or replace function suggest_projects(q text)
returns table (slug text, title text) language sql stable as $$
  select slug, title from projects
  where fts @@ to_tsquery('english', regexp_replace(trim(q), '\s+', ' & ', 'g') || ':*')
    and status = 'published'
  order by ts_rank(fts, to_tsquery('english', regexp_replace(trim(q), '\s+', ' & ', 'g') || ':*')) desc
  limit 6;
$$;
```

`:*` on the last term turns it into a prefix match. Input is sanitised to letters, digits and spaces before this, because `to_tsquery` will reject stray operators. The suggestions box calls it debounced at 150 ms from a client component; the full results page uses the ranked function above.

## Highlighting

```sql
ts_headline('english', body, websearch_to_tsquery('english', q), 'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>')
```

Returns a snippet around the match with `<mark>` tags, which the results page renders inside a sanitised block. People scan snippets, not titles.

## Typos

Postgres full-text search is not typo tolerant on its own. The `pg_trgm` extension adds trigram similarity, which Supabase can enable, and a fallback query on `title % q` catches "deploymnet" when the full-text query returns nothing. For a site with a few hundred documents that is plenty; for a CRM with a sales floor, the Meilisearch setup from the previous post is still the better fit.

## Sources

- Postgres full-text search: [postgresql.org/docs/current/textsearch.html](https://www.postgresql.org/docs/current/textsearch.html)
- Generated columns: [postgresql.org/docs/current/ddl-generated-columns.html](https://www.postgresql.org/docs/current/ddl-generated-columns.html)
- `websearch_to_tsquery`: [postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-PARSING-QUERIES](https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-PARSING-QUERIES)
- Supabase full-text search guide: [supabase.com/docs/guides/database/full-text-search](https://supabase.com/docs/guides/database/full-text-search)
- `pg_trgm`: [postgresql.org/docs/current/pgtrgm.html](https://www.postgresql.org/docs/current/pgtrgm.html)
