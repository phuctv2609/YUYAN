const testCases = [
  "dì (chị em của mẹ)",
  "biến thể của 啊[a1]",
  "A!",
  "than ôi",
  "an ủi",
  "an toàn",
  "làm cho yên; làm cho an tâm"
];

const regex = /\b(the|to|and|of|in|for|with|is|a|an|or|by|on|at|from|as|be|that|this|it|also|used|when|about|see|between|under|over|into|after|before|like|than|more|other|some|such|only|can|will|may|have|has|had|not|no|all|any|each|every|both|few|much|many|most|several|one|two|first|second|new|old|good|high|long|great|little|own|other|right|big|even|back|still|way|well|down|now|here|there|how|why|what|which|who|where)\b/gi;

for (const text of testCases) {
  const matches = [...text.matchAll(regex)].map(m => m[0]);
  console.log(text, '=> matches:', matches);
}
