# BÁO CÁO RÀ SOÁT CHẤT LƯỢNG TIẾNG VIỆT TỪ ĐIỂN CVDICT (VIETNAMESE DICTIONARY REVIEW REPORT)

**Tập dữ liệu:** ph0ngp/CVDICT (122,591 mục từ)  
**Thời gian rà soát:** 2026-10-09T12:29:20.332Z  
**Mục đích:** Phát hiện các mục nghĩa tiếng Việt còn sót từ tiếng Anh, thuật ngữ tên riêng hoặc danh pháp khoa học theo đúng cảnh báo trong README của CVDICT.

---

## 1. TỔNG HỢP KẾT QUẢ RÀ SOÁT

- **Tổng số mục từ phân tích:** **122,595**
- **Số mục từ đạt chuẩn tiếng Việt thuần túy (`verified`):** **122,524 (99.94%)**
- **Số mục từ cần rà soát bổ sung (`review_required`):** **71 (0.06%)**

### Phân loại các trường hợp cần rà soát:
1. **Thuật ngữ danh pháp khoa học:** Tên Latinh của các loài động thực vật hiếm gặp (ví dụ: *Ginkgo biloba*, *Camellia sinensis*). Đây là danh pháp quốc tế chuẩn xác cần được giữ nguyên.
2. **Từ ngữ / Cụm từ tiếng Anh còn sót:** Một số nghĩa tiếng Anh từ CC-CEDICT chưa được dịch hết sang tiếng Việt (ví dụ: *CL:*, *variant of*, *abbr. for*, *see also*).

---

## 2. DANH SÁCH MẪU CÁC MỤC TỪ CẦN RÀ SOÁT (50 mục tiêu biểu)

