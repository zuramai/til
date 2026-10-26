#!/usr/bin/env node
// Generates spaced-repetition quiz decks (data/quiz/<slug>.json) from TIL posts.
//
// Usage (from the repo root):
//   node scripts/quiz/generate.mjs [--force] [--only slug1,slug2] [--dry-run] [--import <dir>]
//
// Env: QUIZ_LLM_BASE_URL (default https://api.openai.com/v1), QUIZ_LLM_MODEL,
//      QUIZ_LLM_API_KEY, QUIZ_CONCURRENCY (default 4).
// --import <dir> reads {"cards":[...]} from <dir>/<slug>.json instead of calling the LLM.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const PROMPT_VERSION = 1;
const DATA_DIR = "data/quiz";
const PROMPT_PATH = "scripts/quiz/prompt.md";
const MIN_TEXT_LENGTH = 150;
const MAX_CARDS = 20;
const MAX_ATTEMPTS = 4;
const TYPES = new Set([
  "recall", "cloze", "mcq", "odd_one_out", "myth_or_fact",
  "sequence", "explain", "scenario", "riddle",
]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

class AuthError extends Error {}
class RetryableError extends Error {}

function parseArgs(argv) {
  const opts = { force: false, only: null, dryRun: false, importDir: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") opts.force = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--only" || arg === "--import") {
      const value = argv[++i];
      if (!value) usage(`${arg} needs a value`);
      if (arg === "--only") opts.only = new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
      else opts.importDir = value;
    } else usage(`Unknown argument: ${arg}`);
  }
  return opts;
}

function usage(message) {
  console.error(message);
  console.error("Usage: node scripts/quiz/generate.mjs [--force] [--only slug1,slug2] [--dry-run] [--import <dir>]");
  process.exit(2);
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

function splitFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return { frontMatter: "", body: raw };
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) return { frontMatter: "", body: raw };
  return {
    frontMatter: lines.slice(1, end).join("\n"),
    body: lines.slice(end + 1).join("\n").trim(),
  };
}

function parseTitle(frontMatter, slug) {
  const match = frontMatter.match(/^title:\s*(.+)$/m);
  if (!match) return slug;
  const value = match[1].trim();
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

function visibleTextLength(body) {
  return body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

async function discoverPosts() {
  const out = execFileSync("git", ["ls-files", "-z", "--", "content/*/index.md"], { encoding: "utf8" });
  const posts = [];
  for (const file of out.split("\0").filter(Boolean)) {
    const slug = path.basename(path.dirname(file));
    if (slug === "quiz") continue;
    const raw = await readFile(file);
    const text = raw.toString("utf8");
    const { frontMatter, body } = splitFrontMatter(text);
    if (/^draft:\s*true\s*$/m.test(frontMatter)) continue;
    posts.push({
      slug,
      title: parseTitle(frontMatter, slug),
      url: `/${slug}/`,
      body,
      sourceHash: sha256(raw),
      tooShort: visibleTextLength(body) < MIN_TEXT_LENGTH,
    });
  }
  return posts.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function readExistingHash(slug) {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, `${slug}.json`), "utf8")).sourceHash ?? null;
  } catch {
    return null;
  }
}

