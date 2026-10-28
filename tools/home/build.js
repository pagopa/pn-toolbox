/**
 * Costruisce il sito in `_site/`:
 *
 *   1. per ogni cartella di `tools/` con un `site-tool.json`:
 *      - se c'è un `package.json`, esegue `npm ci` e `npm run build`;
 *      - copia la sua `public/` in `_site/tools/<cartella>/`;
 *   2. genera la home, `_site/index.html`, con una card per tool.
 *
 * Solo moduli di Node: la home non ha dipendenze npm.
 *
 *   node tools/home/build.js
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = dirname(fileURLToPath(import.meta.url));
const TOOLS = resolve(HOME, "..");
const SITE = resolve(TOOLS, "../_site");

// =============================================================================
// Tool
// =============================================================================

async function readMetadata(name, dir) {
  const metadata = JSON.parse(await readFile(resolve(dir, "site-tool.json"), "utf8"));
  if (typeof metadata.name !== "string" || typeof metadata.description !== "string") {
    throw new Error(`${name}/site-tool.json: servono "name" e "description" come stringhe`);
  }
  return { name: metadata.name, description: metadata.description, path: name };
}

function npm(args, cwd) {
  console.log(`  npm ${args.join(" ")}`);
  execFileSync("npm", args, { cwd, stdio: "inherit" });
}

async function buildTool(name) {
  const dir = resolve(TOOLS, name);
  const metadata = await readMetadata(name, dir);

  if (existsSync(resolve(dir, "package.json"))) {
    npm(["ci"], dir);
    npm(["run", "build"], dir);
  }

  const output = resolve(dir, "public");
  if (!existsSync(resolve(output, "index.html"))) {
    throw new Error(`${name}: manca public/index.html`);
  }
  await cp(output, resolve(SITE, "tools", name), { recursive: true });
  return metadata;
}

// =============================================================================
// Home
// =============================================================================

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function card({ name, description, path }) {
  return `
        <a href="./tools/${encodeURIComponent(path)}/"
           class="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200
                  bg-white px-6 py-5 shadow-sm transition hover:-translate-y-0.5
                  hover:border-blue-300 hover:shadow-lg">
          <span>
            <strong class="block text-base font-semibold text-slate-900">${escapeHtml(name)}</strong>
            <span class="mt-1 block text-sm text-slate-500">${escapeHtml(description)}</span>
          </span>
          <span class="text-2xl text-brand transition group-hover:translate-x-1" aria-hidden="true">→</span>
        </a>`;
}

async function buildHome(tools) {
  const template = await readFile(resolve(HOME, "index.html"), "utf8");
  if (!template.includes("<!-- TOOL_CARDS -->")) {
    throw new Error("tools/home/index.html: manca il segnaposto <!-- TOOL_CARDS -->");
  }
  const sorted = [...tools].sort((a, b) => a.name.localeCompare(b.name, "it"));
  await writeFile(resolve(SITE, "index.html"),
                  template.replace("<!-- TOOL_CARDS -->", sorted.map(card).join("")));
}

// =============================================================================
// Avvio
// =============================================================================

await rm(SITE, { recursive: true, force: true });
await mkdir(resolve(SITE, "tools"), { recursive: true });

const tools = [];
const folders = (await readdir(TOOLS, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "home")
  .map((entry) => entry.name)
  .sort();

for (const name of folders) {
  if (!existsSync(resolve(TOOLS, name, "site-tool.json"))) {
    console.log(`– ${name}: nessun site-tool.json, saltato`);
    continue;
  }
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(`${name}: il nome della cartella finisce nell'URL, usa solo lettere, cifre, . _ -`);
  }
  console.log(`▸ ${name}`);
  tools.push(await buildTool(name));
}

await buildHome(tools);
// Con il deploy da Actions Jekyll non gira; il file lo esclude anche se si
// pubblicasse `_site/` da un branch.
await writeFile(resolve(SITE, ".nojekyll"), "");

console.log(`\n✓ _site/ pronto: home e ${tools.length} tool`);
