import type { ImgHTMLAttributes } from "react";
import storyImageCache from "../generated/story-image-cache.json";
import { publicAssetUrl } from "../lib/browser/assets";

type LocalImageAsset = {
  basePath?: string;
  width: number;
  height: number;
  variants: readonly number[];
};

const CACHED_STORY_IMAGES = Object.fromEntries(
  Object.entries(storyImageCache.images).map(([remoteUrl, asset]) => [
    remoteUrl,
    {
      basePath: asset.basePath,
      width: asset.width,
      height: asset.height,
      variants: asset.variants
    }
  ])
) satisfies Record<string, LocalImageAsset>;

const LOCAL_IMAGE_ASSETS: Record<string, LocalImageAsset> = {
  "/media/grants/botswana.jpg": { width: 1200, height: 800, variants: [320, 640, 960] },
  "/media/grants/china.jpg": { width: 1200, height: 776, variants: [320, 640, 960] },
  "/media/grants/cuba.jpg": { width: 1200, height: 902, variants: [320, 640, 960] },
  "/media/grants/fiji.jpg": { width: 1200, height: 800, variants: [320, 640, 960] },
  "/media/grants/jamaica.jpg": { width: 1200, height: 800, variants: [320, 640, 960] },
  "/media/grants/kenya.jpg": { width: 1200, height: 648, variants: [320, 640, 960] },
  "/media/grants/nepal.jpg": { width: 1200, height: 800, variants: [320, 640, 960] },
  "/media/grants/palau.jpg": { width: 1200, height: 787, variants: [320, 640, 960] },
  "/media/grants/saint-kitts-nevis.jpg": { width: 1200, height: 425, variants: [320, 640, 960] },
  "/media/grants/turkiye.jpg": { width: 1200, height: 902, variants: [320, 640, 960] },
  "/media/dashboard/preview.png": { width: 2560, height: 1440, variants: [640, 1280, 1920, 2560] },
  "/media/archive-browser/preview-kenya.png": { width: 1280, height: 720, variants: [640, 1280] },
  "/media/archive-browser/preview-china.png": { width: 1280, height: 720, variants: [640, 1280] },
  "/media/archive-browser/preview-default.png": { width: 1280, height: 720, variants: [640, 1280] },
  "/media/ai/preview.png": { width: 1280, height: 720, variants: [640, 1280] },
  ...CACHED_STORY_IMAGES
};

export type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "fetchPriority"> & {
  intrinsicSize?: boolean;
  src: string;
  priority?: boolean;
};

function variantPath(src: string, width: number, asset: LocalImageAsset) {
  const basePath = asset.basePath ?? src.replace(/\.[^/.]+$/, "");
  return publicAssetUrl(`${basePath}-${width}.webp`);
}

export function OptimizedImage({
  src,
  alt,
  intrinsicSize = true,
  priority = false,
  loading,
  decoding,
  sizes,
  width,
  height,
  ...imageProps
}: OptimizedImageProps) {
  const asset = LOCAL_IMAGE_ASSETS[src];

  if (!asset) {
    return <img
      {...imageProps}
      src={publicAssetUrl(src)}
      alt={alt}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding={decoding ?? "async"}
      sizes={sizes}
      width={intrinsicSize ? width : undefined}
      height={intrinsicSize ? height : undefined}
    />;
  }

  const largestVariant = asset.variants.at(-1)!;
  return <img
    {...imageProps}
    src={variantPath(src, largestVariant, asset)}
    alt={alt}
    srcSet={asset.variants.map((variantWidth) => `${variantPath(src, variantWidth, asset)} ${variantWidth}w`).join(", ")}
    sizes={sizes ?? "100vw"}
    width={intrinsicSize ? (width ?? asset.width) : undefined}
    height={intrinsicSize ? (height ?? asset.height) : undefined}
    loading={priority ? "eager" : (loading ?? "lazy")}
    decoding={decoding ?? "async"}
  />;
}