async function listDeckSlugs() {
  try {
    return (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  } catch {
    return [];
  }
}

// ---------- validation ----------

const isText = (value, max) => typeof value === "string" && value.trim() !== "" && value.trim().length <= max;

function textList(value, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  if (!value.every((v) => typeof v === "string" && v.trim() !== "")) return null;
  const list = value.map((v) => v.trim());
  return new Set(list).size === list.length ? list : null;
}

// Returns a normalized card or a string describing why the card is invalid.
function validateCard(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "card is not an object";
  if (!TYPES.has(raw.type)) return `unknown type ${JSON.stringify(raw.type)}`;
  if (!DIFFICULTIES.has(raw.difficulty)) return `bad difficulty ${JSON.stringify(raw.difficulty)}`;
  if (!isText(raw.prompt, 400)) return `${raw.type}: prompt missing or longer than 400 chars`;
  if (!isText(raw.answer, 600)) return `${raw.type}: answer missing or longer than 600 chars`;
  const hasExplanation = raw.explanation != null && raw.explanation !== "";
  if (hasExplanation && !isText(raw.explanation, 400)) return `${raw.type}: explanation not a string of at most 400 chars`;

  const card = { type: raw.type, difficulty: raw.difficulty, prompt: raw.prompt.trim() };
  switch (raw.type) {
    case "cloze":
      if (card.prompt.split("____").length !== 2) return "cloze: prompt must contain ____ exactly once";
      break;
    case "mcq":
    case "odd_one_out": {
      const options = textList(raw.options, 3, 5);
      if (!options) return `${raw.type}: options must be 3-5 unique non-empty strings`;
      if (!Number.isInteger(raw.correct) || raw.correct < 0 || raw.correct >= options.length) {
        return `${raw.type}: correct must be an index into options`;
      }
      card.options = options;
      card.correct = raw.correct;
      break;
    }
    case "myth_or_fact":
      if (typeof raw.correct !== "boolean") return "myth_or_fact: correct must be a boolean";
      card.correct = raw.correct;
      break;
    case "sequence": {
      const items = textList(raw.items, 3, 6);
      if (!items) return "sequence: items must be 3-6 unique non-empty strings";
      card.items = items;
      break;
    }
  }
  card.answer = raw.answer.trim();
  if (hasExplanation) card.explanation = raw.explanation.trim();
  return card;
}

// Shared by the LLM and import paths. Throws RetryableError when the input is unusable.
function buildDeck(post, rawCards, model) {
  if (!Array.isArray(rawCards)) throw new RetryableError('reply has no "cards" array');
  const cards = [];
  const ids = new Set();
  const drops = [];
  for (const raw of rawCards) {
    const result = validateCard(raw);
    if (typeof result === "string") {
      drops.push(result);
      continue;
    }
    const id = `${post.slug}-${sha256(`${result.type}\n${result.prompt}`).slice(0, 10)}`;
    if (ids.has(id)) {
      drops.push(`duplicate card ${id}`);
      continue;
    }
    ids.add(id);
    cards.push({ id, ...result });
  }
  if (rawCards.length > 0 && cards.length === 0) {
    throw new RetryableError(`all ${rawCards.length} cards invalid (${drops[0]})`);
  }
  for (const reason of drops) console.log(`drop ${post.slug}: ${reason}`);
  if (cards.length > MAX_CARDS) console.log(`drop ${post.slug}: ${cards.length - MAX_CARDS} cards over the ${MAX_CARDS}-card limit`);
  return deckJson(post, model, cards.slice(0, MAX_CARDS));
}

function deckJson(post, model, cards, skipReason) {
  const deck = {
    slug: post.slug,
    title: post.title,
    url: post.url,
    sourceHash: post.sourceHash,
    promptVersion: PROMPT_VERSION,
    model,
    generatedAt: new Date().toISOString(),
  };
  if (skipReason) deck.skipReason = skipReason;
  deck.cards = cards;
  return deck;
}

async function writeDeck(deck) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, `${deck.slug}.json`), `${JSON.stringify(deck, null, 2)}\n`);
}

// ---------- LLM ----------

let sendResponseFormat = true;

function parseCardsReply(content) {
  if (typeof content !== "string") throw new RetryableError("reply has no message content");
  const text = content.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new RetryableError(`reply is not JSON: ${err.message}`);
  }
  return parsed?.cards;
}

async function requestCards(config, post) {
  const userMessage = `Post title: ${post.title}\nPost URL: ${post.url}\n\nPost markdown:\n${post.body}`;
  for (;;) {
    const body = {
      model: config.model,
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: userMessage },
      ],
    };
    if (sendResponseFormat) body.response_format = { type: "json_object" };
    let res;
    try {
      res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new RetryableError(`network error: ${err.cause?.message ?? err.message}`);
    }
    if (res.status === 401 || res.status === 403) throw new AuthError(String(res.status));
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 400 && sendResponseFormat && text.includes("response_format")) {
        sendResponseFormat = false;
        continue;
      }
      const message = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      if (res.status === 429 || res.status >= 500) {
        const error = new RetryableError(message);
        const retryAfter = Number(res.headers.get("retry-after"));
        if (Number.isFinite(retryAfter) && retryAfter >= 0) error.retryAfterMs = retryAfter * 1000;
        throw error;
      }
      throw new Error(message);
    }
    let json;
    try {
      json = await res.json();
    } catch (err) {
      throw new RetryableError(`response is not JSON: ${err.message}`);
    }
    return parseCardsReply(json?.choices?.[0]?.message?.content);
  }
}

