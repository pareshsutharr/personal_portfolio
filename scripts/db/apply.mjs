#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql (and optionally supabase/seed.sql) to a
 * hosted Supabase project through the Management API, and records each
 * migration in supabase_migrations.schema_migrations so `supabase db push`
 * stays in sync later.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxx node scripts/db/apply.mjs [--seed] [--reset]
 *
 * --seed   also runs supabase/seed.sql after migrations
 * --reset  drops and recreates the public schema first (DESTRUCTIVE)
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
if (!token || !ref) {
  console.error("Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.");
  process.exit(1);
}
const args = new Set(process.argv.slice(2));
const base = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function query(sql) {
  const res = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const root = path.resolve(process.cwd(), "supabase");

if (args.has("--reset")) {
  console.log("Resetting public schema and storage policies…");
  await query(`
    drop schema if exists public cascade;
    create schema public;
    grant usage on schema public to postgres, anon, authenticated, service_role;
    grant all on schema public to postgres, service_role;
    drop table if exists supabase_migrations.schema_migrations;
    delete from storage.objects where bucket_id = 'media';
    delete from storage.buckets where id = 'media';
    do $$ declare p record; begin
      for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'media_%' loop
        execute format('drop policy if exists %I on storage.objects', p.policyname);
      end loop;
    end $$;
  `);
}

await query(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key,
    statements text[],
    name text
  );
`);

const applied = new Set(
  (await query("select version from supabase_migrations.schema_migrations")).map((r) => r.version),
);

const dir = path.join(root, "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  const version = file.split("_")[0];
  const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");
  if (applied.has(version)) {
    console.log(`skip   ${file}`);
    continue;
  }
  const sql = await readFile(path.join(dir, file), "utf8");
  process.stdout.write(`apply  ${file} … `);
  await query(sql);
  await query(
    `insert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${name.replace(/'/g, "''")}')`,
  );
  console.log("ok");
}

if (args.has("--seed")) {
  const seed = await readFile(path.join(root, "seed.sql"), "utf8");
  process.stdout.write("seed   supabase/seed.sql … ");
  await query(seed);
  console.log("ok");
}
console.log("done");
