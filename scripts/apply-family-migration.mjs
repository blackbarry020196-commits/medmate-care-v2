#!/usr/bin/env node
/**
 * Applies supabase/migrations/002_family_dashboard.sql via Supabase Management API.
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-family-migration.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "njagaleltosuqoazmokx";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../supabase/migrations/002_family_dashboard.sql");
const query = readFileSync(sqlPath, "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Migration failed (HTTP ${res.status}):`);
  console.error(body);
  process.exit(1);
}

console.log("Migration applied successfully.");
if (body && body !== "[]") console.log(body);
