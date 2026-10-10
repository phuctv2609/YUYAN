// scripts/download_xue_dict.mjs
import fs from 'fs';

async function download() {
  console.log('Fetching xue-hanzi dictionary.json...');
  const res = await fetch('https://raw.githubusercontent.com/phucbm/xue-hanzi/master/public/data/dictionary.json');
  if (!res.ok) {
    console.error('Fetch failed with status:', res.status);
    return;
  }
  const text = await res.text();
  fs.writeFileSync('scratch/xue_dict.json', text, 'utf-8');
  console.log('Saved scratch/xue_dict.json, bytes:', text.length);
}

download();
