import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const editorialPath = path.join(root, "public/generated/knowledge/editorial-index.json");
const outputDirectory = path.join(root, "public/media/stories");
const manifestPath = path.join(root, "src/generated/story-image-cache.json");

async function executable(candidates) {
  for (const candidate of candidates) {
    if (!candidate.includes("/")) return candidate;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known installation path.
    }
  }
  throw new Error(`Required image utility not found: ${candidates.join(", ")}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0
      ? resolve({ stdout, stderr })
      : reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`)));
  });
}

function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 14);
}

function imageUrl(record) {
  return record.imageUrl || record.thumbnailUrl || "";
}

async function fetchImage(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "SGP-Platform image cache/1.0" },
        signal: AbortSignal.timeout(600_000)
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) throw new Error(`Unexpected content type: ${contentType}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`Unable to download ${url}: ${lastError instanceof Error ? lastError.message : lastError}`);
}

async function mapWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

const editorial = JSON.parse(await readFile(editorialPath, "utf8"));
const featured = editorial.stories.find((item) => item.imageUrl) || editorial.stories[0];
const selected = [
  { kind: "story", record: featured },
  ...editorial.stories.filter((item) => item !== featured).slice(0, 8).map((record) => ({ kind: "story", record })),
  ...editorial.videos.filter((item) => item.isVoice).slice(0, 8).map((record) => ({ kind: "voice", record })),
  ...editorial.photos.slice(0, 10).map((record) => ({ kind: "photo", record }))
].filter(({ record }) => imageUrl(record));

const uniqueImages = [];
const seenUrls = new Set();
for (const item of selected) {
  const url = imageUrl(item.record);
  if (seenUrls.has(url)) continue;
  seenUrls.add(url);
  uniqueImages.push({
    ...item,
    url,
    key: item.kind === "photo" ? `photo-${shortHash(url)}` : item.record.id.replace(/[^a-zA-Z0-9_-]+/g, "-")
  });
}

const cwebp = await executable(["/opt/homebrew/bin/cwebp", "/usr/local/bin/cwebp", "cwebp"]);
const magick = await executable(["/opt/homebrew/bin/magick", "/usr/local/bin/magick", "magick"]);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "sgp-story-images-"));
await mkdir(outputDirectory, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

try {
  const entries = await mapWithConcurrency(uniqueImages, 3, async (item, index) => {
    const cachedVariants = (await readdir(outputDirectory))
      .map((fileName) => fileName.match(new RegExp(`^${item.key}-(\\d+)\\.webp$`)))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .sort((a, b) => a - b);
    if (cachedVariants.length) {
      const largestVariant = cachedVariants.at(-1);
      const cachedPath = path.join(outputDirectory, `${item.key}-${largestVariant}.webp`);
      const { stdout } = await run(magick, ["identify", "-format", "%w %h", cachedPath]);
      const [width, height] = stdout.trim().split(/\s+/).map(Number);
      process.stdout.write(`Reused ${index + 1}/${uniqueImages.length}: ${item.key}\n`);
      return [item.url, {
        basePath: `/media/stories/${item.key}`,
        width,
        height,
        variants: cachedVariants
      }];
    }

    const inputPath = path.join(temporaryDirectory, `${index}-${shortHash(item.url)}`);
    await writeFile(inputPath, await fetchImage(item.url));
    const { stdout } = await run(magick, ["identify", "-format", "%w %h", inputPath]);
    const [width, height] = stdout.trim().split(/\s+/).map(Number);
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error(`Could not read dimensions for ${item.url}`);

    const desiredWidths = item.kind === "voice" ? [320, 480] : [320, 640, 1280];
    const variants = [...new Set(desiredWidths.map((candidate) => Math.min(candidate, width)))].sort((a, b) => a - b);
    for (const variantWidth of variants) {
      await run(cwebp, [
        "-quiet", "-q", "78", "-m", "6", "-sharp_yuv",
        "-resize", String(variantWidth), "0", "-metadata", "none",
        inputPath, "-o", path.join(outputDirectory, `${item.key}-${variantWidth}.webp`)
      ]);
    }

    process.stdout.write(`Cached ${index + 1}/${uniqueImages.length}: ${item.key}\n`);
    return [item.url, {
      basePath: `/media/stories/${item.key}`,
      width,
      height,
      variants
    }];
  });

  await writeFile(manifestPath, `${JSON.stringify({
    version: 1,
    scope: "initial-stories-page",
    images: Object.fromEntries(entries)
  }, null, 2)}\n`);
  console.log(`Cached ${entries.length} unique images used by the initial Stories view.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
