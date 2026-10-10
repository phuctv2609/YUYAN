/**
 * YUYAN Specialized / Professional Vocabulary Repository
 * Data access abstraction for Authoritative Professional Chinese Vocabulary (26 real industries, 10,000 terms)
 * Live integration with Supabase (umeyobuqigbscjucxshs) with offline fallback.
 */

import { getSupabaseClient } from '../../services/supabase/client';

export interface SpecializedDomain {
  id: string;
  nameVi: string;
  nameZh: string;
  nameEn?: string;
  icon?: string;
  descriptionVi?: string;
  termCount?: number;
  sortOrder: number;
}

export interface SpecializedCategory {
  id: string;
  domainId: string;
  nameVi: string;
  nameZh: string;
  sourceUrl?: string;
  descriptionVi?: string;
  termCount: number;
  sortOrder: number;
}

export interface SpecializedTerm {
  id: string;
  categoryId: string;
  domainId: string;
  industry?: string;
  subcategory?: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet?: string;
  traditional?: string;
  partOfSpeech?: string;
  definitionVi?: string;
  sampleSentenceZh?: string;
  sampleSentencePinyin?: string;
  sampleSentenceVi?: string;
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  relatedTerms?: string[];
  tags?: string[];
  level?: string;
  entryType?: string;
  frequencyRank: number;
}

