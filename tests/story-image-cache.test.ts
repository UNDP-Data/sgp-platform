import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type EditorialRecord = {
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isVoice?: boolean;
};

type CachedImage = {
  basePath: string;
  width: number;
  height: number;
  variants: number[];
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const editorial = JSON.parse(readFileSync(path.join(root, "public/generated/knowledge/editorial-index.json"), "utf8")) as {
  stories: EditorialRecord[];
  videos: EditorialRecord[];
  photos: EditorialRecord[];
};
const cache = JSON.parse(readFileSync(path.join(root, "src/generated/story-image-cache.json"), "utf8")) as {
  images: Record<string, CachedImage>;
};

function imageUrl(record: EditorialRecord) {
  return record.imageUrl || record.thumbnailUrl || "";
}

describe("Stories image cache", () => {
  it("covers every image rendered by the initial Stories view", () => {
    const featured = editorial.stories.find((item) => item.imageUrl) || editorial.stories[0];
    const visibleRecords = [
      featured,
      ...editorial.stories.filter((item) => item !== featured).slice(0, 8),
      ...editorial.videos.filter((item) => item.isVoice).slice(0, 8),
      ...editorial.photos.slice(0, 10)
    ];
    const visibleUrls = [...new Set(visibleRecords.map(imageUrl).filter(Boolean))];

    expect(visibleUrls).toHaveLength(26);
    expect(visibleUrls.filter((url) => !cache.images[url])).toEqual([]);
  });

  it("ships valid responsive files at bounded sizes", () => {
    for (const asset of Object.values(cache.images)) {
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.variants).toEqual([...asset.variants].sort((left, right) => left - right));
      for (const width of asset.variants) {
        const filePath = path.join(root, "public", `${asset.basePath}-${width}.webp`);
        expect(existsSync(filePath), filePath).toBe(true);
        expect(statSync(filePath).size, filePath).toBeLessThan(400 * 1024);
      }
    }
  });
});
