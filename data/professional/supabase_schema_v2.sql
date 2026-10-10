-- YUYAN Professional Vocabulary v2 production-safe schema

create table if not exists public.professional_categories (
  id text primary key,
  name_vi text not null,
  name_zh text not null,
  description text,
  icon text,
  sort_order int not null,
  term_count int default 0,
  status text default ''active'',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint professional_categories_status_chk check (status in (''active'',''inactive''))
);

create table if not exists public.professional_vocabulary (
  id text primary key,
  hanzi text not null,
  pinyin text not null,
  word_type text,
  vietnamese text not null,
  han_viet text,
  category_id text not null references public.professional_categories(id),
  category_vi text,
  category_zh text,
  subcategory text,
  level text,
  entry_type text,
  example_sentence text,
  example_pinyin text,
  example_vietnamese text,
  collocations text,
  synonyms text,
  antonyms text,
  related_terms text,
  audio text,
  frequency numeric,
  tags text,
  icon text,
  duplicate_hanzi boolean default false,
  canonical_hanzi text,
  status text default ''review_required'',
  source text,
  version text,
  example_provenance text,
  example_review_status text,
  quality_flags text,
  customer_visible boolean default false,
  publish_gate text default ''blocked_review_required'',
  duplicate_group_id text,
  duplicate_scope text,
  duplicate_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint professional_vocabulary_status_chk check (status in (''draft'',''review_required'',''approved'',''published'',''rejected'')),
  constraint professional_vocabulary_publish_gate_chk check (publish_gate in (''blocked_review_required'',''ready_for_publish'',''published''))
);

create index if not exists idx_prof_vocab_category on public.professional_vocabulary(category_id);
create index if not exists idx_prof_vocab_hanzi on public.professional_vocabulary(hanzi);
create index if not exists idx_prof_vocab_canonical_hanzi on public.professional_vocabulary(canonical_hanzi);
create index if not exists idx_prof_vocab_pinyin on public.professional_vocabulary(pinyin);
create index if not exists idx_prof_vocab_subcategory on public.professional_vocabulary(subcategory);
create index if not exists idx_prof_vocab_status on public.professional_vocabulary(status);
create index if not exists idx_prof_vocab_customer_visible on public.professional_vocabulary(customer_visible);
create index if not exists idx_prof_vocab_duplicate_group on public.professional_vocabulary(duplicate_group_id);

create or replace view public.professional_vocabulary_customer as
select *
from public.professional_vocabulary
where status = ''published''
  and customer_visible = true
  and duplicate_action in (''unique'',''keep_primary'');
