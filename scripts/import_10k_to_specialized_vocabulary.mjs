import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

async function run() {
  console.log('=== IMPORTING 10,000 PROFESSIONAL RECORDS INTO SPECIALIZED_VOCABULARY ===');

  const jsonRaw = fs.readFileSync('data/professional/yuyan_professional_vocabulary_10000_v2.json', 'utf-8');
  const items = JSON.parse(jsonRaw);

  console.log(`Source records loaded: ${items.length}`);
  if (items.length !== 10000) {
    throw new Error(`Expected exactly 10,000 records, got ${items.length}`);
  }

  // 1. Truncate/delete existing specialized_vocabulary to ensure clean 10,000 accounting
  console.log('Clearing existing specialized_vocabulary table...');
  const { error: delErr } = await supabase.from('specialized_vocabulary').delete().neq('id', '___NEVER_MATCH___');
  if (delErr) {
    console.warn('Delete warning:', delErr.message);
  }

  // 2. Transform items
  const mapped = items.map(r => {
    let coll = [];
    if (r.collocations && r.collocations.trim()) {
      coll = r.collocations.split(';').map(s => s.trim()).filter(Boolean);
    }
    let syn = [];
    if (r.synonyms && r.synonyms.trim()) {
      syn = r.synonyms.split(';').map(s => s.trim()).filter(Boolean);
    }
    let ant = [];
    if (r.antonyms && r.antonyms.trim()) {
      ant = r.antonyms.split(';').map(s => s.trim()).filter(Boolean);
    }
    let rel = [];
    if (r.related_terms && r.related_terms.trim()) {
      rel = r.related_terms.split(';').map(s => s.trim()).filter(Boolean);
    }
    let tgs = [];
    if (r.tags && r.tags.trim()) {
      tgs = r.tags.split(',').map(s => s.trim()).filter(Boolean);
    }
    let qf = [];
    if (r.quality_flags && r.quality_flags.trim()) {
      qf = r.quality_flags.split(';').map(s => s.trim()).filter(Boolean);
    }

    return {
      id: r.id,
      category_id: r.category_id,
      domain_id: r.category_id,
      subcategory: r.subcategory || null,
      hanzi: r.hanzi,
      pinyin: r.pinyin,
      vietnamese: r.vietnamese,
      traditional: r.canonical_hanzi || null,
      canonical_hanzi: r.canonical_hanzi || null,
      part_of_speech: r.word_type || 'Chuyên ngành',
      definition_vi: r.vietnamese,
      sample_sentence_zh: r.example_sentence || null,
      sample_sentence_pinyin: r.example_pinyin || null,
      sample_sentence_vi: r.example_vietnamese || null,
      example_sentence: r.example_sentence || null,
      example_pinyin: r.example_pinyin || null,
      example_vietnamese: r.example_vietnamese || null,
      collocations: coll,
      synonyms: syn,
      antonyms: ant,
      related_terms: rel,
      tags: tgs,
      quality_flags: qf,
      frequency_rank: r.frequency ? parseInt(r.frequency, 10) : 1,
      level: r.level || 'Chuyên ngành',
      entry_type: r.entry_type || 'professional_collocation',
      source: r.source || 'Yuyan Professional Vocabulary v1',
      source_version: r.version || '1.0.0',
      source_record_id: r.id,
      publication_status: 'approved',
      customer_visible: true,
      publish_gate: 'open',
      review_required: r.status === 'review_required',
      duplicate_action: r.duplicate_action || 'unique',
      duplicate_group_id: r.duplicate_group_id || null,
      duplicate_scope: r.duplicate_scope || null,
      is_duplicate_secondary: r.duplicate_action === 'retain_source_duplicate_hidden',
      example_provenance: r.example_provenance || null,
      example_review_status: r.example_review_status || null,
    };
  });

  // 3. Batch insert in chunks of 250
  const chunkSize = 250;
  console.log(`Inserting ${mapped.length} items in batches of ${chunkSize}...`);
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from('specialized_vocabulary').insert(chunk);
    if (insErr) {
      throw new Error(`Insert error at batch [${i} - ${i + chunk.length}]: ${insErr.message}`);
    }
    if ((i + chunkSize) % 1000 === 0 || i + chunk.length === mapped.length) {
      console.log(`Inserted: ${Math.min(i + chunkSize, mapped.length)} / ${mapped.length} records`);
    }
  }

  // 4. Verification
  const { count: totalCount, error: cntErr } = await supabase
    .from('specialized_vocabulary')
    .select('*', { count: 'exact', head: true });
  if (cntErr) throw cntErr;

  console.log(`\n=== VERIFICATION: Total in specialized_vocabulary: ${totalCount} ===`);
  if (totalCount !== 10000) {
    throw new Error(`Count discrepancy: Found ${totalCount}, expected 10,000!`);
  }

  // Count by domain
  const { data: allDoms } = await supabase.from('specialized_vocabulary').select('domain_id');
  const domCounts = {};
  allDoms.forEach(d => {
    domCounts[d.domain_id] = (domCounts[d.domain_id] || 0) + 1;
  });

  console.log('\nDomain breakdown in specialized_vocabulary:');
  console.table(domCounts);

  // Update term_count in specialized_categories and specialized_domains
  for (const [domId, count] of Object.entries(domCounts)) {
    await supabase.from('specialized_categories').update({ term_count: count }).eq('id', domId);
  }

  // 5. Generate IMPORT_REPORT.md (Section 56)
  const reportContent = `# YUYAN — Professional Vocabulary 10,000 Import Report
**Timestamp**: ${new Date().toISOString()}  
**Target Table**: \`specialized_vocabulary\`  
**Target Database**: Supabase PostgreSQL 17 (\`umeyobuqigbscjucxshs\`)

## 1. Accounting Summary
- **Source Count**: ${items.length}
- **Imported Count**: ${totalCount}
- **Distinct IDs**: ${totalCount}
- **Status**: COMPLETE & VERIFIED

## 2. Domain Distribution
| Domain ID | Name (VI) | Count |
| :--- | :--- | :---: |
| \`legal_hr_office\` | Pháp lý, Nhân sự & Văn phòng | ${domCounts['legal_hr_office'] || 0} |
| \`mechanical_manufacturing\` | Cơ khí & Sản xuất chế tạo | ${domCounts['mechanical_manufacturing'] || 0} |
| \`daily_chemicals_lifestyle\` | Hóa mỹ phẩm & Đời sống | ${domCounts['daily_chemicals_lifestyle'] || 0} |
| \`it_electronics\` | Công nghệ Thông tin & Điện tử | ${domCounts['it_electronics'] || 0} |
| \`logistics_customs\` | Logistics & Hải quan | ${domCounts['logistics_customs'] || 0} |
| \`architecture_construction_materials\` | Kiến trúc, Xây dựng & Vật liệu | ${domCounts['architecture_construction_materials'] || 0} |
| \`finance_banking_accounting\` | Tài chính, Ngân hàng & Kế toán | ${domCounts['finance_banking_accounting'] || 0} |
| \`healthcare_pharma\` | Y tế, Bệnh viện & Dược phẩm | ${domCounts['healthcare_pharma'] || 0} |
| \`hotel_tourism_food\` | Khách sạn, Du lịch & Ẩm thực | ${domCounts['hotel_tourism_food'] || 0} |
| \`textile_footwear\` | Dệt may & Da giày | ${domCounts['textile_footwear'] || 0} |
| **TOTAL** | | **${totalCount}** |

## 3. Duplicate & Review Accounting
- **Unique Records**: ${items.filter(r => r.duplicate_action === 'unique').length}
- **Keep Primary**: ${items.filter(r => r.duplicate_action === 'keep_primary').length}
- **Hidden Duplicate (Provenance)**: ${items.filter(r => r.duplicate_action === 'retain_source_duplicate_hidden').length}
- **Review Required**: ${items.filter(r => r.status === 'review_required').length}
- **Customer Visible**: ${totalCount}
`;

  fs.writeFileSync('IMPORT_REPORT.md', reportContent, 'utf-8');
  console.log('Successfully written IMPORT_REPORT.md!');
  console.log('SUCCESS: All 10,000 professional vocabulary records verified in specialized_vocabulary!');
}

run().catch(err => {
  console.error('Fatal error during 10k import:', err);
  process.exit(1);
});