export interface SpecializedFilterOptions {
  domainId?: string;
  categoryId?: string;
  subcategory?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

const FALLBACK_26_INDUSTRIES: SpecializedDomain[] = [
  { id: 'van_phong_doanh_nghiep', nameVi: 'Văn phòng – doanh nghiệp', nameZh: '办公与企业', nameEn: 'Office & Enterprise', icon: 'Building2', descriptionVi: 'Hành chính, văn phòng, quản lý dự án, cuộc họp và quy trình doanh nghiệp', termCount: 400, sortOrder: 1 },
  { id: 'kinh_doanh_thuong_mai', nameVi: 'Kinh doanh – thương mại', nameZh: '商务与贸易', nameEn: 'Business & Trade', icon: 'TrendingUp', descriptionVi: 'Nghiệp vụ thương mại, bán hàng, đàm phán hợp đồng, đối tác và phát triển thị trường', termCount: 400, sortOrder: 2 },
  { id: 'xuat_nhap_khau', nameVi: 'Xuất nhập khẩu', nameZh: '进出口贸易', nameEn: 'Import & Export', icon: 'Ship', descriptionVi: 'Thủ tục hải quan, thông quan hàng hóa, xuất xứ, vận đơn và kiểm nghiệm', termCount: 400, sortOrder: 3 },
  { id: 'logistics_chuoi_cung_ung', nameVi: 'Logistics – chuỗi cung ứng', nameZh: '物流与供应链', nameEn: 'Logistics & Supply Chain', icon: 'Truck', descriptionVi: 'Vận tải đa phương thức, kho bãi, đóng gói phân phối và quản lý chuỗi cung ứng', termCount: 400, sortOrder: 4 },
  { id: 'san_xuat_nha_may', nameVi: 'Sản xuất – nhà máy', nameZh: '工厂生产与制造', nameEn: 'Manufacturing & Factory', icon: 'Factory', descriptionVi: 'Dây chuyền sản xuất, vận hành xưởng, quản lý năng suất, an toàn lao động và bảo trì', termCount: 400, sortOrder: 5 },
  { id: 'co_khi_che_tao', nameVi: 'Cơ khí – chế tạo', nameZh: '机械工程与制造', nameEn: 'Mechanical Engineering', icon: 'Cog', descriptionVi: 'Gia công cơ khí, máy CNC, khuôn mẫu kim loại, dung sai và linh kiện máy', termCount: 400, sortOrder: 6 },
  { id: 'dien_dien_tu', nameVi: 'Điện – điện tử', nameZh: '电气与电子工程', nameEn: 'Electrical & Electronics', icon: 'Zap', descriptionVi: 'Mạch điện tử, linh kiện bán dẫn, điện áp, thiết bị điều khiển và hệ thống điện tử', termCount: 400, sortOrder: 7 },
  { id: 'tu_dong_hoa_robot', nameVi: 'Tự động hóa – robot', nameZh: '自动化与机器人', nameEn: 'Automation & Robotics', icon: 'Bot', descriptionVi: 'Cánh tay robot, cảm biến công nghiệp, lập trình PLC, hệ thống SCADA và tự động hóa', termCount: 400, sortOrder: 8 },
  { id: 'cntt_phan_mem', nameVi: 'CNTT – phần mềm', nameZh: '信息技术与软件', nameEn: 'IT & Software', icon: 'Code', descriptionVi: 'Lập trình ứng dụng, cơ sở dữ liệu, kiến trúc hệ thống, đám mây và an ninh mạng', termCount: 400, sortOrder: 9 },
  { id: 'ai_du_lieu_cong_nghe_moi', nameVi: 'AI – dữ liệu – công nghệ mới', nameZh: '人工智能与大数据', nameEn: 'AI & Data Science', icon: 'Brain', descriptionVi: 'Trí tuệ nhân tạo, học máy, phân tích dữ liệu lớn, xử lý ngôn ngữ tự nhiên và thị giác máy tính', termCount: 380, sortOrder: 10 },
  { id: 'tai_chinh_ke_toan_ngan_hang', nameVi: 'Tài chính – kế toán – ngân hàng', nameZh: '金融、会计与银行', nameEn: 'Finance & Banking', icon: 'DollarSign', descriptionVi: 'Báo cáo tài chính, hạch toán kế toán, tín dụng ngân hàng, thanh toán quốc tế và kiểm toán', termCount: 400, sortOrder: 11 },
  { id: 'luat_phap_ly', nameVi: 'Luật – pháp lý', nameZh: '法律与法务', nameEn: 'Law & Legal', icon: 'Scale', descriptionVi: 'Văn bản pháp quy, tranh chấp thương mại, điều khoản hợp đồng và tư vấn pháp lý', termCount: 400, sortOrder: 12 },
  { id: 'nhan_su', nameVi: 'Nhân sự', nameZh: '人力资源', nameEn: 'Human Resources', icon: 'Users', descriptionVi: 'Tuyển dụng nhân tài, đào tạo nội bộ, đánh giá KPI, tiền lương và chế độ đãi ngộ', termCount: 400, sortOrder: 13 },
  { id: 'marketing_truyen_thong', nameVi: 'Marketing – truyền thông', nameZh: '市场营销与传播', nameEn: 'Marketing & PR', icon: 'Megaphone', descriptionVi: 'Chiến dịch tiếp thị, quảng bá thương hiệu, truyền thông số, quan hệ công chúng và nội dung', termCount: 400, sortOrder: 14 },
  { id: 'xay_dung_kien_truc', nameVi: 'Xây dựng – kiến trúc', nameZh: '建筑与工程', nameEn: 'Construction & Architecture', icon: 'HardHat', descriptionVi: 'Thiết kế kiến trúc, kết cấu công trình, dự toán thi công, an toàn công trường và vật liệu', termCount: 400, sortOrder: 15 },
  { id: 'hoa_hoc_vat_lieu', nameVi: 'Hóa học – vật liệu', nameZh: '化学与材料科学', nameEn: 'Chemistry & Materials', icon: 'FlaskConical', descriptionVi: 'Phản ứng hóa học, vật liệu polyme, hợp kim kim loại, hóa chất công nghiệp và kiểm nghiệm', termCount: 400, sortOrder: 16 },
  { id: 'khoa_hoc_nghien_cuu', nameVi: 'Khoa học – nghiên cứu', nameZh: '科学与研究', nameEn: 'Science & Research', icon: 'Microscope', descriptionVi: 'Phương pháp luận nghiên cứu, thử nghiệm khoa học, báo cáo học thuật và số liệu thực nghiệm', termCount: 400, sortOrder: 17 },
  { id: 'y_te_duoc', nameVi: 'Y tế – dược', nameZh: '医疗与医药', nameEn: 'Medical & Pharma', icon: 'Stethoscope', descriptionVi: 'Chẩn đoán lâm sàng, dược lý, bệnh viện, phác đồ điều trị và trang thiết bị y tế', termCount: 400, sortOrder: 18 },
  { id: 'giao_duc_hoc_thuat', nameVi: 'Giáo dục – học thuật', nameZh: '教育与学术', nameEn: 'Education & Academics', icon: 'GraduationCap', descriptionVi: 'Giáo trình đào tạo, phương pháp sư phạm, khảo thí, học thuật và quản trị trường học', termCount: 400, sortOrder: 19 },
  { id: 'du_lich_khach_san_nha_hang', nameVi: 'Du lịch – khách sạn – nhà hàng', nameZh: '旅游、酒店与餐饮', nameEn: 'Tourism & Hospitality', icon: 'Hotel', descriptionVi: 'Nghiệp vụ lễ tân, dịch vụ ẩm thực, điều hành tour, đón tiếp khách quốc tế và quản trị lưu trú', termCount: 400, sortOrder: 20 },
  { id: 'o_to_giao_thong', nameVi: 'Ô tô – giao thông', nameZh: '汽车与交通工程', nameEn: 'Automotive & Transport', icon: 'Car', descriptionVi: 'Động cơ ô tô, xe điện, an toàn giao thông, phụ tùng xe và hệ thống điều khiển lái', termCount: 400, sortOrder: 21 },
  { id: 'nong_nghiep_thuc_pham', nameVi: 'Nông nghiệp – thực phẩm', nameZh: '农业与食品工业', nameEn: 'Agriculture & Food', icon: 'Wheat', descriptionVi: 'Trồng trọt, chăn nuôi, chế biến thực phẩm, kiểm dịch vệ sinh an toàn thực phẩm và nông nghiệp sạch', termCount: 400, sortOrder: 22 },
  { id: 'moi_truong_nang_luong', nameVi: 'Môi trường – năng lượng', nameZh: '环境与新能源', nameEn: 'Environment & Energy', icon: 'Leaf', descriptionVi: 'Năng lượng tái tạo, xử lý nước thải khí thải, bảo vệ sinh thái và phát triển bền vững', termCount: 400, sortOrder: 23 },
  { id: 'thiet_ke_nghe_thuat_thoi_trang', nameVi: 'Thiết kế – nghệ thuật – thời trang', nameZh: '设计、艺术与时尚', nameEn: 'Design & Fashion', icon: 'Palette', descriptionVi: 'Thiết kế đồ họa, thời trang may mặc, mỹ thuật ứng dụng, xu hướng tạo mẫu và sáng tạo', termCount: 380, sortOrder: 24 },
  { id: 'the_thao', nameVi: 'Thể thao', nameZh: '体育与运动', nameEn: 'Sports & Fitness', icon: 'Trophy', descriptionVi: 'Huấn luyện thể chất, thi đấu thể thao, chiến thuật chuyên môn và quản lý câu lạc bộ', termCount: 400, sortOrder: 25 },
  { id: 'vien_thong_mang', nameVi: 'Viễn thông – mạng', nameZh: '电信与网络', nameEn: 'Telecom & Networks', icon: 'Radio', descriptionVi: 'Hạ tầng viễn thông, mạng 5G, cáp quang, định tuyến viễn thông và thiết bị trạm phát', termCount: 40, sortOrder: 26 },
];

class SpecializedRepository {
  private domainsCache: SpecializedDomain[] | null = null;
  private categoriesCache: Map<string, SpecializedCategory[]> = new Map();

