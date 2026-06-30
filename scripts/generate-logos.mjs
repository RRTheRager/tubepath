import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const sourceDir = path.join(publicDir, "branding", "source");

const ICON_SRC = path.join(sourceDir, "logo-icon-source.png");
const FULL_SRC = path.join(sourceDir, "logo-full-source.png");

/** Pixels at or below this on all channels become transparent. */
const BLACK_THRESHOLD = 42;

async function stripNearBlack(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  }).png();
}

async function trimPng(pipeline) {
  return pipeline.trim({ threshold: 10 }).png();
}

/** Fit logo inside a square canvas with transparent padding (no black bars). */
async function squareIcon(input, size, inset = 0.06) {
  const meta = await sharp(input).metadata();
  const inner = Math.round(size * (1 - inset * 2));
  const aspect = (meta.width ?? 1) / (meta.height ?? 1);
  const fitW = aspect >= 1 ? inner : Math.round(inner * aspect);
  const fitH = aspect >= 1 ? Math.round(inner / aspect) : inner;

  const logo = await sharp(input)
    .resize(fitW, fitH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png();
}

async function main() {
  const appDir = path.join(root, "src", "app");

  const iconTrimmed = await trimPng(await stripNearBlack(ICON_SRC));
  const fullTrimmed = await trimPng(await stripNearBlack(FULL_SRC));

  const iconBuffer = await iconTrimmed.toBuffer();
  const fullBuffer = await fullTrimmed.toBuffer();

  await sharp(iconBuffer).toFile(path.join(publicDir, "logo-icon.png"));
  await sharp(fullBuffer).toFile(path.join(publicDir, "logo-full.png"));

  const fullMeta = await sharp(fullBuffer).metadata();

  const faviconSizes = [
    { name: "favicon-32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ];

  for (const { name, size } of faviconSizes) {
    const out = await squareIcon(iconBuffer, size);
    await out.toFile(path.join(publicDir, name));
  }

  await squareIcon(iconBuffer, 512).then((img) =>
    img.toFile(path.join(appDir, "icon.png"))
  );

  const iconMeta = await sharp(iconBuffer).metadata();
  console.log("Generated logos:");
  console.log("  icon:", iconMeta.width, "x", iconMeta.height);
  console.log("  full:", fullMeta.width, "x", fullMeta.height);
  console.log(
    "  aspect:",
    ((fullMeta.width ?? 1) / (fullMeta.height ?? 1)).toFixed(4)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
