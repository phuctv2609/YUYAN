import fs from 'node:fs';

const complete = JSON.parse(fs.readFileSync('data/complete-hsk-vocabulary/complete.json', 'utf8'));
const missingList = ["不肯","不利于","不难","不如说","不太","不一会儿","不予","车上","趁着","城里","打篮球","定为","放到","飞往","公益性","很难说","怀着","见过","难以想象","能不能","纽扣儿","说起来","送到","系领带","眼里","一番","有劲儿","这时候","着眼于","指着","致力于"];

const results = [];
for (const word of complete) {
  if (missingList.includes(word.simplified)) {
    results.push({
      simplified: word.simplified,
      traditional: word.forms?.[0]?.traditional || word.simplified,
      pinyin: word.forms?.[0]?.transcriptions?.pinyin,
      pos: word.pos,
      meanings_en: word.forms?.[0]?.meanings,
    });
  }
}

console.log(JSON.stringify(results, null, 2));
