import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ART_ROOT = path.join(ROOT, 'public', 'assets', 'art');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'assets', 'atlas');

const GROUPS = [
  {
    textureKey: 'junk-items',
    outputName: 'junk-items',
    cellWidth: 160,
    cellHeight: 160,
    columns: 8,
    sources: [{ directory: 'items', prefix: 'item' }],
  },
  {
    textureKey: 'junk-portraits',
    outputName: 'junk-portraits',
    cellWidth: 320,
    cellHeight: 240,
    columns: 4,
    sources: [
      { directory: 'heroes', prefix: 'hero' },
      { directory: 'bosses', prefix: 'boss' },
    ],
  },
];

await fs.mkdir(OUTPUT_ROOT, { recursive: true });

const reports = [];
for (const group of GROUPS) reports.push(await buildGroup(group));

const sourceBytes = reports.reduce((sum, report) => sum + report.sourceBytes, 0);
const generatedBytes = reports.reduce((sum, report) => sum + report.generatedBytes, 0);
const estimatedTextureBytes = reports.reduce((sum, report) => sum + report.estimatedTextureBytes, 0);
const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sourceRequestCount: reports.reduce((sum, entry) => sum + entry.frameCount, 0),
  runtimeAtlasRequestCount: reports.length,
  sourceBytes,
  generatedBytes,
  estimatedTextureBytes,
  atlases: reports,
};

await fs.writeFile(
  path.join(OUTPUT_ROOT, 'asset-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

console.log(
  `[assets] packed ${report.sourceRequestCount} SVG sources into ${report.runtimeAtlasRequestCount} atlases ` +
  `(${formatBytes(sourceBytes)} source → ${formatBytes(generatedBytes)} generated, ` +
  `${formatBytes(estimatedTextureBytes)} estimated RGBA texture memory)`,
);

async function buildGroup(group) {
  const entries = [];
  for (const source of group.sources) {
    const directory = path.join(ART_ROOT, source.directory);
    const names = (await fs.readdir(directory))
      .filter((name) => name.endsWith('.svg'))
      .sort((left, right) => left.localeCompare(right));
    for (const name of names) {
      const id = name.slice(0, -'.svg'.length);
      const filePath = path.join(directory, name);
      const svg = await fs.readFile(filePath, 'utf8');
      entries.push({
        frameKey: `${source.prefix}.${id}`,
        filePath,
        sourceBytes: Buffer.byteLength(svg),
        dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      });
    }
  }

  if (entries.length === 0) throw new Error(`No SVG sources found for ${group.textureKey}`);
  const rows = Math.ceil(entries.length / group.columns);
  const width = group.columns * group.cellWidth;
  const height = rows * group.cellHeight;
  const images = [];
  const frames = {};

  for (const [index, entry] of entries.entries()) {
    const column = index % group.columns;
    const row = Math.floor(index / group.columns);
    const x = column * group.cellWidth;
    const y = row * group.cellHeight;
    images.push(
      `  <image x="${x}" y="${y}" width="${group.cellWidth}" height="${group.cellHeight}" ` +
      `preserveAspectRatio="xMidYMid meet" href="${entry.dataUri}"/>`,
    );
    frames[entry.frameKey] = {
      frame: { x, y, w: group.cellWidth, h: group.cellHeight },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: group.cellWidth, h: group.cellHeight },
      sourceSize: { w: group.cellWidth, h: group.cellHeight },
    };
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...images,
    '</svg>',
    '',
  ].join('\n');
  const json = {
    frames,
    meta: {
      app: 'Game3 deterministic SVG atlas builder',
      version: '1.0',
      image: `${group.outputName}.svg`,
      format: 'RGBA8888',
      size: { w: width, h: height },
      scale: '1',
    },
  };

  const svgPath = path.join(OUTPUT_ROOT, `${group.outputName}.svg`);
  const jsonPath = path.join(OUTPUT_ROOT, `${group.outputName}.json`);
  await fs.writeFile(svgPath, svg, 'utf8');
  await fs.writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  const generatedBytes = Buffer.byteLength(svg) + Buffer.byteLength(JSON.stringify(json));
  const sourceBytes = entries.reduce((sum, entry) => sum + entry.sourceBytes, 0);
  return {
    textureKey: group.textureKey,
    frameCount: entries.length,
    width,
    height,
    cellWidth: group.cellWidth,
    cellHeight: group.cellHeight,
    maxSourceBytes: Math.max(...entries.map((entry) => entry.sourceBytes)),
    sourceBytes,
    generatedBytes,
    estimatedTextureBytes: width * height * 4,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
