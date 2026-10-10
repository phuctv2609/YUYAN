import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PINNED_COMMIT = 'c379d909e308343a247e51619f7839a2060a271c';
const RAW_URL = `https://raw.githubusercontent.com/ph0ngp/CVDICT/${PINNED_COMMIT}/CVDICT.u8`;
const TARGET_DIR = path.resolve('data/cvdict');
const TARGET_FILE = path.join(TARGET_DIR, 'CVDICT.u8');
const META_FILE = path.join(TARGET_DIR, 'cvdict_meta.json');

async function download() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  console.log(`Downloading CVDICT.u8 from pinned commit ${PINNED_COMMIT}...`);
  console.log(`URL: ${RAW_URL}`);

  const res = await fetch(RAW_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch CVDICT.u8: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  fs.writeFileSync(TARGET_FILE, buffer);

  const stats = fs.statSync(TARGET_FILE);
  console.log(`Saved CVDICT.u8: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`SHA-256: ${hash}`);

  const meta = {
    source: 'https://github.com/ph0ngp/CVDICT',
    author: 'Phong Phan',
    license: 'CC BY-SA 4.0',
    pinned_commit: PINNED_COMMIT,
    download_url: RAW_URL,
    downloaded_at: new Date().toISOString(),
    file_name: 'CVDICT.u8',
    file_size_bytes: stats.size,
    sha256: hash
  };

  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`Saved metadata to ${META_FILE}`);
}

download().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