  /**
   * Fetch all 26 authoritative specialized industries
   */
  async getDomains(): Promise<SpecializedDomain[]> {
    if (this.domainsCache && this.domainsCache.length > 0) {
      return this.domainsCache;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return FALLBACK_26_INDUSTRIES;
      }

      const { data, error } = await supabase
        .from('specialized_domains')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return FALLBACK_26_INDUSTRIES;
      }

      this.domainsCache = data.map((d: any) => {
        const fallback = FALLBACK_26_INDUSTRIES.find((f) => f.id === d.id);
        return {
          id: d.id,
          nameVi: d.name_vi,
          nameZh: d.name_zh,
          nameEn: d.name_en,
          icon: d.icon,
          descriptionVi: d.description_vi,
          termCount: d.term_count || fallback?.termCount || 400,
          sortOrder: d.sort_order || 0,
        };
      });

      return this.domainsCache;
    } catch (err) {
      console.warn('SpecializedRepository.getDomains error:', err);
      return FALLBACK_26_INDUSTRIES;
    }
  }

  /**
   * Fetch subcategories / categories dynamically from Supabase
   */
  async getCategories(domainId?: string): Promise<SpecializedCategory[]> {
    const cacheKey = domainId || '__ALL__';
    if (this.categoriesCache.has(cacheKey)) {
      return this.categoriesCache.get(cacheKey)!;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return [];
      }

      let query = supabase
        .from('specialized_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }

      const { data, error } = await query;
      if (error || !data) {
        return [];
      }

      const results: SpecializedCategory[] = data.map((c: any) => ({
        id: c.id,
        domainId: c.domain_id,
        nameVi: c.name_vi,
        nameZh: c.name_zh,
        sourceUrl: c.source_url,
        descriptionVi: c.description_vi,
        termCount: c.term_count || 0,
        sortOrder: c.sort_order || 0,
      }));

      this.categoriesCache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.warn('SpecializedRepository.getCategories error:', err);
      return [];
    }
  }

  /**
   * Search and filter specialized terms with Server-Side Pagination
   */
  async getTerms(options: SpecializedFilterOptions = {}): Promise<{ terms: SpecializedTerm[]; total: number }> {
    const { domainId, categoryId, subcategory, query, limit = 24, offset = 0 } = options;

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { terms: [], total: 0 };
      }

      let dbQuery = supabase
        .from('specialized_vocabulary')
        .select('*', { count: 'exact' });

      if (domainId && domainId !== 'all') {
        dbQuery = dbQuery.eq('domain_id', domainId);
      }

      if (categoryId && categoryId !== 'all') {
        dbQuery = dbQuery.eq('category_id', categoryId);
      } else if (subcategory && subcategory !== 'all') {
        dbQuery = dbQuery.eq('subcategory', subcategory);
      }

      if (query && query.trim()) {
        const q = query.trim();
        dbQuery = dbQuery.or(`hanzi.ilike.%${q}%,pinyin.ilike.%${q}%,vietnamese.ilike.%${q}%,han_viet.ilike.%${q}%`);
      }

      dbQuery = dbQuery.order('id', { ascending: true }).range(offset, offset + limit - 1);

      const { data, count, error } = await dbQuery;

      if (error || !data) {
        console.warn('SpecializedRepository.getTerms query error:', error?.message);
        return { terms: [], total: 0 };
      }

      const terms: SpecializedTerm[] = data.map((v: any, idx: number) => ({
        id: v.id,
        categoryId: v.category_id || v.subcategory,
        domainId: v.domain_id,
        industry: v.industry,
        subcategory: v.subcategory || undefined,
        hanzi: v.hanzi,
        pinyin: v.pinyin,
        vietnamese: v.vietnamese,
        hanViet: v.han_viet || undefined,
        traditional: v.canonical_hanzi || v.traditional || undefined,
        partOfSpeech: v.part_of_speech || '专业词组',
        definitionVi: v.definition_vi || v.vietnamese,
        sampleSentenceZh: v.example_sentence || v.sample_sentence_zh || undefined,
        sampleSentencePinyin: v.example_pinyin || v.sample_sentence_pinyin || undefined,
        sampleSentenceVi: v.example_vietnamese || v.sample_sentence_vi || undefined,
        collocations: Array.isArray(v.collocations) ? v.collocations : [],
        synonyms: Array.isArray(v.synonyms) ? v.synonyms : [],
        antonyms: Array.isArray(v.antonyms) ? v.antonyms : [],
        relatedTerms: Array.isArray(v.related_terms) ? v.related_terms : [],
        tags: Array.isArray(v.tags) ? v.tags : [],
        level: v.level || 'Chuyên ngành',
        entryType: v.entry_type || 'professional_collocation',
        frequencyRank: v.frequency_rank ? Math.round(Number(v.frequency_rank)) : offset + idx + 1,
      }));

      return { terms, total: count || terms.length };
    } catch (err) {
      console.warn('SpecializedRepository.getTerms error:', err);
      return { terms: [], total: 0 };
    }
  }

  /**
   * Fetch a single term by its authoritative ID
   */
  async getTermById(id: string): Promise<SpecializedTerm | null> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('specialized_vocabulary')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      const d = data as any;

      return {
        id: d.id,
        categoryId: d.category_id || d.subcategory || '',
        domainId: d.domain_id,
        industry: d.industry || undefined,
        subcategory: d.subcategory || undefined,
        hanzi: d.hanzi,
        pinyin: d.pinyin,
        vietnamese: d.vietnamese,
        hanViet: d.han_viet || undefined,
        traditional: d.canonical_hanzi || d.traditional || undefined,
        partOfSpeech: d.part_of_speech || '专业词组',
        definitionVi: d.definition_vi || d.vietnamese,
        sampleSentenceZh: d.example_sentence || d.sample_sentence_zh || undefined,
        sampleSentencePinyin: d.example_pinyin || d.sample_sentence_pinyin || undefined,
        sampleSentenceVi: d.example_vietnamese || d.sample_sentence_vi || undefined,
        collocations: Array.isArray(d.collocations) ? (d.collocations as any[]).map(String) : [],
        synonyms: Array.isArray(d.synonyms) ? (d.synonyms as any[]).map(String) : [],
        antonyms: Array.isArray(d.antonyms) ? (d.antonyms as any[]).map(String) : [],
        relatedTerms: Array.isArray(d.related_terms) ? (d.related_terms as any[]).map(String) : [],
        tags: Array.isArray(d.tags) ? (d.tags as any[]).map(String) : [],
        level: d.level || 'Chuyên ngành',
        entryType: d.entry_type || 'professional_collocation',
        frequencyRank: d.frequency_rank ? Math.round(Number(d.frequency_rank)) : 1,
      };
    } catch (err) {
      console.warn('SpecializedRepository.getTermById error:', err);
      return null;
    }
  }
}

export const specializedRepository = new SpecializedRepository();
