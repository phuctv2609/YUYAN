export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_word_usage_cache: {
        Row: {
          context_hash: string
          created_at: string
          explanation_json: Json
          id: string
          prompt_version: string
          updated_at: string
          word: string
        }
        Insert: {
          context_hash: string
          created_at?: string
          explanation_json: Json
          id?: string
          prompt_version: string
          updated_at?: string
          word: string
        }
        Update: {
          context_hash?: string
          created_at?: string
          explanation_json?: Json
          id?: string
          prompt_version?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      canonical_hanzi: {
        Row: {
          char: string
          created_at: string | null
          decomposition: string | null
          han_viet: string | null
          hsk_levels: number[]
          meanings: string[]
          mnemonic: string | null
          pinyin: string[]
          pinyin_search: string | null
          radical_number: number
          stroke_count: number
          stroke_data: Json
          structure: string
          structure_name_vi: string
          traditional: string
          vocabulary_ids: string[]
        }
        Insert: {
          char: string
          created_at?: string | null
          decomposition?: string | null
          han_viet?: string | null
          hsk_levels?: number[]
          meanings: string[]
          mnemonic?: string | null
          pinyin: string[]
          pinyin_search?: string | null
          radical_number: number
          stroke_count: number
          stroke_data?: Json
          structure: string
          structure_name_vi: string
          traditional: string
          vocabulary_ids?: string[]
        }
        Update: {
          char?: string
          created_at?: string | null
          decomposition?: string | null
          han_viet?: string | null
          hsk_levels?: number[]
          meanings?: string[]
          mnemonic?: string | null
          pinyin?: string[]
          pinyin_search?: string | null
          radical_number?: number
          stroke_count?: number
          stroke_data?: Json
          structure?: string
          structure_name_vi?: string
          traditional?: string
          vocabulary_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "canonical_hanzi_radical_number_fkey"
            columns: ["radical_number"]
            isOneToOne: false
            referencedRelation: "kangxi_radicals"
            referencedColumns: ["radical_number"]
          },
        ]
      }
      dictionary_entries: {
        Row: {
          content_hash: string | null
          created_at: string | null
          has_english_leakage: boolean
          id: string
          imported_at: string | null
          meanings_text: string
          meanings_vi: Json
          pinyin: string
          pinyin_normalized: string
          quality_status: string
          simplified: string
          source_commit: string
          source_key: string
          source_license: string
          source_name: string
          source_url: string
          traditional: string
          updated_at: string | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string | null
          has_english_leakage?: boolean
          id?: string
          imported_at?: string | null
          meanings_text?: string
          meanings_vi?: Json
          pinyin: string
          pinyin_normalized: string
          quality_status?: string
          simplified: string
          source_commit?: string
          source_key: string
          source_license?: string
          source_name?: string
          source_url?: string
          traditional: string
          updated_at?: string | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string | null
          has_english_leakage?: boolean
          id?: string
          imported_at?: string | null
          meanings_text?: string
          meanings_vi?: Json
          pinyin?: string
          pinyin_normalized?: string
          quality_status?: string
          simplified?: string
          source_commit?: string
          source_key?: string
          source_license?: string
          source_name?: string
          source_url?: string
          traditional?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dictionary_external_cache: {
        Row: {
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          normalized_query: string
          provider: string
          query: string
          response_json: Json
          retrieved_at: string | null
          source: string
          source_version: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id: string
          normalized_query: string
          provider: string
          query: string
          response_json: Json
          retrieved_at?: string | null
          source: string
          source_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          normalized_query?: string
          provider?: string
          query?: string
          response_json?: Json
          retrieved_at?: string | null
          source?: string
          source_version?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string | null
          hsk_level: number
          id: string
          score: number
          time_spent_seconds: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          hsk_level: number
          id?: string
          score: number
          time_spent_seconds: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          hsk_level?: number
          id?: string
          score?: number
          time_spent_seconds?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_hsk_level_fkey"
            columns: ["hsk_level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer_index: number
          created_at: string | null
          explanation: string
          hsk_level: number
          id: number
          options: Json
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer_index: number
          created_at?: string | null
          explanation: string
          hsk_level: number
          id?: number
          options: Json
          question_text: string
          question_type: string
        }
        Update: {
          correct_answer_index?: number
          created_at?: string | null
          explanation?: string
          hsk_level?: number
          id?: number
          options?: Json
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_hsk_level_fkey"
            columns: ["hsk_level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      grammar_patterns: {
        Row: {
          created_at: string
          examples: Json
          explanation: string
          hsk_level: number
          id: string
          lesson_id: string | null
          notes: string | null
          pattern: string
          sort_order: number
          structure_summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          examples?: Json
          explanation: string
          hsk_level: number
          id: string
          lesson_id?: string | null
          notes?: string | null
          pattern: string
          sort_order?: number
          structure_summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          examples?: Json
          explanation?: string
          hsk_level?: number
          id?: string
          lesson_id?: string | null
          notes?: string | null
          pattern?: string
          sort_order?: number
          structure_summary?: string | null
          title?: string
        }
        Relationships: []
      }
      hsk_learner_progress: {
        Row: {
          entry_id: string
          id: string
          learner_id: string
          notes: string | null
          simplified: string
          status: string
          updated_at: string
        }
        Insert: {
          entry_id: string
          id?: string
          learner_id: string
          notes?: string | null
          simplified: string
          status?: string
          updated_at?: string
        }
        Update: {
          entry_id?: string
          id?: string
          learner_id?: string
          notes?: string | null
          simplified?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsk_learner_progress_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "hsk_master_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      hsk_lessons: {
        Row: {
          created_at: string | null
          lesson_id: string
          lesson_number: number
          level: number
          source_file: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          lesson_id: string
          lesson_number: number
          level: number
          source_file?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          lesson_id?: string
          lesson_number?: number
          level?: number
          source_file?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsk_lessons_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      hsk_levels: {
        Row: {
          created_at: string | null
          description: string | null
          level: number
          target_vocab_count: number
          title_vi: string
          title_zh: string
          total_lessons: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          level: number
          target_vocab_count: number
          title_vi: string
          title_zh: string
          total_lessons: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          level?: number
          target_vocab_count?: number
          title_vi?: string
          title_zh?: string
          total_lessons?: number
        }
        Relationships: []
      }
      hsk_master_entries: {
        Row: {
          classifiers: string[] | null
          confidence: number
          created_at: string
          frequency: number | null
          id: string
          localization_method: string | null
          meanings_en: Json
          meanings_vi: Json
          pinyin: string
          pinyin_numeric: string | null
          pos: string[] | null
          pos_vi: string[] | null
          radical: string | null
          review_status: string
          reviewed_at: string | null
          reviewer: string | null
          simplified: string
          source_commit: string
          traditional: string | null
        }
        Insert: {
          classifiers?: string[] | null
          confidence?: number
          created_at?: string
          frequency?: number | null
          id?: string
          localization_method?: string | null
          meanings_en?: Json
          meanings_vi?: Json
          pinyin: string
          pinyin_numeric?: string | null
          pos?: string[] | null
          pos_vi?: string[] | null
          radical?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer?: string | null
          simplified: string
          source_commit?: string
          traditional?: string | null
        }
        Update: {
          classifiers?: string[] | null
          confidence?: number
          created_at?: string
          frequency?: number | null
          id?: string
          localization_method?: string | null
          meanings_en?: Json
          meanings_vi?: Json
          pinyin?: string
          pinyin_numeric?: string | null
          pos?: string[] | null
          pos_vi?: string[] | null
          radical?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer?: string | null
          simplified?: string
          source_commit?: string
          traditional?: string | null
        }
        Relationships: []
      }
      hsk_memberships: {
        Row: {
          created_at: string
          entry_id: string
          framework: string
          id: string
          is_exclusive: boolean
          is_inclusive: boolean
          level_code: string
          level_number: number
          simplified: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          framework: string
          id?: string
          is_exclusive?: boolean
          is_inclusive?: boolean
          level_code: string
          level_number: number
          simplified: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          framework?: string
          id?: string
          is_exclusive?: boolean
          is_inclusive?: boolean
          level_code?: string
          level_number?: number
          simplified?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsk_memberships_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "hsk_master_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      hsk_vocabulary: {
        Row: {
          collocations: string | null
          created_at: string | null
          hanzi: string
          hsk_level: number
          id: string
          lesson_id: string | null
          part_of_speech: string | null
          pinyin: string
          stt: number | null
          vietnamese: string
        }
        Insert: {
          collocations?: string | null
          created_at?: string | null
          hanzi: string
          hsk_level: number
          id: string
          lesson_id?: string | null
          part_of_speech?: string | null
          pinyin: string
          stt?: number | null
          vietnamese: string
        }
        Update: {
          collocations?: string | null
          created_at?: string | null
          hanzi?: string
          hsk_level?: number
          id?: string
          lesson_id?: string | null
          part_of_speech?: string | null
          pinyin?: string
          stt?: number | null
          vietnamese?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsk_vocabulary_hsk_level_fkey"
            columns: ["hsk_level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
          {
            foreignKeyName: "hsk_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hsk_lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      kangxi_radicals: {
        Row: {
          char: string
          created_at: string | null
          meaning: string
          mnemonic: string | null
          name_vi: string
          name_zh: string
          radical_number: number
          semantic_category: string
          stroke_count: number
          variants: string[] | null
        }
        Insert: {
          char: string
          created_at?: string | null
          meaning: string
          mnemonic?: string | null
          name_vi: string
          name_zh: string
          radical_number: number
          semantic_category: string
          stroke_count: number
          variants?: string[] | null
        }
        Update: {
          char?: string
          created_at?: string | null
          meaning?: string
          mnemonic?: string | null
          name_vi?: string
          name_zh?: string
          radical_number?: number
          semantic_category?: string
          stroke_count?: number
          variants?: string[] | null
        }
        Relationships: []
      }
      learner_mistakes: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          prompt: string
          resolved: boolean | null
          selected_answer: string
          user_id: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id: string
          prompt: string
          resolved?: boolean | null
          selected_answer: string
          user_id: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          prompt?: string
          resolved?: boolean | null
          selected_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      learner_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          daily_goal_minutes: number
          display_name: string
          id: string
          journey_start_date: string | null
          last_study_date: string | null
          longest_streak: number | null
          school_email: string | null
          streak_days: number
          target_hsk_level: number
          total_active_days: number | null
          total_study_minutes: number
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal_minutes?: number
          display_name?: string
          id: string
          journey_start_date?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          school_email?: string | null
          streak_days?: number
          target_hsk_level?: number
          total_active_days?: number | null
          total_study_minutes?: number
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal_minutes?: number
          display_name?: string
          id?: string
          journey_start_date?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          school_email?: string | null
          streak_days?: number
          target_hsk_level?: number
          total_active_days?: number | null
          total_study_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      learner_progress: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          last_reviewed_at: string | null
          review_count: number
          score: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id: string
          last_reviewed_at?: string | null
          review_count?: number
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          last_reviewed_at?: string | null
          review_count?: number
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_exercises: {
        Row: {
          audio_text: string | null
          correct_answer: string
          created_at: string | null
          difficulty_level: number | null
          exercise_type: string
          explanation_vi: string | null
          id: string
          lesson_id: string
          level: number
          options: Json
          question_prompt_pinyin: string | null
          question_prompt_vi: string | null
          question_prompt_zh: string
          sort_order: number | null
        }
        Insert: {
          audio_text?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty_level?: number | null
          exercise_type: string
          explanation_vi?: string | null
          id: string
          lesson_id: string
          level: number
          options?: Json
          question_prompt_pinyin?: string | null
          question_prompt_vi?: string | null
          question_prompt_zh: string
          sort_order?: number | null
        }
        Update: {
          audio_text?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty_level?: number | null
          exercise_type?: string
          explanation_vi?: string | null
          id?: string
          lesson_id?: string
          level?: number
          options?: Json
          question_prompt_pinyin?: string | null
          question_prompt_vi?: string | null
          question_prompt_zh?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hsk_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_exercises_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      lesson_sentences: {
        Row: {
          created_at: string | null
          hanzi: string
          id: string
          lesson_id: string
          pinyin: string
          sentence_index: number
          vietnamese: string
        }
        Insert: {
          created_at?: string | null
          hanzi: string
          id: string
          lesson_id: string
          pinyin: string
          sentence_index: number
          vietnamese: string
        }
        Update: {
          created_at?: string | null
          hanzi?: string
          id?: string
          lesson_id?: string
          pinyin?: string
          sentence_index?: number
          vietnamese?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sentences_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hsk_lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      pinyin_finals: {
        Row: {
          canonical_symbol: string
          category: string
          context_notes_vi: string | null
          created_at: string | null
          display_symbol: string
          id: string
          ipa: string
          is_nasal: boolean
          reduced_form_from: string | null
        }
        Insert: {
          canonical_symbol: string
          category: string
          context_notes_vi?: string | null
          created_at?: string | null
          display_symbol: string
          id: string
          ipa: string
          is_nasal?: boolean
          reduced_form_from?: string | null
        }
        Update: {
          canonical_symbol?: string
          category?: string
          context_notes_vi?: string | null
          created_at?: string | null
          display_symbol?: string
          id?: string
          ipa?: string
          is_nasal?: boolean
          reduced_form_from?: string | null
        }
        Relationships: []
      }
      pinyin_initials: {
        Row: {
          category: string
          created_at: string | null
          description_vi: string
          display_order: number
          id: string
          ipa: string
          symbol: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description_vi: string
          display_order: number
          id: string
          ipa: string
          symbol: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description_vi?: string
          display_order?: number
          id?: string
          ipa?: string
          symbol?: string
        }
        Relationships: []
      }
      pinyin_syllables: {
        Row: {
          canonical_final: string
          canonical_initial: string
          created_at: string | null
          display_pinyin: string
          display_pinyin_ascii: string
          id: string
          is_standard_orthography: boolean
          pronunciation_class: string
          tone: number
        }
        Insert: {
          canonical_final: string
          canonical_initial: string
          created_at?: string | null
          display_pinyin: string
          display_pinyin_ascii: string
          id: string
          is_standard_orthography?: boolean
          pronunciation_class?: string
          tone: number
        }
        Update: {
          canonical_final?: string
          canonical_initial?: string
          created_at?: string | null
          display_pinyin?: string
          display_pinyin_ascii?: string
          id?: string
          is_standard_orthography?: boolean
          pronunciation_class?: string
          tone?: number
        }
        Relationships: []
      }
      pinyin_tones: {
        Row: {
          created_at: string | null
          description_vi: string
          mark_example: string
          name_vi: string
          name_zh: string
          pitch_contour: string
          tone_number: number
        }
        Insert: {
          created_at?: string | null
          description_vi: string
          mark_example: string
          name_vi: string
          name_zh: string
          pitch_contour: string
          tone_number: number
        }
        Update: {
          created_at?: string | null
          description_vi?: string
          mark_example?: string
          name_vi?: string
          name_zh?: string
          pitch_contour?: string
          tone_number?: number
        }
        Relationships: []
      }
      professional_categories: {
        Row: {
          created_at: string | null
          customer_visible: boolean | null
          data_quality_gate: string | null
          description: string | null
          icon: string | null
          id: string
          name_vi: string
          name_zh: string
          sort_order: number
          source_term_count: number | null
          status: string | null
          term_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_visible?: boolean | null
          data_quality_gate?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name_vi: string
          name_zh: string
          sort_order: number
          source_term_count?: number | null
          status?: string | null
          term_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_visible?: boolean | null
          data_quality_gate?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name_vi?: string
          name_zh?: string
          sort_order?: number
          source_term_count?: number | null
          status?: string | null
          term_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      professional_vocabulary: {
        Row: {
          antonyms: string | null
          audio: string | null
          canonical_hanzi: string | null
          category_id: string
          category_vi: string | null
          category_zh: string | null
          collocations: string | null
          created_at: string | null
          customer_visible: boolean | null
          duplicate_action: string | null
          duplicate_group_id: string | null
          duplicate_hanzi: boolean | null
          duplicate_scope: string | null
          entry_type: string | null
          example_pinyin: string | null
          example_provenance: string | null
          example_review_status: string | null
          example_sentence: string | null
          example_vietnamese: string | null
          frequency: number | null
          han_viet: string | null
          hanzi: string
          icon: string | null
          id: string
          level: string | null
          pinyin: string
          publish_gate: string | null
          quality_flags: string | null
          related_terms: string | null
          source: string | null
          status: string | null
          subcategory: string | null
          synonyms: string | null
          tags: string | null
          updated_at: string | null
          version: string | null
          vietnamese: string
          word_type: string | null
        }
        Insert: {
          antonyms?: string | null
          audio?: string | null
          canonical_hanzi?: string | null
          category_id: string
          category_vi?: string | null
          category_zh?: string | null
          collocations?: string | null
          created_at?: string | null
          customer_visible?: boolean | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_hanzi?: boolean | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency?: number | null
          han_viet?: string | null
          hanzi: string
          icon?: string | null
          id: string
          level?: string | null
          pinyin: string
          publish_gate?: string | null
          quality_flags?: string | null
          related_terms?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
          synonyms?: string | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
          vietnamese: string
          word_type?: string | null
        }
        Update: {
          antonyms?: string | null
          audio?: string | null
          canonical_hanzi?: string | null
          category_id?: string
          category_vi?: string | null
          category_zh?: string | null
          collocations?: string | null
          created_at?: string | null
          customer_visible?: boolean | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_hanzi?: boolean | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency?: number | null
          han_viet?: string | null
          hanzi?: string
          icon?: string | null
          id?: string
          level?: string | null
          pinyin?: string
          publish_gate?: string | null
          quality_flags?: string | null
          related_terms?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
          synonyms?: string | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
          vietnamese?: string
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_vocabulary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "professional_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_passages: {
        Row: {
          comprehension_questions: Json | null
          created_at: string | null
          hanzi: string
          lesson_id: string
          lesson_number: number
          level: number
          pinyin: string
          repair_provenance: Json | null
          title: string
          vietnamese: string
          vocabulary_reappeared: string | null
        }
        Insert: {
          comprehension_questions?: Json | null
          created_at?: string | null
          hanzi: string
          lesson_id: string
          lesson_number: number
          level: number
          pinyin: string
          repair_provenance?: Json | null
          title: string
          vietnamese: string
          vocabulary_reappeared?: string | null
        }
        Update: {
          comprehension_questions?: Json | null
          created_at?: string | null
          hanzi?: string
          lesson_id?: string
          lesson_number?: number
          level?: number
          pinyin?: string
          repair_provenance?: Json | null
          title?: string
          vietnamese?: string
          vocabulary_reappeared?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_passages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "hsk_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "reading_passages_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "hsk_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      specialized_audio: {
        Row: {
          bucket_name: string | null
          byte_size: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          is_primary: boolean
          locale: string
          mime_type: string | null
          pinyin: string | null
          provider: string | null
          sha256: string | null
          source: string | null
          status: string
          storage_path: string | null
          target_type: string
          text_content: string
          tts_engine: string | null
          updated_at: string
          vocabulary_id: string
          voice: string | null
        }
        Insert: {
          bucket_name?: string | null
          byte_size?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_primary?: boolean
          locale?: string
          mime_type?: string | null
          pinyin?: string | null
          provider?: string | null
          sha256?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          target_type: string
          text_content: string
          tts_engine?: string | null
          updated_at?: string
          vocabulary_id: string
          voice?: string | null
        }
        Update: {
          bucket_name?: string | null
          byte_size?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_primary?: boolean
          locale?: string
          mime_type?: string | null
          pinyin?: string | null
          provider?: string | null
          sha256?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          target_type?: string
          text_content?: string
          tts_engine?: string | null
          updated_at?: string
          vocabulary_id?: string
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialized_audio_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "specialized_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialized_audio_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "specialized_vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      specialized_categories: {
        Row: {
          created_at: string | null
          customer_visible: boolean
          description_vi: string | null
          domain_id: string
          id: string
          name_vi: string
          name_zh: string
          publication_status: string
          sort_order: number | null
          source: string | null
          source_url: string | null
          source_version: string | null
          term_count: number | null
        }
        Insert: {
          created_at?: string | null
          customer_visible?: boolean
          description_vi?: string | null
          domain_id: string
          id: string
          name_vi: string
          name_zh: string
          publication_status?: string
          sort_order?: number | null
          source?: string | null
          source_url?: string | null
          source_version?: string | null
          term_count?: number | null
        }
        Update: {
          created_at?: string | null
          customer_visible?: boolean
          description_vi?: string | null
          domain_id?: string
          id?: string
          name_vi?: string
          name_zh?: string
          publication_status?: string
          sort_order?: number | null
          source?: string | null
          source_url?: string | null
          source_version?: string | null
          term_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specialized_categories_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "specialized_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      specialized_domains: {
        Row: {
          created_at: string | null
          customer_visible: boolean
          description_vi: string | null
          icon: string | null
          id: string
          name_en: string | null
          name_vi: string
          name_zh: string
          publication_status: string
          sort_order: number | null
          source: string | null
          source_version: string | null
        }
        Insert: {
          created_at?: string | null
          customer_visible?: boolean
          description_vi?: string | null
          icon?: string | null
          id: string
          name_en?: string | null
          name_vi: string
          name_zh: string
          publication_status?: string
          sort_order?: number | null
          source?: string | null
          source_version?: string | null
        }
        Update: {
          created_at?: string | null
          customer_visible?: boolean
          description_vi?: string | null
          icon?: string | null
          id?: string
          name_en?: string | null
          name_vi?: string
          name_zh?: string
          publication_status?: string
          sort_order?: number | null
          source?: string | null
          source_version?: string | null
        }
        Relationships: []
      }
      specialized_vocabulary: {
        Row: {
          antonyms: Json
          canonical_hanzi: string | null
          category_id: string
          collocations: Json | null
          created_at: string | null
          customer_visible: boolean
          definition_vi: string | null
          domain_id: string
          duplicate_action: string | null
          duplicate_group_id: string | null
          duplicate_scope: string | null
          entry_type: string | null
          example_pinyin: string | null
          example_provenance: string | null
          example_review_status: string | null
          example_sentence: string | null
          example_vietnamese: string | null
          frequency_rank: number | null
          han_viet: string | null
          hanzi: string
          id: string
          industry: string | null
          is_duplicate_secondary: boolean
          level: string | null
          part_of_speech: string | null
          pinyin: string
          publication_status: string
          publish_gate: string
          quality_flags: Json
          related_terms: Json
          review_notes: string | null
          review_required: boolean
          sample_sentence_pinyin: string | null
          sample_sentence_vi: string | null
          sample_sentence_zh: string | null
          source: string | null
          source_record_id: string | null
          source_version: string | null
          subcategory: string | null
          synonyms: Json
          tags: Json
          traditional: string | null
          vietnamese: string
        }
        Insert: {
          antonyms?: Json
          canonical_hanzi?: string | null
          category_id: string
          collocations?: Json | null
          created_at?: string | null
          customer_visible?: boolean
          definition_vi?: string | null
          domain_id: string
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency_rank?: number | null
          han_viet?: string | null
          hanzi: string
          id: string
          industry?: string | null
          is_duplicate_secondary?: boolean
          level?: string | null
          part_of_speech?: string | null
          pinyin: string
          publication_status?: string
          publish_gate?: string
          quality_flags?: Json
          related_terms?: Json
          review_notes?: string | null
          review_required?: boolean
          sample_sentence_pinyin?: string | null
          sample_sentence_vi?: string | null
          sample_sentence_zh?: string | null
          source?: string | null
          source_record_id?: string | null
          source_version?: string | null
          subcategory?: string | null
          synonyms?: Json
          tags?: Json
          traditional?: string | null
          vietnamese: string
        }
        Update: {
          antonyms?: Json
          canonical_hanzi?: string | null
          category_id?: string
          collocations?: Json | null
          created_at?: string | null
          customer_visible?: boolean
          definition_vi?: string | null
          domain_id?: string
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency_rank?: number | null
          han_viet?: string | null
          hanzi?: string
          id?: string
          industry?: string | null
          is_duplicate_secondary?: boolean
          level?: string | null
          part_of_speech?: string | null
          pinyin?: string
          publication_status?: string
          publish_gate?: string
          quality_flags?: Json
          related_terms?: Json
          review_notes?: string | null
          review_required?: boolean
          sample_sentence_pinyin?: string | null
          sample_sentence_vi?: string | null
          sample_sentence_zh?: string | null
          source?: string | null
          source_record_id?: string | null
          source_version?: string | null
          subcategory?: string | null
          synonyms?: Json
          tags?: Json
          traditional?: string | null
          vietnamese?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialized_vocabulary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "specialized_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialized_vocabulary_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "specialized_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      study_activity_logs: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string | null
          duration_seconds: number | null
          entity_id: string | null
          id: string
          score: number | null
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          id?: string
          score?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      professional_vocabulary_customer: {
        Row: {
          antonyms: string | null
          audio: string | null
          canonical_hanzi: string | null
          category_id: string | null
          category_vi: string | null
          category_zh: string | null
          collocations: string | null
          created_at: string | null
          customer_visible: boolean | null
          duplicate_action: string | null
          duplicate_group_id: string | null
          duplicate_hanzi: boolean | null
          duplicate_scope: string | null
          entry_type: string | null
          example_pinyin: string | null
          example_provenance: string | null
          example_review_status: string | null
          example_sentence: string | null
          example_vietnamese: string | null
          frequency: number | null
          han_viet: string | null
          hanzi: string | null
          icon: string | null
          id: string | null
          level: string | null
          pinyin: string | null
          publish_gate: string | null
          quality_flags: string | null
          related_terms: string | null
          source: string | null
          status: string | null
          subcategory: string | null
          synonyms: string | null
          tags: string | null
          updated_at: string | null
          version: string | null
          vietnamese: string | null
          word_type: string | null
        }
        Insert: {
          antonyms?: string | null
          audio?: string | null
          canonical_hanzi?: string | null
          category_id?: string | null
          category_vi?: string | null
          category_zh?: string | null
          collocations?: string | null
          created_at?: string | null
          customer_visible?: boolean | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_hanzi?: boolean | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency?: number | null
          han_viet?: string | null
          hanzi?: string | null
          icon?: string | null
          id?: string | null
          level?: string | null
          pinyin?: string | null
          publish_gate?: string | null
          quality_flags?: string | null
          related_terms?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
          synonyms?: string | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
          vietnamese?: string | null
          word_type?: string | null
        }
        Update: {
          antonyms?: string | null
          audio?: string | null
          canonical_hanzi?: string | null
          category_id?: string | null
          category_vi?: string | null
          category_zh?: string | null
          collocations?: string | null
          created_at?: string | null
          customer_visible?: boolean | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_hanzi?: boolean | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency?: number | null
          han_viet?: string | null
          hanzi?: string | null
          icon?: string | null
          id?: string | null
          level?: string | null
          pinyin?: string | null
          publish_gate?: string | null
          quality_flags?: string | null
          related_terms?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
          synonyms?: string | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
          vietnamese?: string | null
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_vocabulary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "professional_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      specialized_audio_ready: {
        Row: {
          bucket_name: string | null
          byte_size: number | null
          duration_ms: number | null
          id: string | null
          locale: string | null
          mime_type: string | null
          pinyin: string | null
          provider: string | null
          sha256: string | null
          storage_path: string | null
          target_type: string | null
          text_content: string | null
          tts_engine: string | null
          vocabulary_id: string | null
          voice: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialized_audio_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "specialized_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialized_audio_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "specialized_vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      specialized_catalog: {
        Row: {
          antonyms: Json | null
          canonical_hanzi: string | null
          category_id: string | null
          collocations: Json | null
          created_at: string | null
          customer_visible: boolean | null
          definition_vi: string | null
          domain_id: string | null
          duplicate_action: string | null
          duplicate_group_id: string | null
          duplicate_scope: string | null
          entry_type: string | null
          example_pinyin: string | null
          example_provenance: string | null
          example_review_status: string | null
          example_sentence: string | null
          example_vietnamese: string | null
          frequency_rank: number | null
          han_viet: string | null
          hanzi: string | null
          id: string | null
          is_duplicate_secondary: boolean | null
          level: string | null
          part_of_speech: string | null
          pinyin: string | null
          publication_status: string | null
          publish_gate: string | null
          quality_flags: Json | null
          related_terms: Json | null
          review_notes: string | null
          review_required: boolean | null
          sample_sentence_pinyin: string | null
          sample_sentence_vi: string | null
          sample_sentence_zh: string | null
          source: string | null
          source_record_id: string | null
          source_version: string | null
          subcategory: string | null
          synonyms: Json | null
          tags: Json | null
          traditional: string | null
          vietnamese: string | null
        }
        Insert: {
          antonyms?: Json | null
          canonical_hanzi?: string | null
          category_id?: string | null
          collocations?: Json | null
          created_at?: string | null
          customer_visible?: boolean | null
          definition_vi?: string | null
          domain_id?: string | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency_rank?: number | null
          han_viet?: string | null
          hanzi?: string | null
          id?: string | null
          is_duplicate_secondary?: boolean | null
          level?: string | null
          part_of_speech?: string | null
          pinyin?: string | null
          publication_status?: string | null
          publish_gate?: string | null
          quality_flags?: Json | null
          related_terms?: Json | null
          review_notes?: string | null
          review_required?: boolean | null
          sample_sentence_pinyin?: string | null
          sample_sentence_vi?: string | null
          sample_sentence_zh?: string | null
          source?: string | null
          source_record_id?: string | null
          source_version?: string | null
          subcategory?: string | null
          synonyms?: Json | null
          tags?: Json | null
          traditional?: string | null
          vietnamese?: string | null
        }
        Update: {
          antonyms?: Json | null
          canonical_hanzi?: string | null
          category_id?: string | null
          collocations?: Json | null
          created_at?: string | null
          customer_visible?: boolean | null
          definition_vi?: string | null
          domain_id?: string | null
          duplicate_action?: string | null
          duplicate_group_id?: string | null
          duplicate_scope?: string | null
          entry_type?: string | null
          example_pinyin?: string | null
          example_provenance?: string | null
          example_review_status?: string | null
          example_sentence?: string | null
          example_vietnamese?: string | null
          frequency_rank?: number | null
          han_viet?: string | null
          hanzi?: string | null
          id?: string | null
          is_duplicate_secondary?: boolean | null
          level?: string | null
          part_of_speech?: string | null
          pinyin?: string | null
          publication_status?: string | null
          publish_gate?: string | null
          quality_flags?: Json | null
          related_terms?: Json | null
          review_notes?: string | null
          review_required?: boolean | null
          sample_sentence_pinyin?: string | null
          sample_sentence_vi?: string | null
          sample_sentence_zh?: string | null
          source?: string | null
          source_record_id?: string | null
          source_version?: string | null
          subcategory?: string | null
          synonyms?: Json | null
          tags?: Json | null
          traditional?: string | null
          vietnamese?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialized_vocabulary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "specialized_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialized_vocabulary_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "specialized_domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_dictionary_word_detail: { Args: { p_id: string }; Returns: Json }
      get_hsk_word_master_detail: {
        Args: { p_entry_id: string; p_learner_id?: string }
        Returns: Json
      }
      search_cvdict_entries: {
        Args: { p_limit?: number; p_offset?: number; p_query: string }
        Returns: {
          has_english_leakage: boolean
          id: string
          meanings_vi: Json
          pinyin: string
          pinyin_normalized: string
          quality_status: string
          score: number
          simplified: string
          source_license: string
          source_name: string
          total_count: number
          traditional: string
        }[]
      }
      search_dictionary: {
        Args: { p_limit?: number; p_offset?: number; p_query: string }
        Returns: Json
      }
      search_hanzi_master: {
        Args: {
          p_hsk_level?: number
          p_limit?: number
          p_max_strokes?: number
          p_min_strokes?: number
          p_offset?: number
          p_query?: string
          p_radical?: number
        }
        Returns: Json
      }
      search_hsk_master_words: {
        Args: {
          p_framework?: string
          p_learner_id?: string
          p_level_code?: string
          p_limit?: number
          p_list_type?: string
          p_offset?: number
          p_pos?: string
          p_query?: string
          p_radical?: string
          p_status?: string
        }
        Returns: {
          classifiers: string[]
          confidence: number
          frequency: number
          id: string
          learner_status: string
          levels_summary: Json
          meanings_en: Json
          meanings_vi: Json
          pinyin: string
          pinyin_numeric: string
          pos: string[]
          pos_vi: string[]
          radical: string
          review_status: string
          simplified: string
          total_count: number
          traditional: string
        }[]
      }
      set_hsk_learner_word_status: {
        Args: {
          p_entry_id: string
          p_learner_id: string
          p_notes?: string
          p_simplified: string
          p_status: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
