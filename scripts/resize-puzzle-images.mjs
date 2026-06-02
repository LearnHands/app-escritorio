// Rename + center-crop + resize all puzzle images to 600×600 JPEG ~85q
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '..', 'src', 'assets', 'puzzle');

// Identified name mapping  (original → new slug)
const RENAMES = {
  'colibri.png':                                                          'colibri',
  '158891179_10523966.jpg':                                               'unicornio',
  '33955278_8126204.jpg':                                                 'formas',
  '34737387_8213442.jpg':                                                 'tucanes',
  '427157464_e86a51ad-0c77-45d7-9677-b64b577b2205.jpg':                  'gatito',
  '427262724_e8b35c5e-d87b-465b-8d25-dff3ccc45440.jpg':                  'abeja',
  '427570195_4afe0ba7-a75b-4a5e-973e-26a652ffcbfa.jpg':                  'astronauta',
  '427570201_a688c8a7-6933-4b88-b728-736cebc651f8.jpg':                  'helado_espacial',
  '4436638_2368036.jpg':                                                  'aventurero',
  '45199245_9085742.jpg':                                                 'montanas',
};

const SIZE = 600;

for (const [original, slug] of Object.entries(RENAMES)) {
  const srcPath  = path.join(DIR, original);
  const destPath = path.join(DIR, `${slug}.jpg`);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠  Not found: ${original}`);
    continue;
  }

  try {
    const meta = await sharp(srcPath).metadata();
    const side = Math.min(meta.width, meta.height);   // square side
    const left = Math.floor((meta.width  - side) / 2);
    const top  = Math.floor((meta.height - side) / 2);

    await sharp(srcPath)
      .extract({ left, top, width: side, height: side }) // center-crop to square
      .resize(SIZE, SIZE)
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(destPath);

    const origKB = Math.round(fs.statSync(srcPath).size / 1024);
    const newKB  = Math.round(fs.statSync(destPath).size / 1024);
    console.log(`✓  ${original.padEnd(60)} → ${slug}.jpg   (${origKB} KB → ${newKB} KB)`);

    // Remove original only if it differs from destination
    if (srcPath !== destPath) fs.unlinkSync(srcPath);
  } catch (err) {
    console.error(`✗  ${original}: ${err.message}`);
  }
}

console.log('\nDone. All images in src/assets/puzzle/ are now 600×600 JPEG.');