async function generateWithLlm(config, post) {
  for (let attempt = 1; ; attempt++) {
    try {
      return buildDeck(post, await requestCards(config, post), config.model);
    } catch (err) {
      if (!(err instanceof RetryableError) || attempt >= MAX_ATTEMPTS) throw err;
      const delay = err.retryAfterMs ?? 2000 * 2 ** (attempt - 1);
      console.log(`retry ${post.slug}: ${err.message} (attempt ${attempt + 1}/${MAX_ATTEMPTS} in ${delay / 1000}s)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function generateFromImport(dir, post) {
  const file = path.join(dir, `${post.slug}.json`);
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    throw new Error(`missing ${file}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${file} is not JSON: ${err.message}`);
  }
  return buildDeck(post, parsed?.cards, "agent-authored");
}

// ---------- main ----------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const needsLlm = !opts.dryRun && !opts.importDir;
  const config = {
    baseUrl: (process.env.QUIZ_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.QUIZ_LLM_MODEL,
    apiKey: process.env.QUIZ_LLM_API_KEY,
    concurrency: Math.max(1, Number.parseInt(process.env.QUIZ_CONCURRENCY || "4", 10) || 4),
  };
  if (needsLlm) {
    if (!config.model) {
      console.error("QUIZ_LLM_MODEL is not set");
      process.exit(2);
    }
    if (!config.apiKey) {
      console.error("QUIZ_LLM_API_KEY is not set");
      process.exit(2);
    }
    config.systemPrompt = await readFile(PROMPT_PATH, "utf8");
  }
  const model = opts.importDir ? "agent-authored" : config.model;

  const posts = await discoverPosts();
  const eligible = new Set(posts.map((p) => p.slug));
  const counts = { generated: 0, unchanged: 0, "too-short": 0, removed: 0, failed: 0 };

  if (opts.only) {
    for (const slug of opts.only) {
      if (!eligible.has(slug)) {
        console.log(`fail ${slug}: not a tracked, non-draft post`);
        counts.failed++;
      }
    }
  }

  const plan = [];
  for (const post of posts) {
    if (opts.only && !opts.only.has(post.slug)) continue;
    const forced = opts.force || opts.only !== null;
    if (!forced && (await readExistingHash(post.slug)) === post.sourceHash) {
      counts.unchanged++;
      if (opts.dryRun) console.log(`unchanged ${post.slug}`);
      continue;
    }
    plan.push({ post, action: post.tooShort ? "too-short" : "generate" });
  }

  const removals = opts.only ? [] : (await listDeckSlugs()).filter((slug) => !eligible.has(slug));

  if (opts.dryRun) {
    for (const { post, action } of plan) {
      console.log(`${action} ${post.slug}`);
      if (action === "too-short") counts["too-short"]++;
      else counts.generated++;
    }
    for (const slug of removals) console.log(`remove ${slug}`);
    counts.removed = removals.length;
    printSummary(counts, true);
    return;
  }

  for (const slug of removals) {
    await unlink(path.join(DATA_DIR, `${slug}.json`));
    console.log(`removed ${slug}`);
    counts.removed++;
  }

  let done = 0;
  const total = plan.length;
  const queue = [...plan];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const { post, action } = item;
      try {
        let deck;
        if (action === "too-short") deck = deckJson(post, model, [], "too-short");
        else if (opts.importDir) deck = await generateFromImport(opts.importDir, post);
        else deck = await generateWithLlm(config, post);
        await writeDeck(deck);
        counts[action === "too-short" ? "too-short" : "generated"]++;
        console.log(`[${++done}/${total}] ${post.slug}: ${deck.cards.length} cards${action === "too-short" ? " (too short)" : ""}`);
      } catch (err) {
        if (err instanceof AuthError) {
          console.error(`Authentication failed (${err.message}): check QUIZ_LLM_API_KEY / QUIZ_LLM_BASE_URL`);
          process.exit(1);
        }
        counts.failed++;
        console.log(`[${++done}/${total}] fail ${post.slug}: ${err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(config.concurrency, total) }, worker));

  printSummary(counts, false);
  process.exitCode = counts.failed > 0 ? 1 : 0;
}

function printSummary(counts, dryRun) {
  const line = `generated ${counts.generated}, unchanged ${counts.unchanged}, too-short ${counts["too-short"]}, removed ${counts.removed}, failed ${counts.failed}`;
  console.log(dryRun ? `dry run: ${line}` : line);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
