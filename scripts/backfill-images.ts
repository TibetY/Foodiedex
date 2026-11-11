/**
 * Backfill: run every restaurant photo saved BEFORE the save-time quality gate
 * through that same gate.
 *
 * New saves store a resized copy in our own bucket and refuse logos, tiny
 * images and banners (app/services/imageGate.server.ts). Rows saved earlier
 * still hotlink whatever og:image the restaurant's site exposed. For each such
 * row this script either
 *   - stores a resized copy and points the row at it (the image passed), or
 *   - clears the row's image (it is a logo / too small / wrong shape / unreadable).
 *
 * It is a DRY RUN unless you pass --apply: it then only prints what it would do
 * and writes the report. Images that could not be downloaded are left alone
 * even with --apply (the site may just be down), unless --drop-unreachable.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL = "https://<project>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<service role key>"   # never the anon key
 *   npx vite-node scripts/backfill-images.ts                 # dry run
 *   npx vite-node scripts/backfill-images.ts --apply         # write changes
 *
 * Options:
 *   --apply              write changes (default: dry run)
 *   --drop-unreachable   with --apply, also clear images that failed to download
 *   --limit <n>          only look at the first n candidate rows
 *   --out <file>         report path (default: backfill-images-report.csv)
 *
 * The report lists every row with its ORIGINAL image URL, so a run can be
 * reversed by hand. Rows already pointing into our bucket are skipped, which
 * also makes the script safe to re-run.
 */
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { gateImageFromUrl } from '../app/services/imageGate.server';

const BUCKET = 'restaurant-images';
const PAGE = 500;
const CONCURRENCY = 4;
/** Not a verdict on the image — the download itself failed. */
const TRANSIENT = new Set(['unreachable', 'too-big', 'unavailable']);

interface Row {
  id: string;
  name: string;
  image: string | null;
  added_by: string | null;
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const APPLY = flag('--apply');
const DROP_UNREACHABLE = flag('--drop-unreachable');
const LIMIT = Number(option('--limit')) || Infinity;
const OUT = option('--out') ?? 'backfill-images-report.csv';

const url = (process.env.SUPABASE_URL ?? '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const bucketPrefix = `${url}/storage/v1/object/public/${BUCKET}/`;

const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;

async function loadCandidates(): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; rows.length < LIMIT; from += PAGE) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, image, added_by')
      .not('image', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as Row[];
    rows.push(...page.filter((r) => r.image && !r.image.startsWith(bucketPrefix)));
    if (page.length < PAGE) break;
  }
  return rows.slice(0, LIMIT);
}

async function processRow(row: Row): Promise<{ action: string; detail: string; newImage: string }> {
  const original = row.image ?? '';
  const result = await gateImageFromUrl(original, { strict: true });

  if (result.ok) {
    const path = `${row.added_by ?? 'backfill'}/web-${result.hash}.webp`;
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    if (APPLY) {
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, result.data, { contentType: result.contentType, cacheControl: '31536000', upsert: true });
      if (up.error) return { action: 'error', detail: `upload: ${up.error.message}`, newImage: original };
      const upd = await supabase.from('restaurants').update({ image: publicUrl }).eq('id', row.id);
      if (upd.error) return { action: 'error', detail: `update: ${upd.error.message}`, newImage: original };
    }
    return { action: 'keep', detail: `${result.width}x${result.height}`, newImage: publicUrl };
  }

  if (TRANSIENT.has(result.reason) && !DROP_UNREACHABLE) {
    return { action: 'skip', detail: result.reason, newImage: original };
  }
  if (APPLY) {
    const upd = await supabase.from('restaurants').update({ image: null }).eq('id', row.id);
    if (upd.error) return { action: 'error', detail: `update: ${upd.error.message}`, newImage: original };
  }
  return { action: 'clear', detail: result.reason, newImage: '' };
}

async function main() {
  console.log(APPLY ? 'APPLYING changes.' : 'Dry run — nothing will be written. Pass --apply to write.');
  const rows = await loadCandidates();
  console.log(`${rows.length} restaurant(s) with an image outside our bucket.`);

  const lines = ['id,name,action,detail,original_image,new_image'];
  const tally: Record<string, number> = {};
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < rows.length) {
        const row = rows[next++];
        let outcome: Awaited<ReturnType<typeof processRow>>;
        try {
          outcome = await processRow(row);
        } catch (error) {
          outcome = { action: 'error', detail: String(error), newImage: row.image ?? '' };
        }
        tally[outcome.action] = (tally[outcome.action] ?? 0) + 1;
        lines.push([row.id, row.name, outcome.action, outcome.detail, row.image ?? '', outcome.newImage].map(csv).join(','));
        console.log(`${outcome.action.padEnd(5)} ${outcome.detail.padEnd(12)} ${row.name}`);
      }
    })
  );

  writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(`\n${APPLY ? 'Done' : 'Would do'}: ${JSON.stringify(tally)}`);
  console.log(`Report: ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
