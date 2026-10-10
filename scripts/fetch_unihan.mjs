import fs from 'fs';
import https from 'https';
import path from 'path';

const outDir = 'scratch/unihan';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = [
  'kVietnamese.json',
  'kMandarin.json',
  'kDefinition.json',
  'kTotalStrokes.json',
  'kRSKangXi.json'
];

function download(file) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outDir, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[Cache Hit] ${file}`);
      return resolve();
    }
    const fileStream = fs.createWriteStream(dest);
    const url = `https://dahlia.github.io/unihan-json/12.1.0/${file}`;
    console.log(`Downloading ${url} ...`);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${file}, status: ${res.statusCode}`));
      }
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Saved ${file} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const f of files) {
    await download(f);
  }
  console.log('All Unihan files downloaded successfully!');
}

run().catch(console.error);
