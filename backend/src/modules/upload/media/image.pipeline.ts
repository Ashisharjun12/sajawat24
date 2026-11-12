export type ImageCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type ResizeOutput = {
    width?: number;
    height?: number;
};

export type ImagePipelineResult = {
    buffer: Buffer;
    width: number;
    height: number;
};

function normalizeCrop(crop: ImageCrop, meta: { width?: number; height?: number }): ImageCrop {
    const maxW = meta.width ?? crop.width;
    const maxH = meta.height ?? crop.height;
    const x = Math.max(0, Math.floor(crop.x));
    const y = Math.max(0, Math.floor(crop.y));
    const width = Math.min(Math.floor(crop.width), maxW - x);
    const height = Math.min(Math.floor(crop.height), maxH - y);
    if (width <= 0 || height <= 0) {
        throw new Error("invalid crop dimensions");
    }
    return { x, y, width, height };
}

export async function runImagePipeline(
    input: Buffer,
    crop?: ImageCrop,
    output?: ResizeOutput,
): Promise<ImagePipelineResult> {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(input).rotate();
    if (crop) {
        const meta = await sharp(input).metadata();
        const normalized = normalizeCrop(crop, meta);
        pipeline = pipeline.extract({
            left: normalized.x,
            top: normalized.y,
            width: normalized.width,
            height: normalized.height,
        });
    }
    const resize =
        output?.width || output?.height
            ? {
                  width: output.width,
                  height: output.height,
                  fit: "inside" as const,
                  withoutEnlargement: true,
              }
            : { width: 1600, withoutEnlargement: true };
    const buffer = await pipeline.resize(resize).webp({ quality: 80 }).toBuffer();
    const outMeta = await sharp(buffer).metadata();
    return {
        buffer,
        width: outMeta.width ?? 0,
        height: outMeta.height ?? 0,
    };
}

/** Category bar icons are shown at 28–32px, so 192px covers 3x+ screens with headroom. */
export const ICON_OUTPUT_SIZE = 192;

/**
 * Square, transparent icon raster. SVGs are rendered by sharp (librsvg) at a density that gives
 * at least 2x the output size, so small viewBoxes (e.g. 24x24) stay sharp. Raw SVG is never stored.
 */
export async function runIconPipeline(input: Buffer, mimeType: string): Promise<ImagePipelineResult> {
    const sharp = (await import("sharp")).default;
    let density: number | undefined;
    if (mimeType === "image/svg+xml") {
        const meta = await sharp(input).metadata();
        const longest = Math.max(meta.width ?? 0, meta.height ?? 0) || ICON_OUTPUT_SIZE;
        density = Math.min(2400, Math.max(72, Math.ceil((72 * ICON_OUTPUT_SIZE * 2) / longest)));
    }
    const buffer = await sharp(input, density ? { density } : undefined)
        .rotate()
        .resize({
            width: ICON_OUTPUT_SIZE,
            height: ICON_OUTPUT_SIZE,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 90, alphaQuality: 100 })
        .toBuffer();
    return { buffer, width: ICON_OUTPUT_SIZE, height: ICON_OUTPUT_SIZE };
}

export function optimizedKeyFromOriginal(key: string): string {
    return `${key.replace(/\.[^.]+$/, "")}.webp`;
}