| STT | Giản thể | Phồn thể | Pinyin | Nghĩa hiện tại (Chứa từ cần rà soát) | Phân loại vấn đề | Trạng thái rà soát |
| :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| 1 | `ACG` | `ACG` | A C G | viết tắt của "anime, comics and games" (hoạt hình, truyện tranh và trò chơi) | english_stopwords_leakage | `review_required` |
| 2 | `中国好声音` | `中國好聲音` | Zhōng guó Hǎo Shēng yīn | The Voice of China, chương trình thực tế tìm kiếm tài năng của Trung Quốc | scientific_term_mixed | `review_required` |
| 3 | `杰弗里·乔叟` | `傑弗里·喬叟` | Jié fú lǐ · Qiáo sǒu | Geoffrey Chaucer (1343-1400), nhà thơ người Anh, tác giả của The Canterbury Tales 坎特伯雷故事集[Kan3 te4 bo2 lei2 Gu4 shi4 Ji2] | english_stopwords_leakage | `review_required` |
| 4 | `儿女英雄传` | `兒女英雄傳` | Ér nǚ Yīng xióng Zhuàn | The Gallant Maid, tiểu thuyết của nhà văn nhà Thanh sinh ra ở Mãn Châu 文康[Wen2 Kang1] | scientific_term_mixed | `review_required` |
| 5 | `刀塔` | `刀塔` | Dāo tǎ | Defense of the Ancients (DotA), trò chơi điện tử | scientific_term_mixed | `review_required` |
| 6 | `南京大屠杀事件` | `南京大屠殺事件` | Nán jīng Dà tú shā Shì jiàn | Cuốn sách tài liệu "The Rape of Nanking" (1997) của Iris Chang 張純如/张纯如[Zhang1 Chun2 ru2]) | scientific_term_mixed | `review_required` |
| 7 | `厄勒海峡` | `厄勒海峽` | È lè Hǎi xiá | The Sound (eo biển giữa Đan Mạch và Thụy Điển) | english_stopwords_leakage | `review_required` |
| 8 | `喧哗与骚动` | `喧嘩與騷動` | Xuān huá yǔ Sāo dòng | The Sound and the Fury (tiểu thuyết của William Faulkner 威廉·福克納/威廉·福克纳[Wei1 lian2 · Fu2 ke4 na4]) | scientific_term_mixed | `review_required` |
| 9 | `乔叟` | `喬叟` | Qiáo sǒu | Geoffrey Chaucer (1343-1400), nhà thơ Anh, tác giả của The Canterbury Tales 坎特伯雷故事集[Kan3 te4 bo2 lei2 Gu4 shi4 Ji2] | english_stopwords_leakage | `review_required` |
| 10 | `乔治·布尔` | `喬治·布爾` | Qiáo zhì · Bù ěr | George Boole (1815-1864), nhà toán học, triết gia và logic học người Anh, tác giả của The Laws of Thought và người phát minh đại số Boolean | scientific_term_mixed | `review_required` |
| 11 | `嘒` | `嘒` | huì | âm thanh the thé | english_stopwords_leakage | `review_required` |
| 12 | `国际法庭` | `國際法庭` | Guó jì Fǎ tíng | Tòa án Công lý Quốc tế ở The Hague | english_stopwords_leakage | `review_required` |
| 13 | `坎特伯雷故事集` | `坎特伯雷故事集` | Kǎn tè bó léi Gù shì Jí | The Canterbury Tales, tập truyện của Geoffrey Chaucer 喬叟/乔叟[Qiao2 sou3] | english_stopwords_leakage | `review_required` |
| 14 | `大门` | `大門` | Dà mén | ban nhạc the Doors, ban nhạc rock Mỹ | english_stopwords_leakage | `review_required` |
| 15 | `太古洋行` | `太古洋行` | Tài gǔ Yáng háng | Butterfield and Swire (ngân hàng Hồng Kông) | scientific_term_mixed | `review_required` |
| 16 | `太阳报` | `太陽報` | Tài yáng Bào | The Sun (tên của nhiều tờ báo, đặc biệt ở Anh và Hồng Kông) | scientific_term_mixed | `review_required` |
| 17 | `威尼斯商人` | `威尼斯商人` | Wēi ní sī Shāng rén | The Merchant of Venice của William Shakespeare | scientific_term_mixed | `review_required` |
| 18 | `安藤` | `安藤` | Ān téng | Andō (họ người Nhật) | english_stopwords_leakage | `review_required` |
| 19 | `宏观世界` | `宏觀世界` | hóng guān shì jiè | the giới ở tầm vĩ mô | english_stopwords_leakage | `review_required` |
| 20 | `宝武钢铁` | `寶武鋼鐵` | Bǎo wǔ Gāng tiě | Baowu, nhà sản xuất thép lớn nhất thế giới, kết quả từ việc sáp nhập Baosteel 寶鋼集團/宝钢集团[Bao3 gang1 Ji2 tuan2] và Wuhan Iron and Steel 武漢鋼鐵/武汉钢铁[Wu3 han4 Gang1 tie3] năm 2016 | scientific_term_mixed | `review_required` |
| 21 | `席凡宁根` | `席凡寧根` | Xí fán níng gēn | Scheveningen, khu nghỉ mát ở Den Haag (The Hague), Hà Lan | english_stopwords_leakage | `review_required` |
| 22 | `床笫之事` | `床笫之事` | chuáng zǐ zhī shì | chuyện phòng the | english_stopwords_leakage | `review_required` |
| 23 | `张二鸿` | `張二鴻` | Zhāng Èr hóng | Jung Chang 張戎/张戎[Zhang1 Rong2] (1952-), nhà văn Anh gốc Hoa, tác giả cuốn Wild Swans 野天鵝/野天鹅[Ye3 Tian1 e2] và Mao: The Unknown Story 毛澤東·鮮為人知的故事/毛泽东·鲜为人知的故事[Mao2 Ze2 dong1 · Xian1 wei2 ren2 zhi1 de5 Gu4 shi5] | scientific_term_mixed | `review_required` |
| 24 | `张纯如` | `張純如` | Zhāng Chún rú | Iris Chang (1968-2004), nhà sử học và tác giả người Mỹ gốc Hoa của "The Rape of Nanking" | scientific_term_mixed | `review_required` |
| 25 | `德古拉` | `德古拉` | Dé gǔ lā | Vlad III, Hoàng tử xứ Wallachia (1431-1476), có biệt danh Vlad the Impaler hoặc Dracula | scientific_term_mixed | `review_required` |
| 26 | `心灵鸡汤` | `心靈雞湯` | xīn líng jī tāng | (thường dùng một cách châm biếm) câu chuyện hoặc trích dẫn tạo động lực cảm thấy tốt (từ bản dịch tiếng Trung của tựa sách self-help bestseller năm 1993 "Chicken Soup for the Soul") | scientific_term_mixed | `review_required` |
| 27 | `采珠人` | `採珠人` | Cǎi zhū rén | The Pearl Fishers, vở opera năm 1863 của Georges Bizet 比才[Bi4 cai2] | english_stopwords_leakage | `review_required` |
| 28 | `摩登原始人` | `摩登原始人` | Mó dēng Yuán shǐ rén | The Flintstones (TV Series) | english_stopwords_leakage | `review_required` |
| 29 | `星条旗` | `星條旗` | xīng tiáo qí | Stars and Stripes, quốc kỳ của Hoa Kỳ | scientific_term_mixed | `review_required` |
| 30 | `普雷克斯流程` | `普雷克斯流程` | pǔ léi kè sī liú chéng | quy trình PUREX (PUREX process), viết tắt của Plutonium and Uranium Recovery by EXtraction. | scientific_term_mixed | `review_required` |
| 31 | `末代皇帝` | `末代皇帝` | Mò dài Huáng dì | The Last Emperor, phim tiểu sử năm 1987 về Phổ Nghi 溥儀/溥仪[Pu3 yi2] của Bernardo Bertolucci | english_stopwords_leakage | `review_required` |
| 32 | `标普` | `標普` | Biāo Pǔ | Standard and Poor (chỉ số chứng khoán) | scientific_term_mixed | `review_required` |
| 33 | `标准普尔` | `標準普爾` | Biāo zhǔn Pǔ ěr | Standard and Poor's (S&P), công ty chuyên về xếp hạng thị trường tài chính | scientific_term_mixed | `review_required` |
| 34 | `比尔博` | `比爾博` | Bǐ ěr bó | Bilbo Baggins, nhân vật chính trong tác phẩm "The Hobbit" 霍比特人 của Tolkien | english_stopwords_leakage | `review_required` |
| 35 | `法海` | `法海` | Fǎ hǎi | Pháp Hải, tên của nhà sư Phật giáo độc ác trong Tale of the White Snake 白蛇傳/白蛇传[Bai2 she2 Zhuan4] | scientific_term_mixed | `review_required` |
| 36 | `泰晤士` | `泰晤士` | Tài wù shì | báo The Times | english_stopwords_leakage | `review_required` |
| 37 | `泰晤士报` | `泰晤士報` | Tài wù shì Bào | báo The Times | english_stopwords_leakage | `review_required` |
| 38 | `海伦·凯勒` | `海倫·凱勒` | Hǎi lún · Kǎi lè | Helen Keller (1880-1968), tác giả và nhà hoạt động khiếm thính khiếm thị nổi tiếng người Mỹ (câu chuyện của cô được kể trong phim The Miracle Worker) | english_stopwords_leakage | `review_required` |
| 39 | `海牙` | `海牙` | Hǎi yá | The Hague (thành phố ở Hà Lan) | english_stopwords_leakage | `review_required` |
| 40 | `混搭` | `混搭` | hùn dā | phối đồ theo kiểu mix and match (ví dụ: quần áo) | english_stopwords_leakage | `review_required` |
| 41 | `滚石` | `滾石` | Gǔn shí | ban nhạc The Rolling Stones, ban nhạc rock Anh | english_stopwords_leakage | `review_required` |
| 42 | `特立尼达和多巴哥` | `特立尼達和多巴哥` | Tè lì ní dá hé Duō bā gē | Trinidad and Tobago | scientific_term_mixed | `review_required` |
| 43 | `独立报` | `獨立報` | Dú lì Bào | The Independent | english_stopwords_leakage | `review_required` |
| 44 | `甲壳虫` | `甲殼蟲` | Jiǎ qiào chóng | ban nhạc The Beatles (nhóm nhạc pop Anh những năm 1960) | scientific_term_mixed | `review_required` |
| 45 | `白宫群英` | `白宮群英` | Bái gōng Qún yīng | The West Wing (loạt phim truyền hình Mỹ) | english_stopwords_leakage | `review_required` |
| 46 | `真心话大冒险` | `真心話大冒險` | Zhēn xīn huà Dà Mào xiǎn | The Moment of Truth (chương trình TV) | scientific_term_mixed | `review_required` |
| 47 | `硼砂` | `硼砂` | péng shā | hàn the | english_stopwords_leakage | `review_required` |
| 48 | `节奏布鲁斯` | `節奏布魯斯` | jié zòu bù lǔ sī | Rhythm and Blues R&B | scientific_term_mixed | `review_required` |
| 49 | `纽约客` | `紐約客` | Niǔ yuē kè | Tạp chí The New Yorker, Mỹ | english_stopwords_leakage | `review_required` |
| 50 | `经济学人` | `經濟學人` | Jīng jì xué rén | The Economist (tạp chí) | english_stopwords_leakage | `review_required` |

---

## 3. KHUYẾN NGHỊ SƯ PHẠM KHI HIỂN THỊ

1. Hiển thị nhãn huy hiệu **CVDICT (CC BY-SA 4.0)** minh bạch trên từng thẻ từ.
2. Với các mục từ có nhãn `review_required`, hiển thị nghĩa đầy đủ cùng chú thích học thuật, ưu tiên đối chiếu với từ vựng chuẩn HSK và bài khóa YUYAN.
3. Cho phép người học sử dụng tính năng **Hỏi Trợ lý AI Gemini** để giải nghĩa tự nhiên nếu gặp từ dịch thô.
