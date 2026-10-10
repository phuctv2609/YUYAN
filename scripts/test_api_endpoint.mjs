import fetch from 'node:fs';

async function testEndpoint() {
  console.log('--- TEST 1: Requesting cached word "学习" ---');
  const res1 = await globalThis.fetch('http://127.0.0.1:5173/api/ai/word-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word: '学习',
      pinyin: 'xué xí',
      pos: ['v', 'n'],
      hskFramework: 'hsk2',
      hskLevel: 1
    })
  });
  console.log('Status:', res1.status);
  const data1 = await res1.json();
  console.log('Result 1 (cached):', {
    success: data1.success,
    cached: data1.cached,
    word: data1.data?.word,
    coreMeaning: data1.data?.coreMeaning,
    sentencesCount: data1.data?.exampleSentences?.length,
    sampleSentence: data1.data?.exampleSentences?.[0]
  });

  console.log('\n--- TEST 2: Requesting uncached word "草莓" without GEMINI_API_KEY ---');
  const res2 = await globalThis.fetch('http://127.0.0.1:5173/api/ai/word-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word: '草莓',
      pinyin: 'cǎo méi',
      pos: ['n']
    })
  });
  console.log('Status:', res2.status);
  const data2 = await res2.json();
  console.log('Result 2 (uncached/unconfigured):', data2);
}

testEndpoint().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
